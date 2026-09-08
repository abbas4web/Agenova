import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../config/db';
import type {
  ConversationRow,
  MessageRow,
  ChatMessage,
  MessageRole,
  MessageMetadata,
} from '../types';
import { logger } from '../config/logger';

const MAX_HISTORY_MESSAGES = 20; // How many past messages to load as context

export interface ConversationSummary {
  id: string;
  agentId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveTurnInput {
  conversationId: string;
  userMessage: string;
  assistantReply: string;
  agentId: string;
  metadata?: MessageMetadata;
}

export class ConversationService {
  /**
   * Get an existing conversation or create a new one.
   * Auto-generates a title from the first user message.
   */
  async getOrCreateConversation(
    userId: string,
    agentId: string,
    conversationId?: string,
    firstMessage?: string
  ): Promise<ConversationRow> {
    // ── Return existing conversation ────────────────────────────────────────
    if (conversationId) {
      const existing = await queryOne<ConversationRow>(
        'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );
      if (existing) return existing;
    }

    // ── Create new conversation ─────────────────────────────────────────────
    const title = firstMessage
      ? this.generateTitle(firstMessage)
      : 'New Conversation';

    const rows = await query<ConversationRow>(
      `INSERT INTO conversations (id, user_id, agent_id, title)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv4(), userId, agentId, title]
    );

    const conversation = rows[0];
    if (!conversation) throw new Error('Failed to create conversation.');

    logger.info(
      { conversationId: conversation.id, userId, agentId },
      'Conversation created'
    );
    return conversation;
  }

  /**
   * Load conversation history as ChatMessage array for the AgentRunner.
   * Returns the most recent MAX_HISTORY_MESSAGES messages, oldest first.
   * Filters out system and tool messages — only user/assistant context.
   */
  async getHistory(conversationId: string): Promise<ChatMessage[]> {
    const rows = await query<MessageRow>(
      `SELECT * FROM messages
       WHERE conversation_id = $1
         AND role IN ('user', 'assistant')
       ORDER BY created_at ASC
       LIMIT $2`,
      [conversationId, MAX_HISTORY_MESSAGES]
    );

    return rows.map((row) => ({
      role: row.role as MessageRole,
      content: row.content,
      ...(row.tool_name ? { toolName: row.tool_name } : {}),
    }));
  }

  /**
   * Persist one full turn (user message + assistant reply) to the database.
   * Also touches conversation.updated_at via trigger.
   */
  async saveTurn(input: SaveTurnInput): Promise<{ userMessageId: string; assistantMessageId: string }> {
    const { conversationId, userMessage, assistantReply, metadata } = input;

    const userMsgId = uuidv4();
    const assistantMsgId = uuidv4();
    const meta = JSON.stringify(metadata ?? {});

    // Insert both in a single round-trip using unnested VALUES
    await query(
      `INSERT INTO messages (id, conversation_id, role, content, metadata)
       VALUES
         ($1, $2, 'user',      $3, $4),
         ($5, $2, 'assistant', $6, $7)`,
      [
        userMsgId, conversationId, userMessage, '{}',
        assistantMsgId, assistantReply, meta,
      ]
    );

    // Touch the conversation's updated_at
    await query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [conversationId]
    );

    logger.debug(
      { conversationId, userMsgId, assistantMsgId },
      'Turn saved'
    );

    return { userMessageId: userMsgId, assistantMessageId: assistantMsgId };
  }

  /**
   * List all conversations for a user, newest first.
   */
  async listForUser(userId: string): Promise<ConversationSummary[]> {
    const rows = await query<ConversationRow>(
      `SELECT * FROM conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    return rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * List conversations filtered by agent.
   */
  async listForUserByAgent(
    userId: string,
    agentId: string
  ): Promise<ConversationSummary[]> {
    const rows = await query<ConversationRow>(
      `SELECT * FROM conversations
       WHERE user_id = $1 AND agent_id = $2
       ORDER BY updated_at DESC`,
      [userId, agentId]
    );

    return rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Get all messages for a conversation, oldest first.
   */
  async getMessages(
    conversationId: string,
    userId: string
  ): Promise<MessageRow[]> {
    // Verify ownership first
    const conversation = await queryOne<ConversationRow>(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (!conversation) {
      throw new Error('Conversation not found or access denied.');
    }

    return query<MessageRow>(
      `SELECT * FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );
  }

  /**
   * Delete a conversation and all its messages (cascade handles messages).
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const result = await query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [conversationId, userId]
    );

    if (result.length === 0) {
      throw new Error('Conversation not found or access denied.');
    }

    logger.info({ conversationId, userId }, 'Conversation deleted');
  }

  /**
   * Update the title of a conversation.
   */
  async updateTitle(
    conversationId: string,
    userId: string,
    title: string
  ): Promise<void> {
    const result = await query(
      `UPDATE conversations SET title = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id`,
      [title, conversationId, userId]
    );

    if (result.length === 0) {
      throw new Error('Conversation not found or access denied.');
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private generateTitle(message: string): string {
    // Take first 60 chars, trim at last word boundary, append ellipsis if truncated
    const trimmed = message.trim();
    if (trimmed.length <= 60) return trimmed;
    const cut = trimmed.slice(0, 60).replace(/\s+\S*$/, '');
    return cut + '…';
  }
}

export const conversationService = new ConversationService();
