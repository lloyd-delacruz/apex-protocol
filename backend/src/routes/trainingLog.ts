import { Router, Response } from 'express';
import { z } from 'zod';
import { TrainingLogService } from '../services/TrainingLogService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const logSchema = z.object({
  exerciseId: z.string().uuid('exerciseId must be a valid UUID'),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'sessionDate must be YYYY-MM-DD').optional(),
  programId: z.string().uuid().optional(),
  programWeekId: z.string().uuid().optional(),
  workoutDayId: z.string().uuid().optional(),
  exercisePrescriptionId: z.string().uuid().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['lb', 'kg']).optional(),
  set1Reps: z.number().int().positive().optional(),
  set2Reps: z.number().int().positive().optional(),
  set3Reps: z.number().int().positive().optional(),
  set4Reps: z.number().int().positive().optional(),
  rir: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/training-log — log an exercise session
router.post('/', authenticateToken, validate(logSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const log = await TrainingLogService.logExercise({
      userId: req.userId!,
      sessionDate: req.body.sessionDate ?? new Date().toISOString().split('T')[0],
      ...req.body,
    });
    res.status(201).json({ success: true, data: { log }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// GET /api/training-log/history — paginated training history
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
  const offset = parseInt((req.query.offset as string) ?? '0', 10);
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;

  try {
    const { logs, total } = await TrainingLogService.getHistory(req.userId!, {
      limit,
      offset,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data: { logs, total, limit, offset },
      error: null,
    });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// GET /api/training-log/exercise/:exerciseId — progression history for one exercise
router.get(
  '/exercise/:exerciseId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const logs = await TrainingLogService.getExerciseHistory(req.userId!, req.params.exerciseId);
      res.json({ success: true, data: { logs }, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

export default router;

// ─── Helper ───────────────────────────────────────────────────────────────────

function handleError(err: unknown, res: Response) {
  const e = err as { statusCode?: number; message?: string };
  const status = e.statusCode ?? 500;
  const message = status < 500 ? e.message : 'Internal server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, error: message, data: null });
}
