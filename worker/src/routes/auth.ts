import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/d1';
import {
  b64urlEncode,
  b64urlDecode,
  getCookie,
  oauthStateCookie,
  sessionCookie,
  signSession,
  getSessionUser,
  type SessionUser,
} from '../lib/user-auth';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const STATE_COOKIE = 'co_oauth_state';

const router = new Hono<AppEnv>();

function appUrl(env: { APP_URL?: string }): string {
  return (env.APP_URL || 'https://classorbit.co').replace(/\/$/, '');
}

/** Only allow same-site relative paths as post-login destinations. */
function safeNext(next: string | null | undefined): string {
  return next && /^\/(?!\/)/.test(next) ? next : '/builder';
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return b64urlEncode(bytes);
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
}

// Step 1: send the browser to Google's consent screen.
router.get('/auth/google', async (c) => {
  const origin = appUrl(c.env);
  const nonce = randomToken();
  const verifier = randomToken(); // PKCE
  const challenge = b64urlEncode(await sha256(verifier));
  const state = b64urlEncode(JSON.stringify({ n: nonce, next: safeNext(c.req.query('next')) }));

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  c.header('Set-Cookie', oauthStateCookie(STATE_COOKIE, `${nonce}.${verifier}`, origin));
  return c.redirect(`${GOOGLE_AUTH_URL}?${params}`);
});

// Step 2: Google redirects back here; exchange the code, upsert the user, set our session.
router.get('/auth/callback', async (c) => {
  const origin = appUrl(c.env);
  const fail = (reason: string) => {
    console.error('[auth/callback]', reason);
    c.header('Set-Cookie', oauthStateCookie(STATE_COOKIE, '', origin, true), { append: true });
    return c.redirect(`${origin}/login?error=auth`);
  };

  const code = c.req.query('code');
  const stateParam = c.req.query('state');
  if (c.req.query('error') || !code || !stateParam) return fail(`missing code/state: ${c.req.query('error') ?? ''}`);

  // CSRF check: the state nonce must match the one we set as a cookie in step 1.
  let state: { n?: string; next?: string };
  try {
    state = JSON.parse(new TextDecoder().decode(b64urlDecode(stateParam)));
  } catch {
    return fail('unparseable state');
  }
  const stateCookie = getCookie(c, STATE_COOKIE);
  const [nonce, verifier] = stateCookie?.split('.') ?? [];
  if (!nonce || !verifier || state.n !== nonce) return fail('state/nonce mismatch');

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${origin}/api/auth/callback`,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) return fail(`token exchange failed: ${await tokenRes.text()}`);
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  if (!id_token) return fail('no id_token in token response');

  // The ID token came straight from Google's token endpoint over TLS, so per
  // OIDC we can skip JWKS signature verification — but iss/aud/exp must hold.
  let claims: {
    iss?: string;
    aud?: string;
    exp?: number;
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  try {
    claims = JSON.parse(new TextDecoder().decode(b64urlDecode(id_token.split('.')[1])));
  } catch {
    return fail('unparseable id_token');
  }
  if (
    (claims.iss !== 'https://accounts.google.com' && claims.iss !== 'accounts.google.com') ||
    claims.aud !== c.env.GOOGLE_CLIENT_ID ||
    !claims.exp || claims.exp <= Math.floor(Date.now() / 1000) ||
    !claims.sub
  ) {
    return fail('id_token claims rejected');
  }

  const email = claims.email_verified && claims.email ? claims.email : null;
  const name = claims.name ?? null;
  const picture = claims.picture ?? null;

  const db = getDB(c);
  let row = await db.prepare('SELECT id FROM users WHERE google_sub = ?').bind(claims.sub).first<{ id: string }>();

  if (!row && email) {
    // Legacy users migrated from Supabase were seeded without a google_sub when
    // the export lacked one; claim the row by verified email on first login.
    row = await db
      .prepare('SELECT id FROM users WHERE google_sub IS NULL AND email = ? COLLATE NOCASE')
      .bind(email)
      .first<{ id: string }>();
    if (row) {
      await db.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(claims.sub, row.id).run();
    }
  }

  if (!row) {
    row = { id: crypto.randomUUID() };
    await db
      .prepare('INSERT INTO users (id, google_sub, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)')
      .bind(row.id, claims.sub, email, name, picture)
      .run();
  }

  await db
    .prepare(
      "UPDATE users SET email = COALESCE(?, email), name = COALESCE(?, name), avatar_url = COALESCE(?, avatar_url), last_login_at = datetime('now') WHERE id = ?"
    )
    .bind(email, name, picture, row.id)
    .run();

  const user: SessionUser = { id: row.id, email, name, picture };
  c.header('Set-Cookie', sessionCookie(await signSession(c.env.AUTH_JWT_SECRET, user), origin), { append: true });
  c.header('Set-Cookie', oauthStateCookie(STATE_COOKIE, '', origin, true), { append: true });
  return c.redirect(`${origin}${safeNext(state.next)}`);
});

router.get('/auth/me', async (c) => {
  const user = await getSessionUser(c);
  return c.json({
    user: user ? { id: user.id, email: user.email, name: user.name, avatar_url: user.picture } : null,
  });
});

router.post('/auth/signout', async (c) => {
  c.header('Set-Cookie', sessionCookie('', appUrl(c.env), true));
  return c.json({ ok: true });
});

export default router;
