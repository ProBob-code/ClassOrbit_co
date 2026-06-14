-- ClassOrbit D1 Migration 004 — Support Tickets
-- Run: wrangler d1 execute classorbit-db --file=supabase/d1-migration-004-support-tickets.sql --local

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'resolved'
  chat_status TEXT DEFAULT 'waiting_for_admin', -- 'waiting_for_admin', 'admin_active', 'ai_agent_active', 'resolved'
  assigned_to TEXT,
  solution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender TEXT NOT NULL, -- 'user', 'admin', 'ai_agent', 'system'
  sender_name TEXT,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'message', -- 'message', 'resolution', 'system'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
