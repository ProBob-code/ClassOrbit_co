import { NextResponse } from 'next/server';
import { getDB, nanoid } from '@/lib/d1';
import { createClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

function getJwtSecret(): string {
  try {
    const { env } = getRequestContext();
    return ((env as Record<string, string>).ADMIN_JWT_SECRET) || process.env.ADMIN_JWT_SECRET || 'dev_secret';
  } catch {
    return process.env.ADMIN_JWT_SECRET || 'dev_secret';
  }
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const ticketId = params.id;

  // Verify auth (Admin or User)
  const secret = getJwtSecret();
  const isAdmin = await isAdminRequest(req, secret);

  let user = null;
  if (!isAdmin) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Fetch ticket to verify ownership if not admin
  const ticket = await db.prepare('SELECT user_id, chat_status FROM support_tickets WHERE id = ?').bind(ticketId).first();
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

  if (!isAdmin && ticket.user_id !== user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const messages = await db.prepare(
      'SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC'
    ).bind(ticketId).all();

    return NextResponse.json({
      meta: { status: ticket.chat_status },
      messages: messages.results || [] 
    });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const ticketId = params.id;

  try {
    const body = await req.json();
    const { text, sender, senderName, type } = body;

    if (!text || !sender) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const secret = getJwtSecret();
    const isAdmin = await isAdminRequest(req, secret);
    
    let user = null;
    if (!isAdmin) {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const ticket = await db.prepare('SELECT user_id, status FROM support_tickets WHERE id = ?').bind(ticketId).first();
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    if (!isAdmin && ticket.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (ticket.status === 'resolved') {
      return NextResponse.json({ error: 'Ticket is resolved' }, { status: 400 });
    }

    const msgId = 'msg_' + nanoid();

    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(msgId, ticketId, sender, senderName || sender, text, type || 'message').run();

    return NextResponse.json({ success: true, id: msgId });
  } catch (error) {
    console.error('Failed to post message:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}
