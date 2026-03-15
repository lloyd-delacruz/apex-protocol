import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'apex-protocol-dev-secret-change-in-production';

import prisma from '../db/prisma';

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // BYPASS AUTH FOR LOCAL TESTING - USING SEEDED DEV USER
  try {
    const devUser = await prisma.user.findUnique({
      where: { email: 'dev@apexprotocol.io' },
    });
    
    if (!devUser) {
       console.error('Dev user not found. Did you run the database seeds?');
       res.status(500).json({ error: 'Auth Bypass Error: Seed user dev@apexprotocol.io missing' });
       return;
    }

    req.userId = devUser.id;
    next();
  } catch (err) {
    console.error('Error fetching dev user for auth bypass:', err);
    res.status(500).json({ error: 'Auth Bypass Error: Database Query Failed' });
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
