// Initialize (or top up) the LOCAL D1 database used by `wrangler dev`.
//
// Applies the canonical migration order from supabase/MIGRATIONS.md against the
// same on-disk state the `dev` script uses (`--persist-to=../.wrangler/state`,
// resolved from this worker/ directory). Every migration is idempotent
// (CREATE TABLE IF NOT EXISTS / INSERT OR IGNORE), so re-running is safe and only
// fills in whatever the local DB is missing.
//
// Usage:  pnpm db:init:local        (from worker/, or via the repo-root alias)

import { spawnSync } from 'node:child_process';

const DB = 'classorbit-db';
const PERSIST = '../.wrangler/state'; // must match the `dev` script's --persist-to

// Order matters — see supabase/MIGRATIONS.md ("Fresh database — apply in this
// exact order"). migrations/003-user-profile-columns.sql is intentionally
// omitted: d1-schema.sql already ships the full user_profiles shape, so running
// it would fail with "duplicate column name".
const FILES = [
  '../supabase/d1-schema.sql',
  '../supabase/d1-migration-002-tools.sql',
  '../supabase/d1-migration-003-feedback-usage.sql',
  '../supabase/d1-migration-004-support-tickets.sql',
  '../supabase/d1-migration-005-ticket-chat.sql',
  '../supabase/d1-migration-006-blogs.sql',
  '../supabase/d1-migration-007-blog-images.sql',
  '../supabase/migrations/002-payments.sql',
  '../supabase/migrations/004-payment-orders-and-alerts.sql',
  '../supabase/migrations/005-blog-body-images.sql',
  '../supabase/migrations/006-platform-settings.sql',
];

// On an already-populated DB some ADD COLUMN statements ("duplicate column
// name") are expected and harmless — they mean the column is already present.
const HARMLESS = /duplicate column name/i;

let hadRealError = false;

for (const file of FILES) {
  process.stdout.write(`\n▶ ${file}\n`);
  const res = spawnSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB, '--local', `--persist-to=${PERSIST}`, `--file=${file}`],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  );
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  if (res.status === 0) {
    const ok = out.match(/\d+ commands? executed successfully/);
    console.log(`  ✓ ${ok ? ok[0] : 'applied'}`);
  } else if (HARMLESS.test(out)) {
    console.log('  ✓ already up to date (column exists)');
  } else {
    hadRealError = true;
    console.error(`  ✗ FAILED\n${out.trim()}`);
  }
}

console.log(
  hadRealError
    ? '\n✗ Finished with errors — check output above.'
    : '\n✓ Local D1 is up to date. Reload the app (no worker restart needed).',
);
process.exit(hadRealError ? 1 : 0);
