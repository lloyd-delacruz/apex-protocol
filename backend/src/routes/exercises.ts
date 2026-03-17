/**
 * Exercise routes
 *
 * GET /api/exercises                   — list with optional filters
 * GET /api/exercises/search?q=         — full-text name search
 * GET /api/exercises/filter            — filter with query params
 * GET /api/exercises/taxonomy          — distinct taxonomy values for filter dropdowns
 * GET /api/exercises/by-goal/:goal     — exercises matching a goal tag
 * GET /api/exercises/by-equipment/:eq  — exercises matching an equipment type
 * GET /api/exercises/by-pattern/:pat   — exercises matching a movement pattern
 * GET /api/exercises/:id               — single exercise with substitutions
 * GET /api/exercises/:id/substitutions — substitutions for a single exercise
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ExerciseService } from '../services/ExerciseService';

const router = Router();

// All exercise routes require authentication
router.use(authenticateToken);

// ─── /search must come before /:id to avoid param collision ───────────────────

router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    if (!q) {
      return res.status(400).json({ success: false, data: null, error: 'Query parameter "q" is required' });
    }
    const exercises = await ExerciseService.search(q);
    res.json({ success: true, data: { exercises }, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

router.get('/taxonomy', async (_req: Request, res: Response) => {
  try {
    const options = await ExerciseService.getTaxonomyOptions();
    res.json({ success: true, data: options, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

router.get('/filter', async (req: Request, res: Response) => {
  try {
    const {
      search, goal, equipment, movementPattern, bodyPart, primaryMuscle,
      muscleGroup, exerciseType, difficulty, isCompound, isUnilateral,
      limit, offset,
    } = req.query as Record<string, string | undefined>;

    const filters = {
      search,
      goal,
      equipment,
      movementPattern,
      bodyPart,
      primaryMuscle,
      muscleGroup,
      exerciseType,
      difficulty,
      isCompound: isCompound !== undefined ? isCompound === 'true' : undefined,
      isUnilateral: isUnilateral !== undefined ? isUnilateral === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };

    const result = await ExerciseService.list(filters);
    res.json({ success: true, data: result, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

router.get('/by-goal/:goal', async (req: Request, res: Response) => {
  try {
    const exercises = await ExerciseService.getByGoal(req.params.goal);
    res.json({ success: true, data: { exercises }, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

router.get('/by-equipment/:equipment', async (req: Request, res: Response) => {
  try {
    const exercises = await ExerciseService.getByEquipment(req.params.equipment);
    res.json({ success: true, data: { exercises }, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

router.get('/by-pattern/:pattern', async (req: Request, res: Response) => {
  try {
    const exercises = await ExerciseService.getByPattern(req.params.pattern);
    res.json({ success: true, data: { exercises }, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

// ─── List all exercises ────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search, goal, equipment, movementPattern, bodyPart, primaryMuscle,
      muscleGroup, exerciseType, difficulty, isCompound, isUnilateral,
      limit, offset,
    } = req.query as Record<string, string | undefined>;

    const result = await ExerciseService.list({
      search,
      goal,
      equipment,
      movementPattern,
      bodyPart,
      primaryMuscle,
      muscleGroup,
      exerciseType,
      difficulty,
      isCompound: isCompound !== undefined ? isCompound === 'true' : undefined,
      isUnilateral: isUnilateral !== undefined ? isUnilateral === 'true' : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    res.json({ success: true, data: result, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

// ─── Substitutions (before /:id to avoid collision) ──────────────────────────

router.get('/:id/substitutions', async (req: Request, res: Response) => {
  try {
    const substitutions = await ExerciseService.getSubstitutions(req.params.id);
    res.json({ success: true, data: { substitutions }, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

// ─── Single exercise ───────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const exercise = await ExerciseService.getById(req.params.id);
    res.json({ success: true, data: { exercise }, error: null });
  } catch (err: unknown) {
    const e = err as Error & { statusCode?: number };
    res.status(e.statusCode ?? 500).json({ success: false, data: null, error: e.message });
  }
});

export default router;
