import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB, nanoid } from '../lib/d1';
import { getSessionUser } from '../lib/user-auth';
import { isAdminRequest } from '../lib/admin-auth';

// Public tracking beacon. The frontend (src/components/AnalyticsBeacon.tsx)
// POSTs here on every route change and then heartbeats every 60s while the tab
// is visible. Feeds the admin Monitoring tab; see migration 008-analytics.sql.

const router = new Hono<AppEnv>();

const SESSION_GAP = "'-30 minutes'"; // inactivity window before a new session starts

const BOT_UA = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|embedly|quora link preview|vkshare|curl|wget|python-requests|headless/i;

function deviceFromUA(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

router.post('/track', async (c) => {
  let body: { vid?: string; path?: string; ref?: string; beat?: boolean };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Bad request' }, 400);
  }

  const vid = typeof body.vid === 'string' ? body.vid : '';
  const path = typeof body.path === 'string' ? body.path : '';
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(vid) || !/^\/(?!\/)/.test(path) || path.length > 300) {
    return c.json({ error: 'Bad request' }, 400);
  }
  // Never count admin traffic in visitor stats.
  if (path.startsWith('/admin')) return c.json({ ok: true });

  const ua = c.req.header('User-Agent') ?? '';
  if (BOT_UA.test(ua)) return c.json({ ok: true });

  const country = ((c.req.raw as any).cf?.country as string | undefined) ?? c.req.header('CF-IPCountry') ?? null;
  const device = deviceFromUA(ua);
  // Referrer arrives pre-stripped to an external hostname; cap it defensively.
  const referrer = typeof body.ref === 'string' && body.ref ? body.ref.slice(0, 120) : null;
  const beat = body.beat === true;

  const user = await getSessionUser(c).catch(() => null);
  const db = getDB(c);

  const open = await db
    .prepare(
      `SELECT id FROM analytics_sessions WHERE visitor_id = ? AND last_seen >= datetime('now', ${SESSION_GAP}) ORDER BY last_seen DESC LIMIT 1`
    )
    .bind(vid)
    .first<{ id: string }>()
    .catch(() => null);

  const statements: D1PreparedStatement[] = [];

  if (open) {
    statements.push(
      db.prepare(
        `UPDATE analytics_sessions SET
           last_seen = datetime('now'),
           duration_seconds = CAST((julianday(datetime('now')) - julianday(started_at)) * 86400 AS INTEGER),
           pageviews = pageviews + ?,
           current_path = ?,
           user_id = COALESCE(?, user_id)
         WHERE id = ?`
      ).bind(beat ? 0 : 1, path, user?.id ?? null, open.id)
    );
  } else {
    statements.push(
      db.prepare(
        `INSERT INTO analytics_sessions (id, visitor_id, user_id, entry_path, current_path, country, device, pageviews)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(nanoid(), vid, user?.id ?? null, path, path, country, device, beat ? 0 : 1)
    );
  }

  if (!beat) {
    statements.push(
      db.prepare(
        'INSERT INTO page_views (visitor_id, user_id, path, referrer, country, device) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(vid, user?.id ?? null, path, referrer, country, device)
    );
  }

  // Best-effort: analytics must never break the site if a table is missing.
  await db.batch(statements).catch((err) => console.error('[track]', err));

  return c.json({ ok: true });
});

// Stats for the standalone /monitoring page. Requires the same admin session
// cookie as the admin panel (the monitoring page shows the admin login form
// when the cookie is missing/expired and posts to /api/admin/login).
router.post('/analytics/stats', async (c) => {
  const valid = await isAdminRequest(c.req.raw, c.env.ADMIN_JWT_SECRET);
  if (!valid) return c.json({ error: 'Unauthorized' }, 401);

  const db = getDB(c);

  // Opportunistic retention: keep the sessions table from growing forever.
  await db.prepare("DELETE FROM analytics_sessions WHERE last_seen < datetime('now', '-90 days')").run().catch(() => {});

  const one = (sql: string) => db.prepare(sql).first<Record<string, number>>().catch(() => null);
  const many = (sql: string) => db.prepare(sql).all().then((r) => r.results ?? []).catch(() => []);

  const [
    activeNow, activeList,
    visitors, pageviews, sessionStats,
    signups, logins, recentLogins,
    trafficDaily, signupsDaily, loginsDaily,
    topPages, blogViews, referrers, countries, devices,
    prompts30d, toolLaunches30d, proUsers,
    googleUsers, googleAccounts, bounce, visitorRepeat,
    hourly24h, promptsDaily, entryPages,
  ] = await Promise.all([
    one("SELECT COUNT(*) AS count FROM analytics_sessions WHERE last_seen >= datetime('now', '-5 minutes')"),
    many(`SELECT s.current_path, s.device, s.country, s.started_at, s.last_seen, s.pageviews, u.email, u.name
          FROM analytics_sessions s LEFT JOIN users u ON u.id = s.user_id
          WHERE s.last_seen >= datetime('now', '-5 minutes') ORDER BY s.last_seen DESC LIMIT 50`),
    one(`SELECT
           COUNT(DISTINCT CASE WHEN created_at >= datetime('now', 'start of day') THEN visitor_id END) AS today,
           COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-7 days') THEN visitor_id END) AS d7,
           COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-30 days') THEN visitor_id END) AS d30,
           COUNT(DISTINCT visitor_id) AS total
         FROM page_views`),
    one(`SELECT
           COUNT(CASE WHEN created_at >= datetime('now', 'start of day') THEN 1 END) AS today,
           COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) AS d7,
           COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) AS d30,
           COUNT(*) AS total
         FROM page_views`),
    one(`SELECT COUNT(*) AS sessions, COALESCE(AVG(duration_seconds), 0) AS avg_duration,
           COALESCE(SUM(duration_seconds), 0) AS total_duration, COALESCE(AVG(pageviews), 0) AS avg_pageviews
         FROM analytics_sessions WHERE started_at >= datetime('now', '-30 days')`),
    one(`SELECT COUNT(*) AS total,
           COUNT(CASE WHEN created_at >= datetime('now', 'start of day') THEN 1 END) AS today,
           COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) AS d7,
           COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) AS d30
         FROM users`),
    one(`SELECT COUNT(*) AS total,
           COUNT(CASE WHEN created_at >= datetime('now', 'start of day') THEN 1 END) AS today,
           COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) AS d7,
           COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) AS d30
         FROM login_events`),
    many('SELECT email, name, is_new_user, country, created_at FROM login_events ORDER BY created_at DESC LIMIT 25'),
    many(`SELECT date(created_at) AS day, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
          FROM page_views WHERE created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day`),
    many(`SELECT date(created_at) AS day, COUNT(*) AS count FROM users
          WHERE created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day`),
    many(`SELECT date(created_at) AS day, COUNT(*) AS count FROM login_events
          WHERE created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day`),
    many(`SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM page_views
          WHERE created_at >= datetime('now', '-30 days') GROUP BY path ORDER BY views DESC LIMIT 15`),
    many(`SELECT b.title, b.slug, COUNT(v.id) AS views, COUNT(DISTINCT v.visitor_id) AS readers
          FROM blogs b LEFT JOIN page_views v ON v.path = '/blog/' || b.slug
          GROUP BY b.id ORDER BY views DESC LIMIT 15`),
    many(`SELECT referrer, COUNT(*) AS views FROM page_views
          WHERE referrer IS NOT NULL AND created_at >= datetime('now', '-30 days')
          GROUP BY referrer ORDER BY views DESC LIMIT 10`),
    many(`SELECT country, COUNT(DISTINCT visitor_id) AS visitors FROM page_views
          WHERE country IS NOT NULL AND created_at >= datetime('now', '-30 days')
          GROUP BY country ORDER BY visitors DESC LIMIT 10`),
    many(`SELECT device, COUNT(DISTINCT visitor_id) AS visitors FROM page_views
          WHERE device IS NOT NULL AND created_at >= datetime('now', '-30 days')
          GROUP BY device ORDER BY visitors DESC`),
    one("SELECT COUNT(*) AS count FROM saved_prompts WHERE created_at >= datetime('now', '-30 days')"),
    one("SELECT COUNT(*) AS count FROM tool_usage WHERE created_at >= datetime('now', '-30 days')"),
    one("SELECT COUNT(*) AS count FROM user_profiles WHERE plan_type = 'pro'"),
    // Google sign-in stats come from users.last_login_at (already maintained by
    // the auth callback long before login_events existed) so they are correct
    // immediately, not only for logins recorded after this feature shipped.
    one(`SELECT COUNT(*) AS total,
           COUNT(CASE WHEN last_login_at >= datetime('now', 'start of day') THEN 1 END) AS today,
           COUNT(CASE WHEN last_login_at >= datetime('now', '-7 days') THEN 1 END) AS d7,
           COUNT(CASE WHEN last_login_at >= datetime('now', '-30 days') THEN 1 END) AS d30
         FROM users`),
    many(`SELECT name, email, created_at, last_login_at FROM users
          ORDER BY COALESCE(last_login_at, created_at) DESC LIMIT 25`),
    one(`SELECT COALESCE(AVG(CASE WHEN pageviews <= 1 THEN 100.0 ELSE 0 END), 0) AS rate
         FROM analytics_sessions WHERE started_at >= datetime('now', '-30 days')`),
    one(`SELECT COUNT(*) AS total, COUNT(CASE WHEN c > 1 THEN 1 END) AS returning FROM
           (SELECT visitor_id, COUNT(*) AS c FROM analytics_sessions
            WHERE started_at >= datetime('now', '-30 days') GROUP BY visitor_id)`),
    many(`SELECT strftime('%Y-%m-%dT%H', created_at) AS hour, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
          FROM page_views WHERE created_at >= datetime('now', '-24 hours') GROUP BY hour ORDER BY hour`),
    many(`SELECT date(created_at) AS day, COUNT(*) AS count FROM saved_prompts
          WHERE created_at >= datetime('now', '-30 days') GROUP BY day ORDER BY day`),
    many(`SELECT entry_path AS path, COUNT(*) AS sessions FROM analytics_sessions
          WHERE started_at >= datetime('now', '-30 days') AND entry_path IS NOT NULL
          GROUP BY entry_path ORDER BY sessions DESC LIMIT 10`),
  ]);

  return c.json({
    generated_at: new Date().toISOString(),
    active_now: activeNow?.count ?? 0,
    active_sessions: activeList,
    visitors: { today: visitors?.today ?? 0, d7: visitors?.d7 ?? 0, d30: visitors?.d30 ?? 0, total: visitors?.total ?? 0 },
    pageviews: { today: pageviews?.today ?? 0, d7: pageviews?.d7 ?? 0, d30: pageviews?.d30 ?? 0, total: pageviews?.total ?? 0 },
    sessions_30d: sessionStats?.sessions ?? 0,
    avg_session_seconds: Math.round(sessionStats?.avg_duration ?? 0),
    total_time_seconds_30d: Math.round(sessionStats?.total_duration ?? 0),
    avg_pages_per_session: Math.round((sessionStats?.avg_pageviews ?? 0) * 10) / 10,
    signups: { today: signups?.today ?? 0, d7: signups?.d7 ?? 0, d30: signups?.d30 ?? 0, total: signups?.total ?? 0 },
    logins: { today: logins?.today ?? 0, d7: logins?.d7 ?? 0, d30: logins?.d30 ?? 0, total: logins?.total ?? 0 },
    google_users: { today: googleUsers?.today ?? 0, d7: googleUsers?.d7 ?? 0, d30: googleUsers?.d30 ?? 0, total: googleUsers?.total ?? 0 },
    google_accounts: googleAccounts,
    bounce_rate_30d: Math.round(bounce?.rate ?? 0),
    returning_share_30d: visitorRepeat?.total ? Math.round(((visitorRepeat.returning ?? 0) * 100) / visitorRepeat.total) : 0,
    hourly_24h: hourly24h,
    prompts_daily: promptsDaily,
    entry_pages: entryPages,
    pro_users: proUsers?.count ?? 0,
    recent_logins: recentLogins,
    traffic_daily: trafficDaily,
    signups_daily: signupsDaily,
    logins_daily: loginsDaily,
    top_pages: topPages,
    blog_views: blogViews,
    referrers,
    countries,
    devices,
    interactions_30d: {
      prompts: prompts30d?.count ?? 0,
      tool_launches: toolLaunches30d?.count ?? 0,
      logins: logins?.d30 ?? 0,
    },
  });
});

export default router;
