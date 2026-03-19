import { Router, Response } from 'express';
import { WorkoutService } from '../services/WorkoutService';
import { WorkoutSessionService } from '../services/WorkoutSessionService';
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

// POST /api/workouts/session/start — start a new workout session
// Returns: { session, sessionExercises[] }
router.post(
  '/session/start',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await WorkoutSessionService.startSession({
        userId: req.userId!,
        workoutDayId: req.body.workoutDayId,
      });
      res.status(201).json({ success: true, data: result, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

// POST /api/workouts/session/finish — finish a workout session
router.post(
  '/session/finish',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const session = await WorkoutSessionService.finishSession({
        sessionId: req.body.sessionId,
        notes: req.body.notes,
      });
      res.json({ success: true, data: session, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

// POST /api/workouts/session/exercises — add a custom exercise to an in-progress session
router.post(
  '/session/exercises',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { sessionId, exerciseId, orderIndex } = req.body;

    if (!sessionId || !exerciseId) {
      res.status(400).json({ success: false, error: 'sessionId and exerciseId are required', data: null });
      return;
    }

    try {
      const sessionExercise = await WorkoutSessionService.addSessionExercise({
        sessionId,
        exerciseId,
        orderIndex: orderIndex ?? 0,
      });
      res.status(201).json({ success: true, data: sessionExercise, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

// PATCH /api/workouts/session/exercises/:sessionExerciseId — replace exercise in session
router.patch(
  '/session/exercises/:sessionExerciseId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { sessionExerciseId } = req.params;
    const { exerciseId } = req.body;

    if (!exerciseId) {
      res.status(400).json({ success: false, error: 'exerciseId is required', data: null });
      return;
    }

    try {
      const updated = await WorkoutSessionService.updateSessionExercise(sessionExerciseId, exerciseId);
      res.json({ success: true, data: updated, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

// POST /api/workouts/session/exercises/:sessionExerciseId/sets — log an individual set
router.post(
  '/session/exercises/:sessionExerciseId/sets',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { sessionExerciseId } = req.params;
    const {
      setType,
      setOrder,
      targetReps,
      actualReps,
      targetWeight,
      actualWeight,
      unit,
      rir,
      rpe,
      completed,
      restAfterSec,
    } = req.body;

    if (setOrder === undefined || setOrder === null) {
      res.status(400).json({ success: false, error: 'setOrder is required', data: null });
      return;
    }

    try {
      const loggedSet = await WorkoutSessionService.logSet({
        sessionExerciseId,
        setType,
        setOrder,
        targetReps,
        actualReps,
        targetWeight,
        actualWeight,
        unit,
        rir,
        rpe,
        completed,
        restAfterSec,
      });
      res.status(201).json({ success: true, data: loggedSet, error: null });
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
