import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDB, nanoid } from '@/lib/d1';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/admin-auth';

export const runtime = 'edge';

function getJwtSecret(): string {
  try {
    const { env } = getRequestContext();
    return ((env as Record<string, string>).ADMIN_JWT_SECRET) || process.env.ADMIN_JWT_SECRET || 'dev_secret';
  } catch {
    return process.env.ADMIN_JWT_SECRET || 'dev_secret';
  }
}

export async function GET(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  // 1. Check if admin request
  const secret = getJwtSecret();
  const isAdmin = await isAdminRequest(req, secret);

  if (isAdmin) {
    try {
      const tickets = await db.prepare(
        'SELECT * FROM support_tickets ORDER BY created_at DESC'
      ).all();
      return NextResponse.json({ tickets: tickets.results || [] });
    } catch (error: any) {
      console.error('Failed to fetch admin tickets:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
  }

  // 2. Otherwise verify user authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tickets = await db.prepare(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(user.id).all();
    return NextResponse.json({ tickets: tickets.results || [] });
  } catch (error: any) {
    console.error('Failed to fetch user tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  // Verify user authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const ticketId = 'tkt_' + nanoid();
    const email = user.email || null;
    const name = user.user_metadata?.full_name || user.user_metadata?.name || null;

    await db.prepare(
      'INSERT INTO support_tickets (id, user_id, user_email, user_name, message, status, chat_status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(ticketId, user.id, email, name, message.trim(), 'open', 'waiting_for_admin', null).run();

    // Insert initial message into ticket_messages
    const msgId = 'msg_' + nanoid();
    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(msgId, ticketId, 'user', name || 'User', message.trim(), 'message').run();

    // Fetch the newly created ticket to return it
    const ticket = await db.prepare(
      'SELECT * FROM support_tickets WHERE id = ?'
    ).bind(ticketId).first();

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Failed to create support ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
