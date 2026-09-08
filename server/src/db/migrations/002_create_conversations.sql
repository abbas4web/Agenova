-- Migration 002: Create conversations table
-- Run order: 2 (depends on users)

CREATE TABLE IF NOT EXISTS conversations (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id   VARCHAR(50)   NOT NULL,
  title      VARCHAR(255)  NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id    ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id   ON conversations (agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC);

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
