import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info('✅  PostgreSQL connected');
  } finally {
    client.release();
  }
}

/**
 * Generic query helper — parameterised to prevent SQL injection.
 * Usage: query('SELECT * FROM users WHERE id = $1', [userId])
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (env.isDev) {
    logger.debug({ query: text, duration, rows: result.rowCount }, 'DB query');
  }

  return result.rows as T[];
}

/**
 * Same as query() but returns the first row or null.
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
