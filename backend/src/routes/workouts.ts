import { Router, Response } from 'express';
import { WorkoutService } from '../services/WorkoutService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/workouts/today — today's workout based on user's active program
router.get('/today', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const workout = await WorkoutService.getTodaysWorkout(req.userId!);
    res.json({ success: true, data: workout, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// GET /api/workouts/:programId/:week/:day — specific workout by week + day number
router.get(
  '/:programId/:week/:day',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const week = parseInt(req.params.week, 10);
    const day = parseInt(req.params.day, 10);

    if (isNaN(week) || isNaN(day) || week < 1 || day < 1 || day > 7) {
      res.status(400).json({ success: false, error: 'Invalid week or day number', data: null });
      return;
    }

    try {
      const workoutDay = await WorkoutService.getWorkoutByWeekAndDay(req.params.programId, week, day);
      res.json({ success: true, data: { workoutDay }, error: null });
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
