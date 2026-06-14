import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const ticketId = params.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const ticket = await db.prepare('SELECT user_id, status FROM support_tickets WHERE id = ?').bind(ticketId).first();
    
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    
    if (ticket.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (ticket.status !== 'resolved') {
      return NextResponse.json({ error: 'Ticket is not resolved' }, { status: 400 });
    }

    await db.prepare(
      'UPDATE support_tickets SET status = ?, chat_status = ?, assigned_to = NULL WHERE id = ?'
    ).bind('open', 'waiting_for_admin', ticketId).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to reopen ticket:', error);
    return NextResponse.json({ error: 'Failed to reopen ticket' }, { status: 500 });
  }
}
