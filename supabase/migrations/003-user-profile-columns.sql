-- ClassOrbit D1 Migration 003 — backfill user_profiles columns
-- ONE-SHOT: not idempotent. Re-running fails with "duplicate column name"
-- (D1/SQLite has no ADD COLUMN IF NOT EXISTS). Fresh DBs get these columns from
-- d1-schema.sql and must NOT run this file. See supabase/MIGRATIONS.md.
-- The deployed user_profiles table was created by 002-payments.sql, which is
-- missing columns the app reads (email, name, is_blocked, has_seeded_workspace).
-- Without them, /me/plan and /admin/users error out -> profile shows FREE and
-- the admin Users list is blank even though the row exists and is 'pro'.
--
-- Run: wrangler d1 execute classorbit-db --file=supabase/migrations/003-user-profile-columns.sql --remote

ALTER TABLE user_profiles ADD COLUMN email TEXT;
ALTER TABLE user_profiles ADD COLUMN name TEXT;
ALTER TABLE user_profiles ADD COLUMN is_blocked INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN has_seeded_workspace INTEGER DEFAULT 0;
