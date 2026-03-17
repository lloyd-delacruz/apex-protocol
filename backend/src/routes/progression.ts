import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { ProgressionService } from '../services/ProgressionService';

const router = Router();
router.use(authenticateToken);

// ─── GET /api/progression/pending ─────────────────────────────────────────────
// Returns all exercises achieved in the last 14 days that haven't been confirmed.

router.get('/pending', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const progressions = await ProgressionService.getPending(req.userId!);
    res.json({ success: true, data: { progressions }, error: null });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to load pending progressions.' });
  }
});

// ─── POST /api/progression/confirm ────────────────────────────────────────────
// User confirms a weight increase. Stores the new working weight.

const confirmSchema = z.object({
  trainingLogId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  currentWeight: z.number().positive(),
  incrementPct: z.number().min(0.5).max(20),
  weightUnit: z.enum(['kg', 'lb']),
});

router.post('/confirm', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      error: parsed.error.errors[0]?.message ?? 'Invalid input.',
    });
  }

  try {
    const result = await ProgressionService.confirm(
      parsed.data.trainingLogId,
      req.userId!,
      parsed.data.exerciseId,
      parsed.data.currentWeight,
      parsed.data.incrementPct,
      parsed.data.weightUnit,
    );
    res.json({ success: true, data: result, error: null });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to confirm progression.' });
  }
});

// ─── POST /api/progression/dismiss ────────────────────────────────────────────
// User dismisses the prompt without changing weight.

const dismissSchema = z.object({
  trainingLogId: z.string().uuid(),
});

router.post('/dismiss', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = dismissSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: 'Invalid trainingLogId.' });
  }

  try {
    await ProgressionService.dismiss(parsed.data.trainingLogId);
    res.json({ success: true, data: null, error: null });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to dismiss progression.' });
  }
});

// ─── POST /api/progression/suggested-weights ──────────────────────────────────
// Batch fetch suggested weights for a list of exercise IDs.

const suggestedWeightsBatchSchema = z.object({
  exerciseIds: z.array(z.string().uuid()).min(1).max(50),
});

router.post('/suggested-weights', async (req: AuthenticatedRequest, res: Response) => {
  const parsed = suggestedWeightsBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, data: null, error: 'Invalid exerciseIds.' });
  }

  try {
    const weights = await ProgressionService.getSuggestedWeightsBatch(req.userId!, parsed.data.exerciseIds);
    res.json({ success: true, data: { weights }, error: null });
  } catch {
    res.status(500).json({ success: false, data: null, error: 'Failed to fetch suggested weights.' });
  }
});

export default router;
