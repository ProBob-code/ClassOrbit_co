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

  const { rating, feedback } = await req.json();

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const id = nanoid();
  await db.prepare(`
    INSERT INTO platform_feedback (id, user_id, user_email, rating, feedback)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    id,
    user.id,
    user.email || 'unknown',
    rating,
    feedback?.trim() || null
  ).run();

  return NextResponse.json({ success: true });
}
