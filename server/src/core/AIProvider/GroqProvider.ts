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

export class GroqProvider implements AIProvider {
  readonly providerName = 'groq';
  readonly modelName: string;

  private client: Groq;

  constructor() {
    if (!env.groq.apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables.');
    }
    this.client = new Groq({ apiKey: env.groq.apiKey });
    this.modelName = env.groq.model;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    const groqMessages: GroqMessage[] = messages.map((m) => ({
      role: m.role as GroqMessage['role'],
      content: m.content,
      ...(m.toolName ? { name: m.toolName } : {}),
    }));

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

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: groqMessages,
        tools: groqTools,
        tool_choice: groqTools ? 'auto' : undefined,
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
      throw err;
    }
  }
}
