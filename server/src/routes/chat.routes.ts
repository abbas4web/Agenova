import { Router } from 'express';
import { body } from 'express-validator';
import { chatController } from '../controllers/ChatController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// POST /api/chat  (protected)
router.post(
  '/',
  requireAuth,
  [
    // message is optional when an image is attached
    body('message')
      .optional({ values: 'falsy' }) // treat empty string as absent
      .trim()
      .isLength({ max: 4000 })
      .withMessage('Message must be at most 4000 characters.'),

    // Require at least a message or an image
    body().custom((_value, { req }) => {
      const { message, imageBase64 } = req.body as Record<string, string>;
      if (!message?.trim() && !imageBase64) {
        throw new Error('A message or image is required.');
      }
      return true;
    }),

    body('agentId')
      .optional()
      .isString()
      .trim()
      .withMessage('agentId must be a string.'),

    body('conversationId')
      .optional()
      .isUUID()
      .withMessage('conversationId must be a valid UUID.'),

    body('imageBase64')
      .optional()
      .isString()
      .withMessage('imageBase64 must be a string.')
      .notEmpty()
      .withMessage('imageBase64 must not be empty.'),

    body('imageMimeType')
      .optional()
      .isIn(ALLOWED_MIME_TYPES)
      .withMessage(`imageMimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}.`),

    // When imageBase64 is present, imageMimeType is required
    body('imageMimeType').custom((_value, { req }) => {
      const { imageBase64, imageMimeType } = req.body as Record<string, string>;
      if (imageBase64 && !imageMimeType) {
        throw new Error('imageMimeType is required when imageBase64 is provided.');
      }
      return true;
    }),
  ],
  validate,
  chatController.chat.bind(chatController)
);

export default router;
