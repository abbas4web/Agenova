import type { AIProvider } from './AIProvider.interface';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

// Singleton — one provider instance for the lifetime of the process
let _provider: AIProvider | null = null;

/**
 * Returns the active AI provider singleton.
 * Provider is selected via the AI_PROVIDER environment variable:
 *   - "gemini"      → Google Gemini (requires GEMINI_API_KEY starting with AIzaSy)
 *   - "groq"        → Groq Cloud    (requires GROQ_API_KEY starting with gsk_)
 *   - "openrouter"  → OpenRouter    (requires OPENROUTER_API_KEY starting with sk-or-)
 */
export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  switch (env.aiProvider) {
    case 'groq':
      _provider = new GroqProvider();
      break;
    case 'openrouter':
      _provider = new OpenRouterProvider();
      break;
    case 'gemini':
    default:
      _provider = new GeminiProvider();
      break;
  }

  logger.info(
    { provider: _provider.providerName, model: _provider.modelName },
    '🤖  AI Provider initialised'
  );

  return _provider;
}

/**
 * Reset the singleton — forces re-initialisation on next call.
 * Useful for testing or runtime provider switching.
 */
export function resetAIProvider(): void {
  _provider = null;
}
