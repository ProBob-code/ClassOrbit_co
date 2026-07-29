-- Own auth: users table replaces Supabase auth as the identity store.
-- `id` is the stable app-wide user id every other table's user_id points to:
-- migrated users keep their old Supabase UUID (seeded by
-- worker/scripts/export-supabase-users.mjs), new users get a random UUID.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,          -- Google account id (ID token `sub` claim)
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
