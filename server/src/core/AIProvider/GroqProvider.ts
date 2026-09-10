import Groq from 'groq-sdk';
import type { AIProvider } from './AIProvider.interface';
import type { AIResponse, ChatMessage, ToolDefinition, ToolCall } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

type GroqMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
};

// Models that do not support function/tool calling
const NO_TOOL_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-safeguard-20b',
];

export class GroqProvider implements AIProvider {
  readonly providerName = 'groq';
  readonly modelName: string;

  private client: Groq;
  private supportsTools: boolean;

  constructor() {
    if (!env.groq.apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables.');
    }
    this.client = new Groq({ apiKey: env.groq.apiKey });
    this.modelName = env.groq.model;
    this.supportsTools = !NO_TOOL_MODELS.includes(this.modelName);

    if (!this.supportsTools) {
      logger.info(
        { model: this.modelName },
        'GroqProvider: tool calling disabled for this model — agents will rely on base knowledge'
      );
    }
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    // Filter out 'tool' role messages for models that don't support function calling
    const filteredMessages = this.supportsTools
      ? messages
      : messages.filter((m) => m.role !== 'tool');

    const groqMessages: GroqMessage[] = filteredMessages.map((m) => ({
      role: m.role as GroqMessage['role'],
      content: m.content,
      ...(m.toolName ? { name: m.toolName } : {}),
    }));

    // Only pass tools if the model supports them
    const groqTools =
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

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: groqMessages as Parameters<typeof this.client.chat.completions.create>[0]['messages'],
        ...(groqTools ? { tools: groqTools, tool_choice: 'auto' } : {}),
      });

      const choice = completion.choices[0];
      const toolCalls: ToolCall[] = [];

      if (choice.message.tool_calls) {
        for (const tc of choice.message.tool_calls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            logger.warn({ raw: tc.function.arguments }, 'Failed to parse Groq tool call args');
          }
          toolCalls.push({ name: tc.function.name, args });
        }
      }

      return {
        content: choice.message.content ?? null,
        toolCalls,
        usage: {
          promptTokens: completion.usage?.prompt_tokens ?? 0,
          completionTokens: completion.usage?.completion_tokens ?? 0,
        },
      };
    } catch (err) {
      logger.error({ err, provider: this.providerName }, 'Groq API call failed');

      // Translate rate-limit and quota errors into user-friendly messages
      const message = err instanceof Error ? err.message : '';
      if (message.includes('429') || message.includes('rate_limit')) {
        const friendly = new Error(
          "I'm receiving too many requests right now. Please wait a moment and try again."
        );
        (friendly as NodeJS.ErrnoException).code = 'RATE_LIMIT';
        throw friendly;
      }

      throw err;
    }
  }
}
