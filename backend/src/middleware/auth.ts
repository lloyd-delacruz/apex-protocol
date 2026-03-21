import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any; // Full user record from DB
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'apex-protocol-dev-secret-change-in-production';
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === 'true';

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required', data: null });
    return;
  }

  let userId: string | null = null;

  // 1. Check for Development/Test bypass with dummy-token
  if (token === 'dummy-token' && (DEV_AUTH_BYPASS || process.env.NODE_ENV === 'test')) {
    userId = '00000000-0000-0000-0000-000000000000';
    console.log('[Auth] Bypass active — using stable mock user:', userId);
  } else {
    // 2. Standard JWT verification
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = payload.userId;
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired token', data: null });
      return;
    }
  }

  if (!userId) {
    res.status(401).json({ success: false, error: 'Authentication failed', data: null });
    return;
  }

  // 3. Populate req.user from Database (Ensures user exists and provides context)
  try {
    const { UserRepository } = await import('../repositories/UserRepository');
    const user = await UserRepository.findById(userId);

    if (!user) {
      // If mock user used in bypass doesn't exist yet, try to create it
      if (token === 'dummy-token' && userId === '00000000-0000-0000-0000-000000000000') {
        console.log('[Auth] Mock user missing, attempting to ensure it exists...');
        const roleId = await UserRepository.findDefaultRoleId();
        if (roleId) {
          const newUser = await UserRepository.create({
            id: userId,
            email: 'dev@apexprotocol.io',
            passwordHash: 'dev-bypass-hashed',
            firstName: 'Dev',
            lastName: 'User',
            roleId,
          });
          req.userId = newUser.id;
          req.user = newUser;
          next();
          return;
        }
      }

      console.error(`[Auth] User not found in DB: ${userId}`);
      res.status(401).json({ success: false, error: 'Session expired. Please sign in again.', data: null });
      return;
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth] Database error during token authentication:', err);
    res.status(500).json({ success: false, error: 'Internal server error', data: null });
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
