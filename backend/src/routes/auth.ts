import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(200),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body;

  try {
    const result = await AuthService.register(email, password, name);
    res.status(201).json({ success: true, data: result, error: null });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    const status = e.statusCode ?? 500;
    const message = status < 500 ? e.message : 'Internal server error';
    res.status(status).json({ success: false, error: message, data: null });
  }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const result = await AuthService.login(email, password);
    res.json({ success: true, data: result, error: null });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    const status = e.statusCode ?? 500;
    const message = status < 500 ? e.message : 'Internal server error';
    res.status(status).json({ success: false, error: message, data: null });
  }
});

// POST /auth/refresh — exchange a refresh token for a new access + refresh token pair
router.post('/refresh', validate(refreshSchema), async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  try {
    const result = await AuthService.refresh(refreshToken);
    res.json({ success: true, data: result, error: null });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    const status = e.statusCode ?? 500;
    const message = status < 500 ? e.message : 'Internal server error';
    res.status(status).json({ success: false, error: message, data: null });
  }
});

// POST /auth/logout — revoke the provided refresh token
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body ?? {};

  try {
    await AuthService.logout(refreshToken);
    res.json({ success: true, data: null, error: null });
  } catch {
    // Always return success on logout to avoid information leakage
    res.json({ success: true, data: null, error: null });
  }
});

// GET /auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await AuthService.getById(req.userId!);
    res.json({ success: true, data: { user }, error: null });
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    const status = e.statusCode ?? 500;
    res.status(status).json({ success: false, error: e.message, data: null });
  }
});

export default router;
