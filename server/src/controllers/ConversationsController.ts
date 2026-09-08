import type { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/ConversationService';

export class ConversationsController {
  /**
   * GET /api/conversations
   * List all conversations for the authenticated user.
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { agentId } = req.query as { agentId?: string };

      const conversations = agentId
        ? await conversationService.listForUserByAgent(req.user!.userId, agentId)
        : await conversationService.listForUser(req.user!.userId);

      res.json({ conversations });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/conversations/:id/messages
   * Get all messages for a specific conversation.
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messages = await conversationService.getMessages(
        req.params['id'] ?? '',
        req.user!.userId
      );

      res.json({ messages });
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(err);
    }
  }

  /**
   * PATCH /api/conversations/:id
   * Update conversation title.
   */
  async updateTitle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title } = req.body as { title: string };
      await conversationService.updateTitle(
        req.params['id'] ?? '',
        req.user!.userId,
        title
      );
      res.json({ message: 'Title updated.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/conversations/:id
   * Delete a conversation and all its messages.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await conversationService.deleteConversation(
        req.params['id'] ?? '',
        req.user!.userId
      );
      res.json({ message: 'Conversation deleted.' });
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(err);
    }
  }
}

export const conversationsController = new ConversationsController();
