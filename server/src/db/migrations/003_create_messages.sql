-- Migration 003: Create messages table
-- Run order: 3 (depends on conversations)

CREATE TYPE message_role AS ENUM ('user', 'assistant', 'tool', 'system');

CREATE TABLE IF NOT EXISTS messages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID          NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            message_role  NOT NULL,
  content         TEXT          NOT NULL,
  tool_name       VARCHAR(100),
  metadata        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at      ON messages (created_at ASC);
