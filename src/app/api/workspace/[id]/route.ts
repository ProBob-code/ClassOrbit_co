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
  const body = await req.json();

  if (body.kind === 'folder') {
    const { name, sticker, color } = body;
    await db.prepare(
      'UPDATE folders SET name = COALESCE(?, name), sticker = COALESCE(?, sticker), color = COALESCE(?, color) WHERE id = ? AND user_id = ?'
    ).bind(name ?? null, sticker ?? null, color ?? null, id, user.id).run();
    return NextResponse.json({ ok: true });
  }

  if (body.kind === 'file') {
    const { content, name } = body;
    await db.prepare(
      'UPDATE files SET content = COALESCE(?, content), name = COALESCE(?, name) WHERE id = ? AND user_id = ?'
    ).bind(content ?? null, name ?? null, id, user.id).run();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { kind } = await req.json();

  if (kind === 'folder') {
    await db.prepare('DELETE FROM files WHERE folder_id = ? AND user_id = ?').bind(id, user.id).run();
    await db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return NextResponse.json({ ok: true });
  }

  if (kind === 'file') {
    await db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
}
