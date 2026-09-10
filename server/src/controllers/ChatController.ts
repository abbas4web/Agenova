import type { Request, Response, NextFunction } from 'express';
import { orchestrator } from '../core/Orchestrator';
import { agentRunner } from '../core/AgentRunner';
import { conversationService } from '../services/ConversationService';
import type { ChatRequest, ImageMimeType } from '../types';
import { logger } from '../config/logger';

const ALLOWED_MIME_TYPES: ImageMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

// ~3 MB decoded — base64 is ~33% larger than raw bytes so this covers ~2.25 MB files
const MAX_BASE64_LENGTH = 4 * 1024 * 1024;

export class ChatController {
  /**
   * POST /api/chat
   *
   * Accepts JSON body:
   *   message        string  — optional if imageBase64 provided
   *   agentId        string  — optional (Orchestrator picks if omitted)
   *   conversationId string  — optional UUID
   *   imageBase64    string  — optional raw base64, no "data:" prefix
   *   imageMimeType  string  — required when imageBase64 is present
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user!.userId;
    const { message, conversationId, agentId, imageBase64, imageMimeType } =
      req.body as ChatRequest;
    const start = Date.now();

    // ── Require at least a message or an image ─────────────────────────────
    if (!message?.trim() && !imageBase64) {
      res.status(422).json({ error: 'A message or image is required.' });
      return;
    }

    // ── Validate image if provided ─────────────────────────────────────────
    if (imageBase64) {
      if (!imageMimeType) {
        res.status(422).json({ error: 'imageMimeType is required when sending an image.' });
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(imageMimeType as ImageMimeType)) {
        res.status(422).json({
          error: `Unsupported image type "${imageMimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}.`,
        });
        return;
      }
      if (!imageBase64.trim()) {
        res.status(422).json({ error: 'imageBase64 must not be empty.' });
        return;
      }
      if (imageBase64.length > MAX_BASE64_LENGTH) {
        res.status(422).json({
          error: 'Image is too large. Please use an image under 3 MB.',
        });
        return;
      }
    }

    const effectiveMessage = message?.trim() ?? '';

    try {
      // ── 1. Resolve agent ───────────────────────────────────────────────────
      // When an image is sent without an explicit agentId, default to "skincare"
      const defaultAgentId = imageBase64 && !agentId ? 'skincare' : agentId;
      const resolvedAgentId = await orchestrator.resolve(
        effectiveMessage || 'Please analyse this image.',
        defaultAgentId
      );

      // ── 2. Get or create conversation ──────────────────────────────────────
      const conversation = await conversationService.getOrCreateConversation(
        userId,
        resolvedAgentId,
        conversationId,
        effectiveMessage || 'Image analysis'
      );

      // ── 3. Load history ────────────────────────────────────────────────────
      const history = await conversationService.getHistory(conversation.id);

      // ── 4. Run agent ───────────────────────────────────────────────────────
      const result = await agentRunner.run({
        agentId: resolvedAgentId,
        message: effectiveMessage,
        conversationHistory: history,
        userId,
        imageBase64,
        imageMimeType: imageMimeType as ImageMimeType | undefined,
      });

      // ── 5. Persist turn ────────────────────────────────────────────────────
      const latencyMs = Date.now() - start;
      const { assistantMessageId } = await conversationService.saveTurn({
        conversationId: conversation.id,
        userMessage: effectiveMessage || '[image]',
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
          hasImage: !!imageBase64,
          latencyMs,
        },
        'Chat request completed'
      );

      res.json({
        reply: result.reply,
        agentId: resolvedAgentId,
        conversationId: conversation.id,
        messageId: assistantMessageId,
      });
    } catch (err) {
      const error = err as Error & { code?: string };
      if (error.code === 'RATE_LIMIT') {
        res.status(429).json({ error: error.message });
        return;
      }
      if (error.code === 'PROVIDER_UNAVAILABLE') {
        res.status(503).json({ error: error.message });
        return;
      }
      next(err);
    }
  }
}

export const chatController = new ChatController();
