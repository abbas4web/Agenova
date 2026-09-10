import type { AIProvider } from './AIProvider.interface';
import type { AIResponse, ChatMessage, ToolDefinition, ToolCall } from '../../types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * GeminiProvider — Direct Google Gemini REST API.
 *
 * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * Auth:     x-goog-api-key header
 *
 * Supports:
 *   - Text-only conversations
 *   - Multimodal (text + image) via inline_data parts
 *   - Function / tool calling
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const FETCH_TIMEOUT_MS = 30_000;

// ── Gemini REST API types ─────────────────────────────────────────────────────

interface GeminiTextPart {
  text: string;
}

interface GeminiInlineDataPart {
  inline_data: {
    mime_type: string;
    data: string; // base64-encoded, no data: prefix
  };
}

interface GeminiFunctionCallPart {
  functionCall: { name: string; args: Record<string, unknown> };
}

interface GeminiFunctionResponsePart {
  functionResponse: { name: string; response: Record<string, unknown> };
}

type GeminiPart =
  | GeminiTextPart
  | GeminiInlineDataPart
  | GeminiFunctionCallPart
  | GeminiFunctionResponsePart;

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
      parts: Array<{
        text?: string;
        functionCall?: { name: string; args: Record<string, unknown> };
      }>;
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

// ── Provider ──────────────────────────────────────────────────────────────────

export class GeminiProvider implements AIProvider {
  readonly providerName = 'gemini';
  readonly modelName: string;
  readonly supportsTools = true;
  readonly supportsVision = true;

  private readonly apiKey: string;

  constructor(modelOverride?: string) {
    const key = env.gemini.apiKey;
    if (!key) {
      throw new Error(
        'GEMINI_API_KEY is not set. Get a key from https://aistudio.google.com/app/apikey'
      );
    }
    this.apiKey = key;
    this.modelName = modelOverride ?? env.gemini.model;
  }

  async chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<AIResponse> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const conversationMessages = messages.filter(
      (m) => m.role !== 'system' && m.role !== 'tool'
    );

    // Build Gemini contents array — supports text + inline image parts
    const contents: GeminiContent[] = conversationMessages.map((m) => {
      const parts: GeminiPart[] = [];

      // Inline image part (vision) — placed before text so model sees context first
      if (m.imageBase64 && m.imageMimeType) {
        if (!m.imageBase64.trim()) {
          throw new Error('Image data is empty. Please re-upload the image.');
        }
        parts.push({
          inline_data: {
            mime_type: m.imageMimeType,
            data: m.imageBase64,
          },
        });
      }

      // Text part
      if (m.content) {
        parts.push({ text: m.content });
      }

      // Fallback: if somehow no parts, add a placeholder so Gemini doesn't error
      if (parts.length === 0) {
        parts.push({ text: '' });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

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

    const url = `${GEMINI_BASE_URL}/${this.modelName}:generateContent`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = (await response.json()) as GeminiResponse;

      if (!response.ok || data.error) {
        const msg = data.error?.message ?? `Gemini API error ${response.status}`;

        if (response.status === 400) {
          throw new Error(`Gemini request invalid: ${msg}`);
        }
        if (response.status === 401 || response.status === 403) {
          // Never expose the key value — log internally only
          logger.error({ status: response.status }, 'Gemini authentication failed');
          throw new Error(
            'Gemini authentication failed. Check that GEMINI_API_KEY is correct.'
          );
        }
        if (response.status === 429) {
          throw Object.assign(
            new Error("I'm receiving too many requests right now. Please wait a moment and try again."),
            { code: 'RATE_LIMIT' }
          );
        }
        if (response.status === 503 || response.status === 504) {
          throw Object.assign(
            new Error('Gemini is temporarily unavailable. Please try again in a moment.'),
            { code: 'PROVIDER_UNAVAILABLE' }
          );
        }
        throw new Error(msg);
      }

      const candidate = data.candidates?.[0];
      if (!candidate) {
        throw new Error('Gemini returned no candidates. The model may have filtered the response.');
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
      clearTimeout(timeoutId);
      const error = err as Error & { code?: string };

      if (error.name === 'AbortError') {
        throw Object.assign(
          new Error('Gemini took too long to respond. Please try again.'),
          { code: 'PROVIDER_UNAVAILABLE' }
        );
      }

      if (error.code === 'RATE_LIMIT' || error.code === 'PROVIDER_UNAVAILABLE') throw err;

      logger.error({ err, provider: this.providerName, model: this.modelName }, 'Gemini API call failed');
      throw err;
    }
  }
}
