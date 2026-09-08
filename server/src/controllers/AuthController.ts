import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { userService } from '../services/UserService';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, displayName } = req.body as {
        email: string;
        password: string;
        displayName: string;
      };

      const result = await authService.register(email, password, displayName);

      res.status(201).json({
        message: 'Account created successfully.',
        token: result.token,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await authService.login(email, password);

      res.json({
        message: 'Logged in successfully.',
        token: result.token,
        user: result.user,
      });
    } catch (err) {
      // Map the generic "Invalid email or password" to 401
      const error = err as Error;
      if (error.message === 'Invalid email or password.') {
        res.status(401).json({ error: error.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   * Returns the currently authenticated user.
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
