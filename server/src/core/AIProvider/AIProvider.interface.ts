import type { AIResponse, ChatMessage, ToolDefinition } from '../../types';

/**
 * Contract every AI provider must implement.
 * AgentRunner depends only on this interface — never on a concrete provider.
 */
export interface AIProvider {
  /**
   * Send a conversation to the model and receive a response.
   * The response may contain plain text, tool calls, or both.
   *
   * @param messages   Full message history including the system prompt
   * @param tools      Optional list of tools the model may call
   */
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse>;

  /** Human-readable provider name for logging */
  readonly providerName: string;

  /** The underlying model identifier being used */
  readonly modelName: string;
}
