/**
 * ExerciseImportService
 *
 * Purpose:  Fetch raw exercise data from ExerciseDB and persist it into
 *           PostgreSQL with full deduplication and taxonomy normalisation.
 *
 * Inputs:   ExerciseDbExercise records from ExerciseDbService.
 * Outputs:  ImportResult — counts of imported / updated / skipped / failed.
 *
 * Deduplication strategy (in priority order):
 *   1. Match on (externalId, externalSource="exercisedb")  — exact re-import.
 *   2. Match on name (case-insensitive)                    — enrich local exercise.
 *   3. No match                                            — create new record.
 *
 * When enriching a LOCAL exercise (strategy 2), only the sync-metadata and
 * missing media fields are written — hand-authored taxonomy is preserved.
 * When updating a PREVIOUSLY IMPORTED exercise (strategy 1), all mapped
 * fields are refreshed from the API response.
 *
 * Dependencies: ExerciseDbService (HTTP), prisma (database).
 */

import prisma from '../db/prisma';
import { ExerciseDbService, ExerciseDbExercise } from './ExerciseDbService';
import { ExerciseClassificationService } from './ExerciseClassificationService';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ImportError {
  externalId: string;
  name: string;
  error: string;
}

export interface ImportResult {
  imported: number;   // new rows created
  updated: number;    // existing rows refreshed
  skipped: number;    // no changes required
  failed: number;     // errors — check .errors[]
  errors: ImportError[];
}

export interface ImportOptions {
  /** Exercises per API page request. Default 100. Max ~1300 (full library). */
  pageSize?: number;
  /** Maximum number of pages to fetch. Omit to fetch all. */
  maxPages?: number;
  /** Milliseconds to wait between paginated API requests. Default 500. */
  delayMs?: number;
}

type ExerciseOutcome = 'imported' | 'updated' | 'skipped';

// ─── Taxonomy maps ────────────────────────────────────────────────────────────

/**
 * ExerciseDB bodyPart → Apex Protocol bodyPart
 */
const BODY_PART_MAP: Record<string, string> = {
  'back':        'Upper Body',
  'cardio':      'Cardio',
  'chest':       'Upper Body',
  'lower arms':  'Upper Body',
  'lower legs':  'Lower Body',
  'neck':        'Upper Body',
  'shoulders':   'Upper Body',
  'upper arms':  'Upper Body',
  'upper legs':  'Lower Body',
  'waist':       'Core',
};

/**
 * ExerciseDB equipment → Apex Protocol equipment
 */
const EQUIPMENT_MAP: Record<string, string> = {
  'assisted':             'machine',
  'band':                 'band',
  'barbell':              'barbell',
  'body weight':          'bodyweight',
  'bosu ball':            'mixed',
  'cable':                'cable',
  'dumbbell':             'dumbbell',
  'elliptical machine':   'cardio_machine',
  'ez barbell':           'barbell',
  'hammer':               'dumbbell',
  'kettlebell':           'kettlebell',
  'leverage machine':     'machine',
  'medicine ball':        'mixed',
  'olympic barbell':      'barbell',
  'resistance band':      'band',
  'roller':               'none',
  'rope':                 'mixed',
  'skierg machine':       'cardio_machine',
  'sled machine':         'machine',
  'smith machine':        'machine',
  'stability ball':       'mixed',
  'stationary bike':      'cardio_machine',
  'stepmill machine':     'cardio_machine',
  'tire':                 'mixed',
  'trap bar':             'barbell',
  'upper body ergometer': 'cardio_machine',
  'weighted':             'mixed',
  'wheel roller':         'none',
};

// Classification is delegated entirely to ExerciseClassificationService.
// See ExerciseClassificationService.ts for the full rule tables and pipeline.

/**
 * Title-case a string. Converts "barbell squat" → "Barbell Squat".
 */
function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Normalisation ────────────────────────────────────────────────────────────

