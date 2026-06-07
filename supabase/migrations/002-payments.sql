-- ClassOrbit D1 Migration 002 — Payment & Plan Tracking
-- Run: wrangler d1 execute classorbit-db --file=supabase/migrations/002-payments.sql --remote

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  plan_type TEXT NOT NULL DEFAULT 'free',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'active',
  plan_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prompt_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  month TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, month)
);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_user_month ON prompt_usage(user_id, month);
