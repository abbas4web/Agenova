import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import agentsRoutes from './routes/agents.routes';
import conversationsRoutes from './routes/conversations.routes';
import usersRoutes from './routes/users.routes';

export function createApp(): express.Application {
  const app = express();

  // ── Core middleware ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: env.isDev
        ? ['http://localhost:5173', 'http://127.0.0.1:5173']
        : process.env['ALLOWED_ORIGINS']?.split(',') ?? [],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Rate limiting ───────────────────────────────────────────────────────────
  // General limiter for all API routes
  const generalLimiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down and try again.' },
  });

  // Stricter limiter for the chat endpoint (AI calls are expensive)
  const chatLimiter = rateLimit({
    windowMs: 60_000,       // 1 minute
    max: 20,                // 20 messages per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Chat rate limit reached. Please wait a moment before sending more messages.' },
  });

  // Auth limiter — prevent brute-force
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,  // 15 minutes
    max: 10,                // 10 login/register attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  });

  app.use('/api', generalLimiter);

  // ── Health check ────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── API routes ──────────────────────────────────────────────────────────────
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/chat', chatLimiter, chatRoutes);
  app.use('/api/agents', agentsRoutes);
  app.use('/api/conversations', conversationsRoutes);
  app.use('/api/users', usersRoutes);

  // ── 404 & error handlers (must be last) ────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
