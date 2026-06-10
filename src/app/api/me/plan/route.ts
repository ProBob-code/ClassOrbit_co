import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

const FREE_LIMIT = 25;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDB();
  if (!db) {
    return NextResponse.json({ plan_type: 'free', prompts_used: 0, prompt_limit: FREE_LIMIT, is_pro: false });
  }

  // Get plan
  const profile = await db.prepare(
    'SELECT plan_type, subscription_status, plan_expires_at, is_blocked FROM user_profiles WHERE user_id = ?'
  ).bind(user.id).first<{ plan_type: string; subscription_status: string; plan_expires_at: string | null; is_blocked: number }>();

  let plan_type = profile?.plan_type ?? 'free';
  let subscription_status = profile?.subscription_status ?? 'active';
  const is_blocked = (profile?.is_blocked ?? 0) === 1;

  // Check if pro plan has expired
  if (plan_type === 'pro' && profile?.plan_expires_at) {
    if (new Date(profile.plan_expires_at) < new Date()) {
      plan_type = 'free';
      subscription_status = 'expired';
      // Mark as expired in DB (non-blocking)
      db.prepare('UPDATE user_profiles SET plan_type = ?, subscription_status = ? WHERE user_id = ?')
        .bind('free', 'expired', user.id).run();
    }
  }

  // Get this month's prompt usage
  const month = new Date().toISOString().slice(0, 7); // '2026-06'
  const usage = await db.prepare(
    'SELECT count FROM prompt_usage WHERE user_id = ? AND month = ?'
  ).bind(user.id, month).first<{ count: number }>();

  const prompts_used = usage?.count ?? 0;
  const is_pro = plan_type === 'pro' || plan_type === 'school';
  const prompt_limit = is_pro ? null : FREE_LIMIT; // null = unlimited

  return NextResponse.json({ 
    plan_type, 
    prompts_used, 
    prompt_limit, 
    is_pro, 
    plan_expires_at: profile?.plan_expires_at ?? null,
    subscription_status,
    is_blocked
  });
}
