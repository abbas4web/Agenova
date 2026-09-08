// ─────────────────────────────────────────────────────────────────────────────
// Shared types used across the Agentora server
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
}

// ── Database row shapes ───────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  preferences: UserPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  defaultAgentId?: string;
}

export interface ConversationRow {
  id: string;
  user_id: string;
  agent_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_name: string | null;
  metadata: MessageMetadata;
  created_at: Date;
}

// ── Chat / AI types ───────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  toolName?: string;
}

export interface MessageMetadata {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  provider?: string;
}

// ── AI Provider abstraction ───────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
}

export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: { type: string };
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface AIResponse {
  content: string | null;
  toolCalls: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// ── Agent types ───────────────────────────────────────────────────────────────

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;                // Tailwind color class used in the UI
  systemPrompt: string;
  allowedTools: string[];
  model?: string;               // Override default model
  maxTurns?: number;            // Max tool-call loop iterations (default 5)
}

export interface AgentRunInput {
  agentId: string;
  message: string;
  conversationHistory: ChatMessage[];
  userId: string;
}

export interface AgentRunOutput {
  reply: string;
  agentId: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

// ── Tool types ────────────────────────────────────────────────────────────────

export interface ToolImplementation {
  definition: ToolDefinition;
  execute(args: Record<string, unknown>): Promise<string>;
}

// ── API request / response shapes ────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  conversationId?: string;
  agentId?: string;             // Optional — Orchestrator picks one if omitted
}

export interface ChatResponse {
  reply: string;
  agentId: string;
  conversationId: string;
  messageId: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
