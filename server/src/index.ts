/**
 * Agentora Server — Entry Point
 *
 * Startup order:
 *   1. Validate environment variables
 *   2. Connect to PostgreSQL
 *   3. Register tools (must be before agents)
 *   4. Register agents
 *   5. Start HTTP server
 */

import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';

// ── Bootstrap tools & agents ─────────────────────────────────────────────────
// These imports trigger self-registration side effects.
// Tools must be imported before agents (agents reference tool names).
import './tools/index';
import './agents/index';

// ── Express app ───────────────────────────────────────────────────────────────
import { createApp } from './app';

async function start(): Promise<void> {
  // Connect to DB before accepting traffic
  await connectDB();

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(
      {
        port: env.port,
        env: env.nodeEnv,
        aiProvider: env.aiProvider,
      },
      `🚀  Agentora server running on http://localhost:${env.port}`
    );
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received — closing server gracefully');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force-close after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forcefully shutting down after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

start().catch((err) => {
  logger.error({ err }, '❌  Failed to start server');
  process.exit(1);
});
