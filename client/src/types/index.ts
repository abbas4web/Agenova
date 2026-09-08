// ─────────────────────────────────────────────────────────────────────────────
// Shared client-side types
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  defaultAgentId?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: AgentColor;
  allowedTools?: string[];
}

export type AgentColor =
  | 'indigo'
  | 'pink'
  | 'rose'
  | 'green'
  | 'sky'
  | 'blue'
  | 'orange'
  | 'violet'
  | 'amber'
  | 'yellow';

export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolName?: string | null;
  metadata?: MessageMetadata;
  createdAt: string;
}

export interface MessageMetadata {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number;
  provider?: string;
}

// Optimistic message used before server confirms
export interface OptimisticMessage {
  id: string;
  role: MessageRole;
  content: string;
  pending?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// ── API request/response shapes ───────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  conversationId?: string;
  agentId?: string;
}

export interface ChatResponse {
  reply: string;
  agentId: string;
  conversationId: string;
  messageId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
