import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.'),
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Display name must be between 2 and 50 characters.'),
  ],
  validate,
  authController.register.bind(authController)
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.login.bind(authController)
);

// GET /api/auth/me  (protected)
router.get('/me', requireAuth, authController.me.bind(authController));

export default router;
