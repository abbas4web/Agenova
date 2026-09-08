import { Router } from 'express';
import { agentsController } from '../controllers/AgentsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/agents  (protected)
router.get('/', requireAuth, agentsController.getAll.bind(agentsController));

// GET /api/agents/:id  (protected)
router.get('/:id', requireAuth, agentsController.getOne.bind(agentsController));

export default router;
