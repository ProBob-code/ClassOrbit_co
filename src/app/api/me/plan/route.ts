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
  let profile = await db.prepare(
    'SELECT plan_type, subscription_status, plan_expires_at, is_blocked, email, name FROM user_profiles WHERE user_id = ?'
  ).bind(user.id).first<{ plan_type: string; subscription_status: string; plan_expires_at: string | null; is_blocked: number; email: string | null; name: string | null }>();

  const email = user.email || null;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || null;

  if (!profile) {
    // Auto-create profile for new users
    await db.prepare(
      "INSERT OR IGNORE INTO user_profiles (user_id, plan_type, subscription_status, email, name) VALUES (?, 'free', 'active', ?, ?)"
    ).bind(user.id, email, name).run();

    profile = {
      plan_type: 'free',
      subscription_status: 'active',
      plan_expires_at: null,
      is_blocked: 0,
      email,
      name
    };
  } else if (!profile.email || !profile.name) {
    // Fill in missing email/name for existing profile rows
    await db.prepare(
      "UPDATE user_profiles SET email = COALESCE(email, ?), name = COALESCE(name, ?) WHERE user_id = ?"
    ).bind(email, name, user.id).run();
  }

  let plan_type = profile.plan_type;
  let subscription_status = profile.subscription_status;
  const is_blocked = profile.is_blocked === 1;

  // Check if pro plan has expired
  if (plan_type === 'pro' && profile.plan_expires_at) {
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
