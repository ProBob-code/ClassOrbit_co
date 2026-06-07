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

async function requireAdmin(req: Request): Promise<Response | null> {
  const valid = await isAdminRequest(req, getJwtSecret());
  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  const body = await req.json();
  const sets: string[] = [];
  const values: any[] = [];

  const fields = ['tool_name', 'tool_url', 'tool_logo', 'category', 'description', 'pricing_info', 'sort_order', 'new_until'];
  for (const f of fields) {
    if (f in body) { sets.push(`${f} = ?`); values.push(body[f]); }
  }
  for (const f of ['is_free', 'active', 'is_new']) {
    if (f in body) { sets.push(`${f} = ?`); values.push(body[f] ? 1 : 0); }
  }
  if ('supported_outputs' in body) { sets.push('supported_outputs = ?'); values.push(JSON.stringify(body.supported_outputs)); }
  if ('walkthrough_steps' in body) { sets.push('walkthrough_steps = ?'); values.push(body.walkthrough_steps ? JSON.stringify(body.walkthrough_steps) : null); }
  if (body.is_new && !body.new_until) {
    const d = new Date(); d.setDate(d.getDate() + 7);
    sets.push('new_until = ?'); values.push(d.toISOString());
  }
  sets.push('updated_at = ?'); values.push(new Date().toISOString());
  values.push(id);

  await db.prepare(`UPDATE system_tools SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(_req);
  if (denied) return denied;

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { id } = await params;
  await db.prepare('DELETE FROM system_tools WHERE id = ?').bind(id).run();
  return NextResponse.json({ ok: true });
}
