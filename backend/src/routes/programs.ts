import { Router, Response } from 'express';
import { z } from 'zod';
import { ProgramService } from '../services/ProgramService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const assignSchema = z.object({
  startDate: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/programs — list all active programs
router.get('/', authenticateToken, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const programs = await ProgramService.listPrograms();
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

// GET /api/programs/:id — full program structure
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

// POST /api/programs/:id/assign — assign program to current user
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

export default router;

// ─── Helper ───────────────────────────────────────────────────────────────────

function handleError(err: unknown, res: Response) {
  const e = err as { statusCode?: number; message?: string };
  const status = e.statusCode ?? 500;
  const message = status < 500 ? e.message : 'Internal server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, error: message, data: null });
}
