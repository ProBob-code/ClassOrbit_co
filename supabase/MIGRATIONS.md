# Database (Cloudflare D1) — schema & migration order

**Source of truth:** [`d1-schema.sql`](./d1-schema.sql) defines the canonical
shape of every base table (it has been reconciled to include all columns the
worker reads — e.g. `user_profiles.email/name/is_blocked/has_seeded_workspace`).
When a table definition here disagrees with an older migration file, **this file
wins**.

> History note: there are two legacy migration tracks with colliding numbers —
> `d1-migration-00X-*.sql` and `migrations/00X-*.sql`. They are kept for the record.
> Going forward, add new migrations only under [`migrations/`](./migrations/) with
> the next free number, and update this list.

## Fresh database — apply in this exact order

```bash
DB=classorbit-db
wrangler d1 execute $DB --remote --file=supabase/d1-schema.sql
wrangler d1 execute $DB --remote --file=supabase/d1-migration-002-tools.sql
wrangler d1 execute $DB --remote --file=supabase/d1-migration-003-feedback-usage.sql
wrangler d1 execute $DB --remote --file=supabase/d1-migration-004-support-tickets.sql
wrangler d1 execute $DB --remote --file=supabase/d1-migration-005-ticket-chat.sql
wrangler d1 execute $DB --remote --file=supabase/d1-migration-006-blogs.sql
wrangler d1 execute $DB --remote --file=supabase/d1-migration-007-blog-images.sql
wrangler d1 execute $DB --remote --file=supabase/migrations/002-payments.sql
# Optional seed/content:
# wrangler d1 execute $DB --remote --file=supabase/d1-seed-blogs.sql
# wrangler d1 execute $DB --remote --file=supabase/d1-seed-images.sql
```

Because `d1-schema.sql` already contains the complete `user_profiles`, a fresh
DB does **not** need `migrations/003-user-profile-columns.sql` (running it would
fail with `duplicate column name`).

## One-time patches already applied to the live DB

| File | Purpose | When to run |
| --- | --- | --- |
| [`migrations/003-user-profile-columns.sql`](./migrations/003-user-profile-columns.sql) | Adds `email`, `name`, `is_blocked`, `has_seeded_workspace` to the **existing** prod `user_profiles` (which was created from the partial `002-payments.sql`). | Only on a DB that predates the reconciled `d1-schema.sql`. Not re-runnable (no `ADD COLUMN IF NOT EXISTS`). |

## Adding a new migration

1. Create `migrations/00N-short-name.sql` (next number after 003).
2. Make it forward-only and, where practical, idempotent.
3. Run it with `wrangler d1 execute classorbit-db --remote --file=...`.
4. If it changes a base table, also update `d1-schema.sql` so fresh DBs match.
5. Add it to the list above.
