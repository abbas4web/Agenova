import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Supported providers: gemini | groq | openrouter
  AI_PROVIDER: z.enum(['gemini', 'groq', 'openrouter']).default('openrouter'),

  // Gemini
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // Groq
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),

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

  gemini: {
    apiKey: parsed.data.GEMINI_API_KEY ?? '',
    model: parsed.data.GEMINI_MODEL,
  },

  groq: {
    apiKey: parsed.data.GROQ_API_KEY ?? '',
    model: parsed.data.GROQ_MODEL,
  },

  openRouter: {
    apiKey: parsed.data.OPENROUTER_API_KEY ?? '',
    model: parsed.data.OPENROUTER_MODEL,
  },

  rateLimit: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },
};
