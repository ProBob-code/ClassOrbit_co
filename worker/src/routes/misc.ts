import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB, nanoid } from '../lib/d1';
import { getSupabase } from '../lib/supabase';

const router = new Hono<AppEnv>();

const FREE_LIMIT = 25;

router.post('/waitlist', async (c) => {
  const db = getDB(c);

  const { email, name } = await c.req.json();
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return c.json({ error: 'Valid email required' }, 400);
  }

  try {
    await db.prepare(
      'INSERT INTO waitlist (email, name) VALUES (?, ?)'
    ).bind(email.trim().toLowerCase(), name?.trim() ?? null).run();
    return c.json({ ok: true });
  } catch {
    // UNIQUE constraint: already on waitlist
    return c.json({ ok: true, already: true });
  }
});

router.get('/waitlist/count', async (c) => {
  const db = getDB(c);
  const result = await db.prepare('SELECT COUNT(*) as count FROM waitlist').first<{ count: number }>();
  return c.json({ count: result?.count ?? 0 });
});

router.post('/feedback', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { rating, feedback } = await c.req.json();

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
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

  return c.json({ success: true });
});

router.get('/me/plan', async (c) => {
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const db = getDB(c);

  // Get plan. Wrap the read so a DB/schema error surfaces loudly in logs and
  // returns an error — instead of throwing into a generic 500 that the client
  // silently treats as "free" (the "paid but shows FREE" failure mode).
  type Profile = { plan_type: string; subscription_status: string; plan_expires_at: string | null; is_blocked: number; email: string | null; name: string | null };
  let profile: Profile | null = null;
  try {
    profile = await db.prepare(
      'SELECT plan_type, subscription_status, plan_expires_at, is_blocked, email, name FROM user_profiles WHERE user_id = ?'
    ).bind(user.id).first<Profile>();
  } catch (err) {
    console.error('[/me/plan] Failed to read user_profiles for user', user.id, err);
    return c.json({ error: 'Could not load your plan. Please try again.' }, 500);
  }

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

  return c.json({
    plan_type,
    prompts_used,
    prompt_limit,
    is_pro,
    plan_expires_at: profile?.plan_expires_at ?? null,
    subscription_status,
    is_blocked
  });
});

router.post('/me/cancel-plan', async (c) => {
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const db = getDB(c);

  try {
    const profile = await db.prepare(
      'SELECT plan_type, subscription_status FROM user_profiles WHERE user_id = ?'
    ).bind(user.id).first<{ plan_type: string; subscription_status: string }>();

    if (!profile || profile.plan_type !== 'pro') {
      return c.json({ error: 'You are not on a Pro plan' }, 400);
    }

    if (profile.subscription_status === 'cancelled') {
      return c.json({ error: 'Plan is already cancelled' }, 400);
    }

    await db.prepare(
      "UPDATE user_profiles SET subscription_status = 'cancelled' WHERE user_id = ?"
    ).bind(user.id).run();

    return c.json({ success: true, message: 'Plan cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling plan:', error);
    return c.json({ error: 'Failed to cancel plan' }, 500);
  }
});

router.post('/export', async (c) => {
  try {
    const body = await c.req.json();
    const { folderName, files } = body;

    if (!folderName || !files) {
      return c.json({ error: 'Missing folderName or files' }, 400);
    }

    // Server-side fallback for large exports
    // In production, this would use JSZip on the server
    return c.json({
      message: 'Export initiated',
      folderName,
      fileCount: files.length,
    });
  } catch {
    return c.json({ error: 'Failed to process export request' }, 500);
  }
});

export default router;
