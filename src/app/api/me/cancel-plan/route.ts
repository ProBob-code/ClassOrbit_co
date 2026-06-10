import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  try {
    const profile = await db.prepare(
      'SELECT plan_type, subscription_status FROM user_profiles WHERE user_id = ?'
    ).bind(user.id).first<{ plan_type: string; subscription_status: string }>();

    if (!profile || profile.plan_type !== 'pro') {
      return NextResponse.json({ error: 'You are not on a Pro plan' }, { status: 400 });
    }

    if (profile.subscription_status === 'cancelled') {
      return NextResponse.json({ error: 'Plan is already cancelled' }, { status: 400 });
    }

    await db.prepare(
      "UPDATE user_profiles SET subscription_status = 'cancelled' WHERE user_id = ?"
    ).bind(user.id).run();

    return NextResponse.json({ success: true, message: 'Plan cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling plan:', error);
    return NextResponse.json({ error: 'Failed to cancel plan' }, { status: 500 });
  }
}
