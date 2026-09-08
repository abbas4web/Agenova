import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import type { JwtPayload } from '../types';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * requireAuth — verifies the Bearer JWT on every protected route.
 * Attaches the decoded payload to req.user on success.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorisation required. Please log in.' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = authService.verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token is invalid or has expired. Please log in again.' });
  }
}
