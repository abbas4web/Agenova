import { Router } from 'express';
import { agentsController } from '../controllers/AgentsController';

const router = Router();

// GET /api/agents  — public, no auth needed
router.get('/', agentsController.getAll.bind(agentsController));

// GET /api/agents/:id  — public
router.get('/:id', agentsController.getOne.bind(agentsController));

export default router;
