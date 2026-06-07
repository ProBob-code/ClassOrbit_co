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
    'SELECT * FROM saved_prompts WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  const prompts = result.results.map((p: any) => ({
    ...p,
    tools: p.tools ? JSON.parse(p.tools) : [],
    is_favorite: p.is_favorite === 1,
  }));

  return NextResponse.json({ prompts });
}

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content_type, grade, subject, topic, tools = [], is_favorite = false, prompt_text } = await req.json();

  const id = nanoid();
  await db.prepare(
    'INSERT INTO saved_prompts (id, user_id, content_type, grade, subject, topic, tools, is_favorite, prompt_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user.id, content_type ?? null, grade ?? null, subject ?? null, topic ?? null, JSON.stringify(tools), is_favorite ? 1 : 0, prompt_text ?? null).run();

  return NextResponse.json({ id });
}
