import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDB } from '@/lib/d1';
import { isAdminRequest } from '@/lib/admin-auth';

export const runtime = 'edge';

function getJwtSecret(): string {
  try {
    const { env } = getRequestContext();
    return ((env as Record<string, string>).ADMIN_JWT_SECRET) || process.env.ADMIN_JWT_SECRET || 'dev_secret';
  } catch {
    return process.env.ADMIN_JWT_SECRET || 'dev_secret';
  }
}

export async function GET(req: Request) {
  const secret = getJwtSecret();
  if (!(await isAdminRequest(req, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const [
    totalPrompts,
    uniqueUsers,
    proUsers,
    waitlistCount,
    activeTools,
    totalTools,
    recentPrompts,
    recentWaitlist,
    toolUsageSummary,
    customToolsList,
    feedbackStats,
    feedbackList,
    openTickets,
  ] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM saved_prompts').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM user_profiles').first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM user_profiles WHERE plan_type = 'pro'").first<{ count: number }>().catch(() => ({ count: 0 })),
    db.prepare('SELECT COUNT(*) as count FROM waitlist').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM system_tools WHERE active = 1').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM system_tools').first<{ count: number }>(),
    db.prepare('SELECT user_id, topic, content_type, created_at FROM saved_prompts ORDER BY created_at DESC LIMIT 10').all(),
    db.prepare('SELECT email, name, created_at FROM waitlist ORDER BY created_at DESC LIMIT 10').all(),
    db.prepare('SELECT tool_id, tool_name, is_custom, COUNT(*) as count, MAX(created_at) as last_used FROM tool_usage GROUP BY tool_id, tool_name, is_custom ORDER BY count DESC LIMIT 20').all().catch(() => ({ results: [] })),
    db.prepare('SELECT c.id, c.user_id, c.tool_name, c.tool_url, c.description, c.category, c.is_free, c.created_at, p.email as user_email FROM custom_tools c LEFT JOIN user_profiles p ON c.user_id = p.user_id ORDER BY c.created_at DESC LIMIT 50').all().catch(() => ({ results: [] })),
    db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM platform_feedback').first<{ avg: number; count: number }>().catch(() => ({ avg: 0, count: 0 })),
    db.prepare('SELECT user_email, rating, feedback, created_at FROM platform_feedback ORDER BY created_at DESC LIMIT 50').all().catch(() => ({ results: [] })),
    db.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE status = 'open'").first<{ count: number }>().catch(() => ({ count: 0 })),
  ]);

  return NextResponse.json({
    total_prompts: totalPrompts?.count ?? 0,
    unique_users: uniqueUsers?.count ?? 0,
    pro_users: (proUsers as any)?.count ?? 0,
    waitlist_count: waitlistCount?.count ?? 0,
    active_tools: activeTools?.count ?? 0,
    total_tools: totalTools?.count ?? 0,
    recent_prompts: recentPrompts.results ?? [],
    recent_waitlist: recentWaitlist.results ?? [],
    tool_usage: toolUsageSummary?.results ?? [],
    custom_tools: customToolsList?.results ?? [],
    feedback_avg: feedbackStats?.avg ?? 0,
    feedback_count: feedbackStats?.count ?? 0,
    feedback_list: feedbackList?.results ?? [],
    open_tickets_count: openTickets?.count ?? 0,
  });
}
