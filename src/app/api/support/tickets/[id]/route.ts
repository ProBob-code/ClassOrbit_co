import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDB } from '@/lib/d1';
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

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const secret = getJwtSecret();
  if (!(await isAdminRequest(req, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  try {
    // Delete messages associated with the ticket first
    await db.prepare('DELETE FROM ticket_messages WHERE ticket_id = ?').bind(params.id).run();
    
    // Delete the ticket
    await db.prepare('DELETE FROM support_tickets WHERE id = ?').bind(params.id).run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete support ticket:', error);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 });
  }
}
