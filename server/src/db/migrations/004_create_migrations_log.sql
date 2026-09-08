-- Migration 004: Create migrations tracking table
-- Run order: this is actually run FIRST by the migrate script to track what's been applied

CREATE TABLE IF NOT EXISTS schema_migrations (
  id         SERIAL        PRIMARY KEY,
  filename   VARCHAR(255)  NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
