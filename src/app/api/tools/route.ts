import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB, nanoid } from '@/lib/d1';

export const runtime = 'edge';

export async function GET() {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await db.prepare(
    'SELECT * FROM custom_tools WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return NextResponse.json({ tools: result.results });
}

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tool_name, tool_url, description, category = 'text', is_free = true } = await req.json();
  if (!tool_name?.trim() || !tool_url?.trim()) {
    return NextResponse.json({ error: 'tool_name and tool_url are required' }, { status: 400 });
  }

  const id = nanoid();
  await db.prepare(
    'INSERT INTO custom_tools (id, user_id, tool_name, tool_url, description, category, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user.id, tool_name.trim(), tool_url.trim(), description ?? null, category, is_free ? 1 : 0).run();

  return NextResponse.json({ id });
}
