/**
 * Admin authorization middleware
 *
 * Purpose:  Enforce that the authenticated user holds the 'admin' Role.
 * Apply:    After authenticateToken — req.userId must already be set.
 *
 * Dev mode: Admin check is bypassed in non-production environments, mirroring
 *           the auth bypass in authenticateToken. The seeded dev@apexprotocol.io
 *           user can access admin routes locally without needing the admin role.
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import prisma from '../db/prisma';

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Mirror the dev bypass pattern — no role restriction outside production
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, data: null, error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, data: null, error: 'Unauthorized' });
      return;
    }

    if (user.role.name !== 'admin') {
      res.status(403).json({ success: false, data: null, error: 'Forbidden: admin access required' });
      return;
    }

    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    res.status(500).json({ success: false, data: null, error: 'Internal server error' });
  }
}
