/**
 * Free-plan quota, shared by every route that reads or enforces it so the
 * number the builder warns on, the admin table shows, and /groq blocks at can
 * never drift apart.
 */
export const FREE_LIMIT = 25;

/** Prompts left this month, floored at 0 in case a quota is lowered later. */
export function promptsRemaining(used: number): number {
  return Math.max(FREE_LIMIT - used, 0);
}

/** The `month` key used by the prompt_usage table, e.g. '2026-08'. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
