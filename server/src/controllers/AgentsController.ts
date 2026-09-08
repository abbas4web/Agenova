import type { Request, Response } from 'express';
import { AgentRegistry } from '../core/AgentRegistry';

export class AgentsController {
  /**
   * GET /api/agents
   * Returns all registered agents (without system prompts — those are internal).
   */
  getAll(_req: Request, res: Response): void {
    const agents = AgentRegistry.getAll().map(({ id, name, description, icon, color }) => ({
      id,
      name,
      description,
      icon,
      color,
    }));

    res.json({ agents });
  }

  /**
   * GET /api/agents/:id
   * Returns a single agent by ID.
   */
  getOne(req: Request, res: Response): void {
    try {
      const { id, name, description, icon, color, allowedTools } =
        AgentRegistry.get(req.params['id'] ?? '');

      res.json({ agent: { id, name, description, icon, color, allowedTools } });
    } catch {
      res.status(404).json({ error: 'Agent not found.' });
    }
  }
}

export const agentsController = new AgentsController();
