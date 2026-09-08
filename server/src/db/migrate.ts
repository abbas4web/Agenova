/**
 * Database migration runner.
 *
 * Usage:  npm run migrate
 *
 * - Reads all .sql files from the migrations directory in filename order.
 * - Tracks applied migrations in the schema_migrations table.
 * - Skips already-applied migrations (idempotent).
 * - Runs each migration inside a transaction (rolls back on error).
 */

import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';
import { logger } from '../config/logger';

// Must load env before anything else
import '../config/env';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate(): Promise<void> {
  const client = await pool.connect();

  try {
    // ── 1. Ensure the tracking table exists ────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id         SERIAL        PRIMARY KEY,
        filename   VARCHAR(255)  NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // ── 2. Load already-applied migration filenames ─────────────────────────
    const { rows: applied } = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations ORDER BY filename ASC'
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // ── 3. Read migration files sorted by name ──────────────────────────────
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // ── 4. Run pending migrations ────────────────────────────────────────────
    let ranCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.info({ file }, 'Migration already applied — skipping');
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info({ file }, 'Applying migration…');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        logger.info({ file }, '✅  Migration applied');
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ file, err }, '❌  Migration failed — rolled back');
        throw err;
      }
    }

    if (ranCount === 0) {
      logger.info('Database is already up to date.');
    } else {
      logger.info({ count: ranCount }, `✅  ${ranCount} migration(s) applied successfully.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  logger.error({ err }, 'Migration runner failed');
  process.exit(1);
});
