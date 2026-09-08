import { Router } from 'express';
import { body } from 'express-validator';
import { usersController } from '../controllers/UsersController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All user routes require auth
router.use(requireAuth);

// PATCH /api/users/me/preferences
router.patch(
  '/me/preferences',
  [
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Theme must be light, dark, or system.'),
    body('defaultAgentId')
      .optional()
      .isString()
      .trim()
      .withMessage('defaultAgentId must be a string.'),
  ],
  validate,
  usersController.updatePreferences.bind(usersController)
);

// PATCH /api/users/me/display-name
router.patch(
  '/me/display-name',
  [
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be 2–50 characters.'),
  ],
  validate,
  usersController.updateDisplayName.bind(usersController)
);

// PATCH /api/users/me/password
router.patch(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters.'),
  ],
  validate,
  usersController.updatePassword.bind(usersController)
);

export default router;
