import type { AIProvider } from './AIProvider.interface';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

// Singleton — one provider instance for the lifetime of the process
let _provider: AIProvider | null = null;

/**
 * Returns the active AI provider singleton.
 * Provider is selected via the AI_PROVIDER environment variable.
 * Defaults to Gemini.
 */
export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  switch (env.aiProvider) {
    case 'groq':
      _provider = new GroqProvider();
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
 * Reset the singleton — useful for testing or runtime provider switching.
 */
export function resetAIProvider(): void {
  _provider = null;
}
