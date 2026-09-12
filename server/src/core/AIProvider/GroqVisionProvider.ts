import type { AIProvider } from './AIProvider.interface';
import type { AIResponse, ChatMessage, ToolDefinition, ToolCall } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * GroqVisionProvider — Groq REST API with multimodal (image + text) support.
 *
 * Uses the OpenAI-compatible /v1/chat/completions endpoint.
 * Images are sent as data: URLs inside image_url content parts.
 *
 * Currently supported Groq vision models:
 *   qwen/qwen3.6-27b  — 131k context, tools supported, up to 5 images/request
 *   qwen/qwen3.8-27b  — 131k context, tools supported, up to 3 images/request
 *
 * Configure via VISION_GROQ_MODEL in .env.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const FETCH_TIMEOUT_MS = 90_000; // 90s — large images take time

// ── Request / response types ──────────────────────────────────────────────────

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface GroqMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];
  name?: string;
}

interface GroqToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface GroqResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: GroqToolCall[];
    };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number };
  error?: { message: string; code?: string | number };
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

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    // Build OpenAI-compatible message array with vision content parts
    const groqMessages: GroqMessage[] = messages
      .filter((m) => m.role !== 'tool') // Qwen vision supports tools but not tool-result messages via this path
      .map((m) => {
        // User message with image — build multipart content array
        if (m.imageBase64 && m.imageMimeType && m.role === 'user') {
          const parts: ContentPart[] = [];

          // Text first, then image (Qwen models prefer this order)
          if (m.content) {
            parts.push({ type: 'text', text: m.content });
          }
          parts.push({
            type: 'image_url',
            image_url: {
              url: `data:${m.imageMimeType};base64,${m.imageBase64}`,
            },
          });

          return { role: 'user', content: parts };
        }

        // Standard text message
        return {
          role: m.role as GroqMessage['role'],
          content: m.content,
          ...(m.toolName ? { name: m.toolName } : {}),
        };
      });

    // Tool definitions (Qwen models support function calling)
    const groqTools =
      tools && tools.length > 0
        ? tools.map((t) => ({
            type: 'function' as const,
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }))
        : undefined;

    const body: Record<string, unknown> = {
      model: this.modelName,
      messages: groqMessages,
      // Suppress Qwen's chain-of-thought reasoning — return the final answer directly
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
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = (await response.json()) as GroqResponse;

      if (!response.ok || data.error) {
        const msg = data.error?.message ?? `Groq API error ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          logger.error({ status: response.status }, 'Groq vision: authentication failed');
          throw new Error('Groq authentication failed. Check that GROQ_API_KEY is correct.');
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
      if (!choice) {
        throw new Error('Groq returned no choices.');
      }

      // Parse tool calls if present
      const toolCalls: ToolCall[] = [];
      if (choice.message.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            logger.warn({ raw: tc.function.arguments }, 'GroqVisionProvider: failed to parse tool call args');
          }
          toolCalls.push({ name: tc.function.name, args });
        }
      }

      // Qwen models in thinking mode wrap internal reasoning in <think>...</think>
      // Strip these tags before returning — the user should only see the final answer
      const rawContent = choice.message.content ?? null;
      const content = rawContent
        ? rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || rawContent
        : null;

      return {
        content,
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

      logger.error({ err, provider: this.providerName, model: this.modelName }, 'GroqVisionProvider: API call failed');
      throw err;
    }
  }
}
