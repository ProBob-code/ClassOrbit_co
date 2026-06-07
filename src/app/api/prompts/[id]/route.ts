import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { is_favorite } = await req.json();

  await db.prepare(
    'UPDATE saved_prompts SET is_favorite = ? WHERE id = ? AND user_id = ?'
  ).bind(is_favorite ? 1 : 0, id, user.id).run();

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.prepare('DELETE FROM saved_prompts WHERE id = ? AND user_id = ?').bind(id, user.id).run();

  return NextResponse.json({ ok: true });
}
