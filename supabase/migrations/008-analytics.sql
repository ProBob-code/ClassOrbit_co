-- Site analytics for the admin Monitoring tab (investor stats).
-- Populated by POST /api/track (see worker/src/routes/analytics.ts):
-- every page load inserts a page_views row and starts/extends a session;
-- a 60s heartbeat keeps the session's last_seen fresh, which is what
-- "active now" and time-spent numbers are derived from.

-- One row per page load. Blog views are rows whose path is '/blog/<slug>'.
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,          -- anonymous id from localStorage (co_vid)
  user_id TEXT,                      -- users.id when the visitor is signed in
  path TEXT NOT NULL,
  referrer TEXT,                     -- external referrer hostname only
  country TEXT,                      -- from Cloudflare's request.cf
  device TEXT,                       -- mobile | tablet | desktop
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);

-- One row per visit session (ends after 30 min of inactivity).
-- duration_seconds = last_seen - started_at, maintained by /api/track.
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  user_id TEXT,
  entry_path TEXT,
  current_path TEXT,
  country TEXT,
  device TEXT,
  pageviews INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON analytics_sessions(visitor_id, last_seen);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON analytics_sessions(last_seen);

-- One row per completed Google sign-in (routes/auth.ts callback).
CREATE TABLE IF NOT EXISTS login_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  method TEXT NOT NULL DEFAULT 'google',
  is_new_user INTEGER NOT NULL DEFAULT 0, -- 1 = account created on this login
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_events_created ON login_events(created_at);
