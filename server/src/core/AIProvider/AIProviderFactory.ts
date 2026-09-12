import type { AIProvider } from './AIProvider.interface';
import { GeminiProvider } from './GeminiProvider';
import { GroqProvider } from './GroqProvider';
import { GroqVisionProvider } from './GroqVisionProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

// ── Default provider singleton ────────────────────────────────────────────────
let _provider: AIProvider | null = null;

/**
 * Returns the default AI provider singleton (used by all non-vision agents).
 * Selected via AI_PROVIDER env var: "gemini" | "groq" | "openrouter"
 */
export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  _provider = createProvider(env.aiProvider);

  logger.info(
    { provider: _provider.providerName, model: _provider.modelName },
    '🤖  AI Provider initialised'
  );

  return _provider;
}

// ── Vision provider singleton ─────────────────────────────────────────────────
let _visionProvider: AIProvider | null = null;

/**
 * Returns the vision-capable provider singleton.
 * Used by agents listed in VISION_AGENT_IDS (default: "skincare").
 * Selected via VISION_PROVIDER env var: "gemini" | "openrouter"
 *
 * Falls back to the default provider if vision provider fails to initialise.
 */
export function getVisionProvider(): AIProvider {
  if (_visionProvider) return _visionProvider;

  try {
    _visionProvider = createVisionProvider(env.vision.provider);
    logger.info(
      { provider: _visionProvider.providerName, model: _visionProvider.modelName },
      '👁️  Vision Provider initialised'
    );
  } catch (err) {
    logger.warn({ err }, 'Vision provider failed to initialise — falling back to default provider');
    _visionProvider = getAIProvider();
  }

  return _visionProvider;
}

/**
 * Returns the appropriate provider for a given agent.
 * Vision agents (those in VISION_AGENT_IDS) get the vision provider.
 * All other agents get the default provider.
 */
export function getProviderForAgent(agentId: string): AIProvider {
  if (env.vision.agentIds.includes(agentId)) {
    return getVisionProvider();
  }
  return getAIProvider();
}

/** Reset all singletons — forces re-initialisation on next call. Useful for testing. */
export function resetAIProvider(): void {
  _provider = null;
  _visionProvider = null;
}

// ── Internal factories ────────────────────────────────────────────────────────

function createProvider(type: string): AIProvider {
  switch (type) {
    case 'groq':
      return new GroqProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    case 'gemini':
    default:
      return new GeminiProvider();
  }
}

function createVisionProvider(type: string): AIProvider {
  switch (type) {
    case 'groq':
      return new GroqVisionProvider(env.groq.visionModel);
    case 'openrouter':
      return new OpenRouterProvider(env.openRouter.visionModel);
    case 'gemini':
    default:
      return new GeminiProvider(env.vision.geminiModel);
  }
}
