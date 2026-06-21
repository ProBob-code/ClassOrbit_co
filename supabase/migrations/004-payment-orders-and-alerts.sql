-- ClassOrbit D1 Migration 004 — webhook order mapping + alert throttle
-- Run: wrangler d1 execute classorbit-db --file=supabase/migrations/004-payment-orders-and-alerts.sql --remote
--
-- payment_orders lets the Razorpay webhook map an order back to a user/plan even
-- when the buyer never returns to the in-browser verify step.
-- alert_log backs the admin-email throttle (one email per key per window).

CREATE TABLE IF NOT EXISTS payment_orders (
  order_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER,
  status TEXT NOT NULL DEFAULT 'created',
  razorpay_payment_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);

CREATE TABLE IF NOT EXISTS alert_log (
  alert_key TEXT PRIMARY KEY,
  last_sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