interface NormalisedExercise {
  // Identity
  name:             string;
  externalId:       string;
  externalSource:   string;
  lastSyncedAt:     Date;
  // Taxonomy (classified)
  bodyPart:         string;
  equipment:        string;
  primaryMuscle:    string;
  secondaryMuscles: string[];
  movementPattern:  string | null;
  exerciseType:     string;
  goalTags:         string[];
  difficulty:       string;
  isCompound:       boolean;
  isUnilateral:     boolean;
  // Media
  mediaUrl:         string | null;
  // Content
  instructions:     string | null;
  // Legacy (kept for existing query compatibility)
  category:         string;
  muscleGroup:      string;
}

/**
 * Map a raw ExerciseDB record to the Apex Protocol Exercise schema.
 * Classification is delegated to ExerciseClassificationService.
 * Pure function — no I/O.
 */
function normaliseExercise(raw: ExerciseDbExercise): NormalisedExercise {
  const bodyPart      = BODY_PART_MAP[raw.bodyPart.toLowerCase()] ?? raw.bodyPart;
  const equipment     = EQUIPMENT_MAP[raw.equipment.toLowerCase()] ?? raw.equipment;
  const primaryMuscle = toTitleCase(raw.target);

  const classification = ExerciseClassificationService.classify({
    name:        toTitleCase(raw.name),
    rawBodyPart: raw.bodyPart,   // raw ExerciseDB category for fallback matching
    rawTarget:   raw.target,     // raw ExerciseDB target muscle for fallback matching
    equipment,                   // already normalised
  });

  const instructions = raw.instructions.length > 0
    ? raw.instructions.map((step, i) => `${i + 1}. ${step}`).join('\n')
    : null;

  return {
    name:             toTitleCase(raw.name),
    externalId:       raw.id,
    externalSource:   'exercisedb',
    lastSyncedAt:     new Date(),
    bodyPart,
    equipment,
    primaryMuscle,
    secondaryMuscles: raw.secondaryMuscles.map(toTitleCase),
    movementPattern:  classification.movementPattern,
    exerciseType:     classification.exerciseType,
    goalTags:         classification.goalTags,
    difficulty:       classification.difficulty,
    isCompound:       classification.isCompound,
    isUnilateral:     classification.isUnilateral,
    mediaUrl:         raw.gifUrl || null,
    instructions,
    // Legacy fields — mirror the derived values so existing filters still work
    category:    classification.exerciseType,
    muscleGroup: primaryMuscle,
  };
}

// ─── Database upsert ──────────────────────────────────────────────────────────

/**
 * Persist one normalised exercise.
 *
 * Strategy:
 *   1. Find by (externalId, externalSource) → full update (re-sync from API).
 *   2. Find by name                         → enrich with sync metadata only,
 *                                             preserving hand-authored taxonomy.
 *   3. No match                             → create new record.
 */
async function upsertExercise(raw: ExerciseDbExercise): Promise<ExerciseOutcome> {
  const data = normaliseExercise(raw);

  // ── Strategy 1: previously imported from ExerciseDB ──────────────────────
  const byExternalId = await prisma.exercise.findFirst({
    where: { externalId: data.externalId, externalSource: 'exercisedb' },
  });

  if (byExternalId) {
    await prisma.exercise.update({
      where: { id: byExternalId.id },
      data: {
        name:             data.name,
        bodyPart:         data.bodyPart,
        equipment:        data.equipment,
        primaryMuscle:    data.primaryMuscle,
        secondaryMuscles: data.secondaryMuscles,
        movementPattern:  data.movementPattern,
        exerciseType:     data.exerciseType,
        goalTags:         data.goalTags,
        difficulty:       data.difficulty,
        isCompound:       data.isCompound,
        isUnilateral:     data.isUnilateral,
        mediaUrl:         data.mediaUrl,
        instructions:     data.instructions,
        category:         data.category,
        muscleGroup:      data.muscleGroup,
        lastSyncedAt:     data.lastSyncedAt,
      },
    });
    return 'updated';
  }

  // ── Strategy 2: existing hand-authored exercise with same name ────────────
  const byName = await prisma.exercise.findFirst({
    where: { name: { equals: data.name, mode: 'insensitive' } },
  });

  if (byName) {
    // If it's already claimed by a different external source, leave it alone
    if (byName.externalId && byName.externalSource !== 'exercisedb') {
      return 'skipped';
    }

    // Enrich with sync metadata and missing media only — preserve taxonomy
    await prisma.exercise.update({
      where: { id: byName.id },
      data: {
        externalId:      data.externalId,
        externalSource:  data.externalSource,
        lastSyncedAt:    data.lastSyncedAt,
        // Only backfill if currently null — don't overwrite hand-authored data
        ...(byName.mediaUrl    === null && { mediaUrl: data.mediaUrl }),
        ...(byName.instructions === null && { instructions: data.instructions }),
        ...(byName.secondaryMuscles === null && { secondaryMuscles: data.secondaryMuscles }),
      },
    });
    return 'updated';
  }

  // ── Strategy 3: brand-new exercise ───────────────────────────────────────
  await prisma.exercise.create({
    data: {
      name:             data.name,
      externalId:       data.externalId,
      externalSource:   data.externalSource,
      lastSyncedAt:     data.lastSyncedAt,
      bodyPart:         data.bodyPart,
      equipment:        data.equipment,
      primaryMuscle:    data.primaryMuscle,
      secondaryMuscles: data.secondaryMuscles,
      movementPattern:  data.movementPattern,
      exerciseType:     data.exerciseType,
      goalTags:         data.goalTags,
      difficulty:       data.difficulty,
      isCompound:       data.isCompound,
      isUnilateral:     data.isUnilateral,
      mediaUrl:         data.mediaUrl,
      instructions:     data.instructions,
      category:         data.category,
      muscleGroup:      data.muscleGroup,
      isActive:         true,
    },
  });
  return 'imported';
}

