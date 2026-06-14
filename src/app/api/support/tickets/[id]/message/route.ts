import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1';
import { isAdminRequest } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
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

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const ticketId = params.id;

  const body = await req.json();
  const { text, sender } = body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
  }

  if (!sender || !['admin', 'user'].includes(sender)) {
    return NextResponse.json({ error: 'Invalid sender' }, { status: 400 });
  }

  // Auth check based on sender
  if (sender === 'admin') {
    const secret = getJwtSecret();
    if (!(await isAdminRequest(req, secret))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDB();
    if (!db) {
      return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const msgId = 'msg_' + Date.now();
    const senderName = sender === 'admin' ? 'ClassOrbit Admin' : 'User';
    
    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text) VALUES (?, ?, ?, ?, ?)'
    ).bind(msgId, ticketId, sender, senderName, text.trim()).run();

    // If admin sends the first message, update status to admin_active
    if (sender === 'admin') {
      await db.prepare(
        "UPDATE support_tickets SET chat_status = 'admin_active', assigned_to = 'admin' WHERE id = ? AND chat_status = 'waiting_for_admin'"
      ).bind(ticketId).run();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
