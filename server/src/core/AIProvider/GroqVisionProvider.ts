import type { AIProvider } from './AIProvider.interface';
import type { AIResponse, ChatMessage, ToolDefinition, ToolCall } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * GroqVisionProvider — Groq REST API with multimodal (image + text) support.
 *
 * Strategy: two-pass approach
 *   Pass 1 (vision turn):  image + text → model analyses the image, may request tool calls
 *   Pass 2 (tool turns):   text only, tool results included → model formats final response
 *
 * This works around Qwen's limitation where image + tool_result messages in the
 * same context cause the model to ignore tool calls and hallucinate output formats.
 *
 * Supported Groq vision models:
 *   qwen/qwen3.6-27b  — 131k ctx, up to 5 images, tools supported
 *   qwen/qwen3.8-27b  — 131k ctx, up to 3 images, tools supported
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const FETCH_TIMEOUT_MS = 90_000;

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface GroqTextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
  name?: string;
  tool_calls?: GroqToolCallRequest[];
}

interface GroqToolResultMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
}

type GroqMessage = GroqTextMessage | GroqToolResultMessage;

interface GroqToolCallRequest {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface GroqResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: GroqToolCallRequest[];
    };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: { message: string; code?: string | number };
}

// ── Helper: strip Qwen thinking tags ─────────────────────────────────────────
function stripThinking(text: string | null): string | null {
  if (!text) return null;
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  return stripped || text;
}

// ── Helper: build tool schema array ──────────────────────────────────────────
function buildToolSchemas(tools: ToolDefinition[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

// ── Provider ──────────────────────────────────────────────────────────────────

export class GroqVisionProvider implements AIProvider {
  readonly providerName = 'groq';
  readonly modelName: string;
  readonly supportsVision = true;
  readonly supportsTools = true;

  private readonly apiKey: string;

  constructor(modelOverride?: string) {
    if (!env.groq.apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables.');
    }
    this.apiKey = env.groq.apiKey;
    this.modelName = modelOverride ?? env.groq.visionModel;
  }

  // ── Main entry point ────────────────────────────────────────────────────────

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    const hasImage = messages.some((m) => m.imageBase64 && m.imageMimeType);
    const hasPriorToolResults = messages.some((m) => m.role === 'tool');

    if (hasImage && !hasPriorToolResults) {
      // ── Vision turn: include image, but do NOT pass tool definitions ────────
      // This prevents Qwen from outputting garbled formats when combining
      // image understanding with tool-calling in a single pass.
      // The model will do a clean image analysis; AgentRunner will call us
      // again (text-only) when it has tool results to incorporate.
      return this.callGroq(messages, undefined);
    }

    // ── Text / tool-result turn: no image needed, full tool support ──────────
    return this.callGroq(messages, tools);
  }

  // ── Core Groq call ──────────────────────────────────────────────────────────

  private async callGroq(
    messages: ChatMessage[],
    tools: ToolDefinition[] | undefined
  ): Promise<AIResponse> {
    const groqMessages: GroqMessage[] = [];

    for (const m of messages) {
      if (m.role === 'tool') {
        // Tool result — must include tool_call_id (use toolName as stable ID)
        groqMessages.push({
          role: 'tool',
          content: m.content,
          tool_call_id: m.toolName ?? 'tool_result',
        });
        continue;
      }

      if (m.role === 'assistant') {
        // Check if this assistant message has associated tool calls stored
        const msgWithCalls = m as ChatMessage & { toolCalls?: ToolCall[] };
        if (msgWithCalls.toolCalls && msgWithCalls.toolCalls.length > 0) {
          // Reconstruct the tool_calls array Qwen needs to match results back
          groqMessages.push({
            role: 'assistant',
            content: m.content || null as unknown as string,
            tool_calls: msgWithCalls.toolCalls.map((tc) => ({
              id: (tc as ToolCall & { id?: string }).id ?? tc.name,
              type: 'function' as const,
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.args),
              },
            })),
          } as GroqTextMessage);
          continue;
        }
      }

      if (m.imageBase64 && m.imageMimeType && m.role === 'user') {
        // Vision message — multipart content
        const parts: ContentPart[] = [];
        if (m.content) parts.push({ type: 'text', text: m.content });
        parts.push({
          type: 'image_url',
          image_url: { url: `data:${m.imageMimeType};base64,${m.imageBase64}` },
        });
        groqMessages.push({ role: 'user', content: parts });
        continue;
      }

      // Standard text message
      groqMessages.push({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
        ...(m.toolName ? { name: m.toolName } : {}),
      });
    }

    const groqTools = tools && tools.length > 0 ? buildToolSchemas(tools) : undefined;

    const body: Record<string, unknown> = {
      model: this.modelName,
      messages: groqMessages,
      reasoning_effort: 'none',
      ...(groqTools ? { tools: groqTools, tool_choice: 'auto' } : {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = (await response.json()) as GroqResponse;

      if (!response.ok || data.error) {
        const msg = data.error?.message ?? `Groq API error ${response.status}`;
        if (response.status === 401 || response.status === 403) {
          logger.error({ status: response.status }, 'Groq vision: auth failed');
          throw new Error('Groq authentication failed. Check GROQ_API_KEY.');
        }
        if (response.status === 429) {
          throw Object.assign(
            new Error("I'm receiving too many requests right now. Please wait a moment and try again."),
            { code: 'RATE_LIMIT' }
          );
        }
        if (response.status === 503 || response.status === 504) {
          throw Object.assign(
            new Error('Groq is temporarily unavailable. Please try again in a moment.'),
            { code: 'PROVIDER_UNAVAILABLE' }
          );
        }
        throw new Error(String(msg));
      }

      const choice = data.choices?.[0];
      if (!choice) throw new Error('Groq returned no choices.');

      // Parse tool calls — attach the tool_call id so AgentRunner can route results back
      const toolCalls: ToolCall[] = [];
      if (choice.message.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments) as Record<string, unknown>; }
          catch { logger.warn({ raw: tc.function.arguments }, 'GroqVisionProvider: bad tool args'); }
          toolCalls.push({ name: tc.function.name, args, id: tc.id } as ToolCall & { id: string });
        }
      }

      return {
        content: stripThinking(choice.message.content),
        toolCalls,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const error = err as Error & { code?: string };
      if (error.name === 'AbortError') {
        throw Object.assign(
          new Error('The vision model took too long to respond. Please try again.'),
          { code: 'PROVIDER_UNAVAILABLE' }
        );
      }
      if (error.code === 'RATE_LIMIT' || error.code === 'PROVIDER_UNAVAILABLE') throw err;
      logger.error({ err, model: this.modelName }, 'GroqVisionProvider: API call failed');
      throw err;
    }
  }
}