// ─── Batch processor ──────────────────────────────────────────────────────────

/**
 * Process a slice of exercises, accumulating outcomes into result.
 * Each exercise is wrapped in its own try/catch so one failure does not
 * abort the rest of the batch.
 */
async function processBatch(
  exercises: ExerciseDbExercise[],
  result: ImportResult,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  for (let i = 0; i < exercises.length; i++) {
    const raw = exercises[i];
    try {
      const outcome = await upsertExercise(raw);
      result[outcome]++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        externalId: raw.id,
        name:       raw.name,
        error:      err instanceof Error ? err.message : String(err),
      });
    }
    onProgress?.(i + 1, exercises.length);
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ExerciseImportService = {
  /**
   * Import the full ExerciseDB library into PostgreSQL.
   *
   * Fetches all exercises via paginated API calls. Each page is processed
   * sequentially with a configurable delay between requests to respect
   * RapidAPI rate limits. Safe to re-run — existing records are updated,
   * not duplicated.
   */
  async importAll(options: ImportOptions = {}): Promise<ImportResult> {
    const {
      pageSize = 100,
      maxPages,
      delayMs  = 500,
    } = options;

    const result: ImportResult = { imported: 0, updated: 0, skipped: 0, failed: 0, errors: [] };
    let page    = 0;
    let offset  = 0;
    let hasMore = true;

    while (hasMore) {
      if (maxPages !== undefined && page >= maxPages) break;

      const { exercises } = await ExerciseDbService.getExercises(pageSize, offset);

      if (exercises.length === 0) {
        hasMore = false;
        break;
      }

      await processBatch(exercises, result);

      offset  += exercises.length;
      page    += 1;
      hasMore  = exercises.length === pageSize;

      // Respect rate limits between pages
      if (hasMore && delayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return result;
  },

  /**
   * Import exercises for a single ExerciseDB body-part category.
   * Useful for targeted syncs or testing a subset.
   *
   * @param bodyPart  ExerciseDB body part string (e.g. "chest", "back").
   */
  async importByBodyPart(bodyPart: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

    const exercises = await ExerciseDbService.getExercisesByBodyPart(bodyPart);
    await processBatch(exercises, result);

    return result;
  },

  /**
   * Import exercises for a single ExerciseDB equipment type.
   * Useful for importing only what a user's home gym supports.
   *
   * @param equipment  ExerciseDB equipment string (e.g. "barbell", "dumbbell").
   */
  async importByEquipment(equipment: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

    const exercises = await ExerciseDbService.getExercisesByEquipment(equipment);
    await processBatch(exercises, result);

    return result;
  },

  /**
   * Exposed for use from the CLI script and tests.
   * Normalises a single raw ExerciseDB exercise without writing to the database.
   */
  normalise: normaliseExercise,
};
