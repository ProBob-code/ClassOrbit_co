-- Migration 009: register the answer_key content type on the text tools.
-- Run: wrangler d1 execute classorbit-db --file=supabase/migrations/009-answer-key-output.sql --remote
--
-- Migration 002 seeds system_tools with INSERT OR IGNORE, so re-running it will
-- not touch rows that already exist on a live database. This patches them in
-- place. Idempotent: the guard skips any row that already lists answer_key.

UPDATE system_tools
SET supported_outputs = json_insert(
      supported_outputs,
      '$[#]',
      'answer_key'
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE id IN ('chatgpt', 'claude')
  AND json_valid(supported_outputs)
  AND supported_outputs NOT LIKE '%"answer_key"%';
