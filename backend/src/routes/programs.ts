import { Router, Response } from 'express';
import { z } from 'zod';
import { ProgramService } from '../services/ProgramService';
import { ProgramGeneratorService } from '../services/ProgramGeneratorService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const assignSchema = z.object({
  startDate: z.string().optional(),
});

const updatePrescriptionSchema = z.object({
  exerciseId: z.string().uuid('exerciseId must be a valid UUID'),
});

const GOAL_VALUES = ['strength', 'hypertrophy', 'fat_loss', 'endurance', 'athletic', 'general', 'mobility'] as const;

const generateSchema = z.object({
  // Accept one or more goals — minimum 1, maximum 3
  goals: z
    .array(z.enum(GOAL_VALUES))
    .min(1, 'At least one goal is required.')
    .max(3),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().min(2).max(7),
  equipment: z.array(z.string()).min(1),
  compoundPreference: z.enum(['compound', 'mixed', 'isolation']).optional(),
});

// ─── Routes ─────────────────────────────────────────────────────────────────
//
// IMPORTANT: static / literal routes must be registered BEFORE parameterised
// routes (e.g. /:id) to prevent Express from matching them as an id parameter.
//
// Order:
//   GET  /                 → list
//   GET  /assigned         → assigned list
//   POST /generate         → AI generate
//   GET  /generated/:id    → get generated program
//   POST /generated/:id/assign → assign generated program
//   GET  /:id              → get by id (catch-all single segment)
//   GET  /:id/weeks        → program weeks
//   POST /:id/assign       → assign template program

// GET /api/programs — system templates + user's own custom programs
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const programs = await ProgramService.listPrograms(req.userId);
    res.json({ success: true, data: { programs }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// GET /api/programs/assigned — programs assigned to the current user
router.get('/assigned', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const programs = await ProgramService.getAssignedPrograms(req.userId!);
    res.json({ success: true, data: { programs }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// POST /api/programs/generate — generate a custom program
router.post(
  '/generate',
  authenticateToken,
  validate(generateSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await ProgramGeneratorService.generateProgram({
        userId: req.userId,
        goals: req.body.goals,
        experienceLevel: req.body.experienceLevel,
        daysPerWeek: req.body.daysPerWeek,
        equipment: req.body.equipment,
        compoundPreference: req.body.compoundPreference,
      });
      res.status(201).json({ success: true, data: { program: result }, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

// GET /api/programs/generated/:id — fetch a generated program
router.get('/generated/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const program = await ProgramService.getProgramById(req.params.id);
    res.json({ success: true, data: { program }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// POST /api/programs/generated/:id/assign — assign a generated program to the user
router.post(
  '/generated/:id/assign',
  authenticateToken,
  validate(assignSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await ProgramService.assignProgram(req.userId!, req.params.id, req.body.startDate);
      res.status(201).json({ success: true, data: result, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

// GET /api/programs/:id — full program structure (catch-all single segment)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const program = await ProgramService.getProgramById(req.params.id);
    res.json({ success: true, data: { program }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// GET /api/programs/:id/weeks — flat list of weeks with workout days
router.get('/:id/weeks', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const weeks = await ProgramService.getProgramWeeks(req.params.id);
    res.json({ success: true, data: { weeks }, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// POST /api/programs/:id/assign — assign a template program to the user
router.post(
  '/:id/assign',
  authenticateToken,
  validate(assignSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await ProgramService.assignProgram(req.userId!, req.params.id, req.body.startDate);
      res.status(201).json({ success: true, data: result, error: null });
    } catch (err: unknown) {
      handleError(err, res);
    }
  }
);

// DELETE /api/programs/:id — soft-delete a custom program
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await ProgramService.deleteProgram(req.params.id, req.userId);
    res.json({ success: true, data: null, error: null });
  } catch (err: unknown) {
    handleError(err, res);
  }
});

// PATCH /api/programs/:id/prescriptions/:prescriptionId — swap exercise on a prescription
router.patch(
  '/:id/prescriptions/:prescriptionId',
  authenticateToken,
  validate(updatePrescriptionSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const prescription = await ProgramService.updatePrescriptionExercise(
        req.params.id,
        req.params.prescriptionId,
        req.body.exerciseId
      );
      res.json({ success: true, data: { prescription }, error: null });
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
  const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
  const message = status < 500 ? e.message : (isDev ? e.message : 'Internal server error');
  if (status >= 500) console.error('[programs route]', err);
  res.status(status).json({ success: false, error: message ?? 'Internal server error', data: null });
}
