-- Migration 003: Feedback and Tool Usage tracking
-- Run: wrangler d1 execute classorbit-db --file=supabase/d1-migration-003-feedback-usage.sql --local
-- Or for production: wrangler d1 execute classorbit-db --file=supabase/d1-migration-003-feedback-usage.sql --remote

CREATE TABLE IF NOT EXISTS tool_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  is_custom INTEGER DEFAULT 0,
  action_type TEXT NOT NULL, -- 'launch' (from launchpad) or 'builder_use' (from prompt builder)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);

CREATE TABLE IF NOT EXISTS platform_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  rating INTEGER NOT NULL, -- 1 to 5 stars
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_platform_feedback_rating ON platform_feedback(rating);
