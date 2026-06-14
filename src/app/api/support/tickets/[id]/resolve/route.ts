import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDB } from '@/lib/d1';
import { isAdminRequest } from '@/lib/admin-auth';
import { nanoid } from '@/lib/d1';
import { createClient } from '@/lib/supabase/server';

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

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  // If not admin, check if user owns the ticket
  if (!isAdmin) {
    const ticket = await db.prepare('SELECT user_id FROM support_tickets WHERE id = ?').bind(params.id).first();
    if (!ticket || ticket.user_id !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { solution } = body;

    if (!solution || typeof solution !== 'string' || !solution.trim()) {
      return NextResponse.json({ error: 'Solution is required' }, { status: 400 });
    }

    const resolvedAt = new Date().toISOString();

    await db.prepare(
      "UPDATE support_tickets SET status = 'resolved', solution = ?, resolved_at = ?, chat_status = 'resolved' WHERE id = ?"
    ).bind(solution.trim(), resolvedAt, params.id).run();

    // Insert resolution message
    const msgId = 'msg_' + nanoid();
    await db.prepare(
      'INSERT INTO ticket_messages (id, ticket_id, sender, sender_name, text, type) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      msgId, 
      params.id, 
      isAdmin ? 'admin' : 'user', 
      isAdmin ? 'ClassOrbit Admin' : 'User', 
      solution.trim(), 
      'resolution'
    ).run();

    // Fetch the updated ticket
    const ticket = await db.prepare(
      'SELECT * FROM support_tickets WHERE id = ?'
    ).bind(params.id).first();

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Failed to resolve support ticket:', error);
    return NextResponse.json({ error: 'Failed to resolve ticket' }, { status: 500 });
  }
}
