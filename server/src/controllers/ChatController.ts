import type { Request, Response, NextFunction } from 'express';
import { orchestrator } from '../core/Orchestrator';
import { agentRunner } from '../core/AgentRunner';
import { conversationService } from '../services/ConversationService';
import type { ChatRequest } from '../types';
import { logger } from '../config/logger';

export class ChatController {
  /**
   * POST /api/chat
   *
   * Main chat endpoint. Accepts a message, optional agentId, and optional
   * conversationId. The Orchestrator picks the agent if none is supplied.
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const { message, conversationId, agentId } = req.body as ChatRequest;
    const start = Date.now();

    try {
      // ── 1. Resolve agent via Orchestrator ──────────────────────────────────
      const resolvedAgentId = await orchestrator.resolve(message, agentId);

      // ── 2. Get or create the conversation ──────────────────────────────────
      const conversation = await conversationService.getOrCreateConversation(
        userId,
        resolvedAgentId,
        conversationId,
        message
      );

      // ── 3. Load conversation history ───────────────────────────────────────
      const history = await conversationService.getHistory(conversation.id);

      // ── 4. Run the agent ───────────────────────────────────────────────────
      const result = await agentRunner.run({
        agentId: resolvedAgentId,
        message,
        conversationHistory: history,
        userId,
      });

      // ── 5. Persist the turn ────────────────────────────────────────────────
      const latencyMs = Date.now() - start;
      const { assistantMessageId } = await conversationService.saveTurn({
        conversationId: conversation.id,
        userMessage: message,
        assistantReply: result.reply,
        agentId: resolvedAgentId,
        metadata: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          latencyMs,
        },
      });

      logger.info(
        {
          userId,
          agentId: resolvedAgentId,
          conversationId: conversation.id,
          latencyMs,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
        },
        'Chat request completed'
      );

      // ── 6. Respond ─────────────────────────────────────────────────────────
      res.json({
        reply: result.reply,
        agentId: resolvedAgentId,
        conversationId: conversation.id,
        messageId: assistantMessageId,
      });
    } catch (err) {
      // Expose rate-limit errors with a 429 so the client shows the right message
      const error = err as Error & { code?: string };
      if (error.code === 'RATE_LIMIT') {
        res.status(429).json({ error: error.message });
        return;
      }
      next(err);
    }
  }
}

export const chatController = new ChatController();
