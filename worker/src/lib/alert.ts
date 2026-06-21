import type { Env } from '../types';

// Sends an admin alert email via Resend. No-ops gracefully (just logs) when email
// isn't configured, so the worker never breaks because alerting is unset.
// A D1-backed throttle caps each alert key to one email per window to avoid floods.

const THROTTLE_MINUTES = 15;

export async function alertAdmin(env: Env, key: string, subject: string, message: string): Promise<void> {
  // Always log — visible in `wrangler tail` / Workers Logs even with no email set.
  console.error(`[alert:${key}] ${subject} — ${message}`);

  const apiKey = env.ALERTS_RESEND_API_KEY;
  const to = env.ALERT_EMAIL;
  if (!apiKey || !to) return;

  try {
    if (!(await withinThrottle(env, key))) return;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.ALERT_FROM || 'ClassOrbit Alerts <onboarding@resend.dev>',
        to: [to],
        subject: `[ClassOrbit] ${subject}`,
        text: message,
      }),
    });
    if (!res.ok) {
      console.error('[alert] Resend send failed', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[alert] Unexpected error while sending alert', err);
  }
}

/** Returns true if an email for `key` should be sent now (and records the send). */
async function withinThrottle(env: Env, key: string): Promise<boolean> {
  try {
    const row = await env.DB
      .prepare('SELECT last_sent_at FROM alert_log WHERE alert_key = ?')
      .bind(key)
      .first<{ last_sent_at: string }>();

    if (row?.last_sent_at) {
      const elapsed = Date.now() - new Date(row.last_sent_at).getTime();
      if (elapsed < THROTTLE_MINUTES * 60 * 1000) return false;
    }

    await env.DB
      .prepare(
        `INSERT INTO alert_log (alert_key, last_sent_at) VALUES (?, CURRENT_TIMESTAMP)
         ON CONFLICT(alert_key) DO UPDATE SET last_sent_at = CURRENT_TIMESTAMP`,
      )
      .bind(key)
      .run();
    return true;
  } catch (err) {
    // If the throttle table is unavailable, fail open (still alert) but record why.
    console.error('[alert] throttle check failed; sending anyway', err);
    return true;
  }
}
