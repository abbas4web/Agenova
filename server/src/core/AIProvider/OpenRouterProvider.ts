import type { AIProvider } from './AIProvider.interface';
import type { AIResponse, ChatMessage, ToolDefinition, ToolCall } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * OpenRouterProvider — OpenAI-compatible REST API.
 *
 * OpenRouter proxies 200+ models (Llama, Gemini, Mistral, Claude, etc.)
 * through a single OpenAI-compatible endpoint.
 *
 * Free models: any model with ":free" suffix or listed at
 * https://openrouter.ai/models?q=free
 *
 * Get your key at: https://openrouter.ai/keys
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Models known NOT to support tool/function calling via OpenRouter
const NO_TOOL_MODELS = [
  'liquid/lfm-2.5-2.6b:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'nex-agi/nex-n2.5-mini:free',
  'thinkingmachines/inkling-small:free',
  'thinkingmachines/inkling:free',
];

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: OpenRouterToolCall[];
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class OpenRouterProvider implements AIProvider {
  readonly providerName = 'openrouter';
  readonly modelName: string;

  private apiKey: string;
  private supportsTools: boolean;

  constructor() {
    if (!env.openRouter.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }
    this.apiKey = env.openRouter.apiKey;
    this.modelName = env.openRouter.model;
    this.supportsTools = !NO_TOOL_MODELS.includes(this.modelName);

    if (!this.supportsTools) {
      logger.info(
        { model: this.modelName },
        'OpenRouterProvider: tool calling disabled for this model'
      );
    }
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    // Filter tool-role messages if model doesn't support function calling
    const filteredMessages = this.supportsTools
      ? messages
      : messages.filter((m) => m.role !== 'tool');

    const openRouterMessages: OpenRouterMessage[] = filteredMessages.map((m) => ({
      role: m.role as OpenRouterMessage['role'],
      content: m.content,
      ...(m.toolName ? { name: m.toolName } : {}),
    }));

    const openRouterTools =
      this.supportsTools && tools && tools.length > 0
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
      messages: openRouterMessages,
      ...(openRouterTools ? { tools: openRouterTools, tool_choice: 'auto' } : {}),
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://agentora.app',
          'X-Title': 'Agentora',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = this.tryParseJson(errorText);

        // Rate limit
        if (response.status === 429) {
          throw Object.assign(
            new Error("I'm receiving too many requests right now. Please wait a moment and try again."),
            { code: 'RATE_LIMIT' }
          );
        }

        // Quota exhausted
        if (response.status === 402) {
          throw Object.assign(
            new Error('OpenRouter credit limit reached. Add credits at openrouter.ai or switch to a free model.'),
            { code: 'QUOTA_EXCEEDED' }
          );
        }

        const message =
          errorData?.error?.message ??
          errorData?.message ??
          `OpenRouter API error ${response.status}: ${errorText}`;
        throw new Error(message);
      }

      const data = (await response.json()) as OpenRouterResponse;
      const choice = data.choices[0];

      if (!choice) {
        throw new Error('OpenRouter returned no choices in response.');
      }

      const toolCalls: ToolCall[] = [];

      if (choice.message.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            logger.warn({ raw: tc.function.arguments }, 'Failed to parse OpenRouter tool call args');
          }
          toolCalls.push({ name: tc.function.name, args });
        }
      }

      return {
        content: choice.message.content ?? null,
        toolCalls,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      // Re-throw operational errors as-is
      const error = err as Error & { code?: string };
      if (error.code === 'RATE_LIMIT' || error.code === 'QUOTA_EXCEEDED') throw err;

      logger.error({ err, provider: this.providerName, model: this.modelName }, 'OpenRouter API call failed');
      throw err;
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private tryParseJson(text: string): Record<string, unknown> | null {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
