import { Router } from 'express';
import { body, param } from 'express-validator';
import { conversationsController } from '../controllers/ConversationsController';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// All conversation routes require auth
router.use(requireAuth);

// GET /api/conversations
router.get('/', conversationsController.list.bind(conversationsController));

// GET /api/conversations/:id/messages
router.get(
  '/:id/messages',
  [param('id').isUUID().withMessage('Invalid conversation ID.')],
  validate,
  conversationsController.getMessages.bind(conversationsController)
);

// PATCH /api/conversations/:id
router.patch(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid conversation ID.'),
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1–255 characters.'),
  ],
  validate,
  conversationsController.updateTitle.bind(conversationsController)
);

// DELETE /api/conversations/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Invalid conversation ID.')],
  validate,
  conversationsController.delete.bind(conversationsController)
);

export default router;
