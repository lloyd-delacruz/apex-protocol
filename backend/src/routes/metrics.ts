import { Router, Response } from 'express';
import { z } from 'zod';
import { MetricsService } from '../services/MetricsService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const logMetricsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
  body_weight_kg: z.number().positive().optional(),
  body_weight_unit: z.enum(['kg', 'lb']).optional(),
  calories: z.number().int().positive().optional(),
  protein_g: z.number().int().nonnegative().optional(),
  sleep_hours: z.number().min(0).max(24).optional(),
  hunger: z.number().int().min(1).max(10).optional(),
  mood: z.number().int().min(1).max(10).optional(),
  training_performance: z.number().int().min(1).max(10).optional(),
  binge_urge: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/metrics — paginated metrics history
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '30', 10), 365);
  const offset = parseInt((req.query.offset as string) ?? '0', 10);
  const startDate = req.query.start_date as string | undefined;
  const endDate = req.query.end_date as string | undefined;

  try {
    const { metrics, total } = await MetricsService.getHistory(req.userId!, {
      limit,
      offset,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data: { metrics: metrics.map(normaliseMetric), total, limit, offset },
      error: null,
    });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// POST /api/metrics — log or upsert daily metrics
router.post('/', authenticateToken, validate(logMetricsSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metric = await MetricsService.logMetrics({ userId: req.userId!, ...req.body });
    res.status(201).json({ success: true, data: { metrics: normaliseMetric(metric) }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// GET /api/metrics/latest — most recent entry
router.get('/latest', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const metric = await MetricsService.getLatest(req.userId!);
    res.json({ success: true, data: { metrics: metric ? normaliseMetric(metric) : null }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// GET /api/metrics/recovery — recovery score
router.get('/recovery', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const score = await MetricsService.getRecoveryScore(req.userId!);
    res.json({ success: true, data: { recoveryScore: score }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

export default router;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseMetric(m: {
  id: string;
  userId: string;
  entryDate: Date;
  bodyWeight: unknown;
  bodyWeightUnit: string;
  calories: number | null;
  proteinGrams: number | null;
  sleepHours: unknown;
  hungerScore: number | null;
  bingeUrgeScore: number | null;
  moodScore: number | null;
  trainingPerformanceScore: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: m.id,
    user_id: m.userId,
    date: m.entryDate.toISOString().split('T')[0],
    body_weight_kg: m.bodyWeight ? Number(m.bodyWeight) : null,
    body_weight_unit: m.bodyWeightUnit,
    calories: m.calories,
    protein_g: m.proteinGrams,
    sleep_hours: m.sleepHours ? Number(m.sleepHours) : null,
    hunger: m.hungerScore,
    binge_urge: m.bingeUrgeScore,
    mood: m.moodScore,
    training_performance: m.trainingPerformanceScore,
    notes: m.notes,
    created_at: m.createdAt.toISOString(),
    updated_at: m.updatedAt.toISOString(),
  };
}

function handleError(err: unknown, res: Response) {
  const e = err as { statusCode?: number; message?: string };
  const status = e.statusCode ?? 500;
  const message = status < 500 ? e.message : 'Internal server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, error: message, data: null });
}
