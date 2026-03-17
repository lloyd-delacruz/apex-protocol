/**
 * Admin routes
 *
 * All routes require authentication (authenticateToken) AND admin role
 * (requireAdmin). In development both checks are bypassed automatically.
 *
 * POST /api/admin/exercises/import
 *   Triggers a controlled import/sync of exercises from the ExerciseDB API.
 *   Returns a concise ImportResult summary (imported / updated / skipped / failed).
 *   Never exposes API keys or raw upstream error messages in responses.
 *
 * Body params (all optional):
 *   bodyPart  : string  — import only this ExerciseDB body-part category
 *   equipment : string  — import only this equipment type
 *   pageSize  : number  — exercises per API page (1–1300, default 100)
 *   maxPages  : number  — maximum pages to fetch (default: all)
 *   delayMs   : number  — delay between API requests in ms (default 500)
 *
 * When bodyPart is provided it takes priority over equipment.
 * When neither is provided the full library is imported.
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminAuth';
import { ExerciseImportService } from '../services/ExerciseImportService';
import { ExerciseClassificationService } from '../services/ExerciseClassificationService';
import prisma from '../db/prisma';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

// ─── POST /api/admin/exercises/import ─────────────────────────────────────────

router.post('/exercises/import', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body ?? {};

    const bodyPart =
      typeof body.bodyPart === 'string' ? body.bodyPart.toLowerCase().trim() : undefined;
    const equipment =
      typeof body.equipment === 'string' ? body.equipment.toLowerCase().trim() : undefined;

    // Parse and clamp numeric options
    const rawPageSize = body.pageSize !== undefined ? parseInt(String(body.pageSize), 10) : NaN;
    const rawMaxPages = body.maxPages !== undefined ? parseInt(String(body.maxPages), 10) : NaN;
    const rawDelayMs  = body.delayMs  !== undefined ? parseInt(String(body.delayMs),  10) : NaN;

    const options = {
      ...(Number.isFinite(rawPageSize) && { pageSize: Math.max(1, Math.min(rawPageSize, 1300)) }),
      ...(Number.isFinite(rawMaxPages) && { maxPages: Math.max(1, rawMaxPages) }),
      ...(Number.isFinite(rawDelayMs)  && { delayMs:  Math.max(0, rawDelayMs) }),
    };

    let result;
    if (bodyPart) {
      result = await ExerciseImportService.importByBodyPart(bodyPart);
    } else if (equipment) {
      result = await ExerciseImportService.importByEquipment(equipment);
    } else {
      result = await ExerciseImportService.importAll(options);
    }

    res.json({
      success: true,
      data: {
        imported:   result.imported,
        updated:    result.updated,
        skipped:    result.skipped,
        failed:     result.failed,
        errorCount: result.errors.length,
        errors:     result.errors.map((e) => ({
          externalId: e.externalId,
          name:       e.name,
          error:      e.error,
        })),
      },
      error: null,
    });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    // Log full error server-side; never forward sensitive details (API keys, DB errors)
    console.error('[Admin] Exercise import failed:', e.message);
    res.status(e.statusCode ?? 500).json({
      success: false,
      data:    null,
      error:   'Import failed. Check server logs for details.',
    });
  }
});

// ─── POST /api/admin/exercises/reclassify ─────────────────────────────────────

/**
 * Re-runs ExerciseClassificationService over existing exercises and writes
 * updated taxonomy fields (movementPattern, exerciseType, goalTags, difficulty,
 * isCompound, isUnilateral) back to the database.
 *
 * Body params:
 *   onlyImported : boolean  — when true (default), only re-classify exercises
 *                             that originated from an external import (externalSource is set).
 *                             Set to false to also re-classify hand-authored exercises.
 *   dryRun       : boolean  — when true, classify and return counts without writing to DB.
 *   limit        : number   — max exercises to process (default: all).
 */
router.post('/exercises/reclassify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body          = req.body ?? {};
    const onlyImported  = body.onlyImported !== false; // default true
    const dryRun        = body.dryRun === true || body.dryRun === 'true';
    const limit         = body.limit ? Math.max(1, parseInt(String(body.limit), 10) || 0) : undefined;

    const where = onlyImported
      ? { externalSource: { not: null as string | null }, isActive: true, deletedAt: null }
      : { isActive: true, deletedAt: null };

    const exercises = await prisma.exercise.findMany({
      where,
      select: {
        id:            true,
        name:          true,
        equipment:     true,
        externalId:    true,
        externalSource: true,
      },
      orderBy: { name: 'asc' },
      ...(limit !== undefined && { take: limit }),
    });

    let reclassified = 0;
    let skipped      = 0;
    let failed       = 0;

    for (const ex of exercises) {
      try {
        const result = ExerciseClassificationService.classify({
          name:      ex.name,
          equipment: ex.equipment,
        });

        if (!dryRun) {
          await prisma.exercise.update({
            where: { id: ex.id },
            data: {
              movementPattern: result.movementPattern,
              exerciseType:    result.exerciseType,
              goalTags:        result.goalTags,
              difficulty:      result.difficulty,
              isCompound:      result.isCompound,
              isUnilateral:    result.isUnilateral,
            },
          });
        }
        reclassified++;
      } catch (err: unknown) {
        console.error(`[Admin Reclassify] Failed for "${ex.name}":`, (err as Error).message);
        failed++;
      }
    }

    res.json({
      success: true,
      data: {
        total:         exercises.length,
        reclassified,
        skipped,
        failed,
        dryRun,
        onlyImported,
      },
      error: null,
    });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    console.error('[Admin] Reclassify failed:', e.message);
    res.status(e.statusCode ?? 500).json({
      success: false,
      data:    null,
      error:   'Reclassify failed. Check server logs for details.',
    });
  }
});

// ─── PATCH /api/admin/exercises/:id ───────────────────────────────────────────

/**
 * Manually set the mediaUrl (gifUrl) for a single exercise.
 * Useful for backfilling seeded exercises whose names don't match ExerciseDB.
 *
 * Body: { mediaUrl: string | null }
 */
router.patch('/exercises/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    if (!('mediaUrl' in body)) {
      res.status(400).json({ success: false, data: null, error: 'mediaUrl is required in request body' });
      return;
    }

    const mediaUrl = body.mediaUrl === null || body.mediaUrl === '' ? null : String(body.mediaUrl);

    const exercise = await prisma.exercise.findFirst({ where: { id } });
    if (!exercise) {
      res.status(404).json({ success: false, data: null, error: 'Exercise not found' });
      return;
    }

    const updated = await prisma.exercise.update({
      where: { id },
      data: { mediaUrl },
    });

    res.json({ success: true, data: { id: updated.id, name: updated.name, mediaUrl: updated.mediaUrl }, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    console.error('[Admin] Exercise mediaUrl update failed:', e.message);
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: 'Update failed. Check server logs.' });
  }
});

export default router;
