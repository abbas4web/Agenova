import {
  GoogleGenerativeAI,
  type Content,
  type Tool,
  type FunctionDeclaration,
  type FunctionCall,
  type Schema,
  SchemaType,
} from '@google/generative-ai';
import type { AIProvider } from './AIProvider.interface';
import type { AIResponse, ChatMessage, ToolDefinition, ToolCall } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class GeminiProvider implements AIProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;

  private client: GoogleGenerativeAI;

  constructor() {
    if (!env.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    this.client = new GoogleGenerativeAI(env.gemini.apiKey);
    this.modelName = env.gemini.model;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    // Separate the system prompt from the rest of the conversation
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemMessage?.content,
      tools: tools && tools.length > 0 ? [this.buildTools(tools)] : undefined,
    });

    const history: Content[] = conversationMessages
      .slice(0, -1) // All but the last message (that's the current turn)
      .map((msg) => this.toGeminiContent(msg))
      .filter((c): c is Content => c !== null);

    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const chat = model.startChat({ history });

    try {
      const result = await chat.sendMessage(lastMessage?.content ?? '');
      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate) {
        throw new Error('Gemini returned no candidates');
      }

      const toolCalls: ToolCall[] = [];
      let textContent: string | null = null;

      for (const part of candidate.content.parts) {
        if (part.text) {
          textContent = (textContent ?? '') + part.text;
        }
        if (part.functionCall) {
          toolCalls.push(this.toToolCall(part.functionCall));
        }
      }

      const usage = response.usageMetadata;

      return {
        content: textContent,
        toolCalls,
        usage: {
          promptTokens: usage?.promptTokenCount ?? 0,
          completionTokens: usage?.candidatesTokenCount ?? 0,
        },
      };
    } catch (err) {
      logger.error({ err, provider: this.providerName }, 'Gemini API call failed');
      throw err;
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private toGeminiContent(msg: ChatMessage): Content | null {
    if (msg.role === 'system') return null;

    const role = msg.role === 'assistant' ? 'model' : 'user';
    return {
      role,
      parts: [{ text: msg.content }],
    };
  }

  private buildTools(tools: ToolDefinition[]): Tool {
    const functionDeclarations: FunctionDeclaration[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: Object.fromEntries(
          Object.entries(t.parameters.properties).map(([key, schema]) => [
            key,
            {
              type: schema.type.toUpperCase() as SchemaType,
              description: schema.description,
              enum: schema.enum,
            } as Schema,
          ])
        ),
        required: t.parameters.required ?? [],
      },
    }));

    return { functionDeclarations };
  }

  private toToolCall(fc: FunctionCall): ToolCall {
    return {
      name: fc.name,
      args: (fc.args as Record<string, unknown>) ?? {},
    };
  }
}
