import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB, nanoid } from '@/lib/d1';

export const runtime = 'edge';

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { tool_name, tool_url, prompt_text, topic, content_type, grade, subject } = await req.json();
  if (!prompt_text?.trim() || !tool_name?.trim()) {
    return NextResponse.json({ error: 'prompt_text and tool_name required' }, { status: 400 });
  }

  const id = nanoid();
  await db.prepare(
    'INSERT INTO prompt_shares (id, user_id, tool_name, tool_url, prompt_text, topic, content_type, grade, subject) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user?.id ?? null, tool_name, tool_url ?? '', prompt_text, topic ?? null, content_type ?? null, grade ?? null, subject ?? null).run();

  return NextResponse.json({ id, url: `/p/${id}` });
}

export async function GET(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const share = await db.prepare(
    'SELECT * FROM prompt_shares WHERE id = ?'
  ).bind(id).first();

  if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.prepare('UPDATE prompt_shares SET view_count = view_count + 1 WHERE id = ?').bind(id).run();

  return NextResponse.json(share);
}
