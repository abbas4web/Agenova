import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // ── Main AI provider ────────────────────────────────────────────────────────
  // Supported: gemini | groq | openrouter
  AI_PROVIDER: z.enum(['gemini', 'groq', 'openrouter']).default('openrouter'),

  // ── Vision provider (used by agents in VISION_AGENT_IDS) ───────────────────
  // Supported: gemini | openrouter
  VISION_PROVIDER: z.enum(['gemini', 'openrouter', 'groq']).default('groq'),
  // Comma-separated agent IDs that receive the vision provider (e.g. "skincare")
  VISION_AGENT_IDS: z.string().default('skincare'),

  // ── Gemini (Google AI Studio) ───────────────────────────────────────────────
  GEMINI_API_KEY: z.string().optional(),
  // Main Gemini model (text)
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  // Vision-specific Gemini model — used by vision agents
  VISION_GEMINI_MODEL: z.string().default('gemini-3.5-flash'),

  // ── Groq ────────────────────────────────────────────────────────────────────
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  // Vision model — must support image input. Currently supported Groq vision models:
  //   qwen/qwen3.6-27b  (131k ctx, up to 5 images, tools supported)
  //   qwen/qwen3.8-27b  (131k ctx, up to 3 images, tools supported)
  GROQ_VISION_MODEL: z.string().default('qwen/qwen3.6-27b'),

  // ── OpenRouter ──────────────────────────────────────────────────────────────
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),
  // Vision model used when VISION_PROVIDER=openrouter
  OPENROUTER_VISION_MODEL: z.string().default('nex-agi/nex-n2.5-pro:free'),

  // ── Tavily (product enrichment for Derma) ───────────────────────────────────
  // Get a free key at https://tavily.com — used to fetch product images + buy links
  // Set to empty string to disable product enrichment
  TAVILY_API_KEY: z.string().default(''),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('60'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  parsed.error.issues.forEach((issue) => {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  isDev: parsed.data.NODE_ENV === 'development',

  databaseUrl: parsed.data.DATABASE_URL,

  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,

  aiProvider: parsed.data.AI_PROVIDER,

  vision: {
    provider: parsed.data.VISION_PROVIDER,
    agentIds: parsed.data.VISION_AGENT_IDS.split(',').map((s) => s.trim()).filter(Boolean),
    geminiModel: parsed.data.VISION_GEMINI_MODEL,
  },

  gemini: {
    apiKey: parsed.data.GEMINI_API_KEY ?? '',
    model: parsed.data.GEMINI_MODEL,
  },

  groq: {
    apiKey: parsed.data.GROQ_API_KEY ?? '',
    model: parsed.data.GROQ_MODEL,
    visionModel: parsed.data.GROQ_VISION_MODEL,
  },

  openRouter: {
    apiKey: parsed.data.OPENROUTER_API_KEY ?? '',
    model: parsed.data.OPENROUTER_MODEL,
    visionModel: parsed.data.OPENROUTER_VISION_MODEL,
  },

  rateLimit: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  tavily: {
    apiKey: parsed.data.TAVILY_API_KEY,
  },
};
