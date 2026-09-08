import { Router } from 'express';
import { body } from 'express-validator';
import { chatController } from '../controllers/ChatController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// POST /api/chat  (protected)
router.post(
  '/',
  requireAuth,
  [
    body('message')
      .trim()
      .isLength({ min: 1, max: 4000 })
      .withMessage('Message must be between 1 and 4000 characters.'),
    body('agentId')
      .optional()
      .isString()
      .trim()
      .withMessage('agentId must be a string.'),
    body('conversationId')
      .optional()
      .isUUID()
      .withMessage('conversationId must be a valid UUID.'),
  ],
  validate,
  chatController.chat.bind(chatController)
);

export default router;
