-- ClassOrbit D1 Migration 003 — backfill user_profiles columns
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
