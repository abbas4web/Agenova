import type { AIProvider } from './AIProvider.interface';
import type { AIResponse, ChatMessage, ToolDefinition, ToolCall } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * GeminiProvider — supports two key formats:
 *
 *   1. AIzaSy... keys  → Standard Gemini REST API (Google AI Studio)
 *      Get at: https://aistudio.google.com/app/apikey
 *
 *   2. AQ.... keys     → These are Vertex AI OAuth tokens and are NOT
 *      supported by this provider. Use OpenRouter with model
 *      "google/gemini-flash-1.5" or "google/gemini-pro-1.5" instead.
 *
 * Uses the Gemini REST API directly (no SDK dependency on @google/generative-ai)
 * to avoid SDK version mismatches.
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiTool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: unknown;
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      role: string;
      parts: GeminiPart[];
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
  };
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export class GeminiProvider implements AIProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;

  private apiKey: string;

  constructor() {
    const key = env.gemini.apiKey;

    if (!key) {
      throw new Error(
        'GEMINI_API_KEY is not set. Get an AIzaSy... key from https://aistudio.google.com/app/apikey'
      );
    }

    // Warn about AQ. keys — they won't work with the REST API
    if (key.startsWith('AQ.')) {
      throw new Error(
        'Your GEMINI_API_KEY starts with "AQ." which is a Vertex AI OAuth token, not a Gemini API key.\n' +
        'Please either:\n' +
        '  1. Get an AIzaSy... key from https://aistudio.google.com/app/apikey\n' +
        '  2. Switch to OpenRouter (AI_PROVIDER=openrouter) and use model "google/gemini-flash-1.5"'
      );
    }

    this.apiKey = key;
    this.modelName = env.gemini.model;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    // Separate system prompt from conversation
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system' && m.role !== 'tool');

    // Build Gemini content array
    const contents: GeminiContent[] = conversationMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const geminiTools: GeminiTool[] | undefined =
      tools && tools.length > 0
        ? [
            {
              functionDeclarations: tools.map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            },
          ]
        : undefined;

    const requestBody: Record<string, unknown> = {
      contents,
      ...(systemMessage
        ? { systemInstruction: { parts: [{ text: systemMessage.content }] } }
        : {}),
      ...(geminiTools ? { tools: geminiTools } : {}),
    };

    const url = `${GEMINI_BASE_URL}/${this.modelName}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as GeminiResponse;

      if (!response.ok || data.error) {
        const msg = data.error?.message ?? `Gemini API error ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            `Gemini authentication failed. Make sure your GEMINI_API_KEY starts with "AIzaSy". ` +
            `Current key format may be invalid. Error: ${msg}`
          );
        }
        if (response.status === 429) {
          throw Object.assign(
            new Error("I'm receiving too many requests right now. Please wait a moment and try again."),
            { code: 'RATE_LIMIT' }
          );
        }

        throw new Error(msg);
      }

      const candidate = data.candidates?.[0];
      if (!candidate) {
        throw new Error('Gemini returned no candidates.');
      }

      const toolCalls: ToolCall[] = [];
      let textContent: string | null = null;

      for (const part of candidate.content.parts) {
        if (part.text) {
          textContent = (textContent ?? '') + part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args ?? {},
          });
        }
      }

      return {
        content: textContent,
        toolCalls,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    } catch (err) {
      const error = err as Error & { code?: string };
      if (error.code === 'RATE_LIMIT') throw err;

      logger.error({ err, provider: this.providerName }, 'Gemini API call failed');
      throw err;
    }
  }
}
