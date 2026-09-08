import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/UserService';

export class UsersController {
  /**
   * PATCH /api/users/me/preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { theme, defaultAgentId } = req.body as {
        theme?: 'light' | 'dark' | 'system';
        defaultAgentId?: string;
      };

      const user = await userService.updatePreferences(req.user!.userId, {
        theme,
        defaultAgentId,
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/users/me/display-name
   */
  async updateDisplayName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { displayName } = req.body as { displayName: string };
      const user = await userService.updateDisplayName(req.user!.userId, displayName);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/users/me/password
   */
  async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      await userService.updatePassword(
        req.user!.userId,
        currentPassword,
        newPassword
      );

      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      const error = err as Error;
      if (error.message === 'Current password is incorrect.') {
        res.status(400).json({ error: error.message });
        return;
      }
      next(err);
    }
  }
}

export const usersController = new UsersController();
