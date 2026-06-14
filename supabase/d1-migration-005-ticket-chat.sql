-- ClassOrbit D1 Migration 005 — Ticket Chat & AI Agent Tracking
-- Run: wrangler d1 execute classorbit-db --file=supabase/d1-migration-005-ticket-chat.sql --local

ALTER TABLE support_tickets ADD COLUMN assigned_to TEXT DEFAULT NULL;
-- Values: 'admin' | 'ai_agent' | null (waiting)

ALTER TABLE support_tickets ADD COLUMN chat_status TEXT DEFAULT 'waiting_for_admin';
-- Values: 'waiting_for_admin' | 'admin_active' | 'ai_agent_active' | 'resolved'

CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    text TEXT NOT NULL,
    type TEXT DEFAULT 'message',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
