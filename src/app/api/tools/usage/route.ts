import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB, nanoid } from '@/lib/d1';

export const runtime = 'edge';

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tool_id, tool_name, is_custom = false, action_type } = await req.json();

  if (!tool_id || !tool_name || !action_type) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const id = nanoid();
  await db.prepare(`
    INSERT INTO tool_usage (id, user_id, tool_id, tool_name, is_custom, action_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    user.id,
    tool_id,
    tool_name.trim(),
    is_custom ? 1 : 0,
    action_type
  ).run();

  return NextResponse.json({ success: true });
}
