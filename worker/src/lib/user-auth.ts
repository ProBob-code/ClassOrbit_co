import type { Context } from 'hono';
import type { AppEnv } from '../types';

// Session cookie name — the Next.js proxy.ts does a presence check on the same
// name for its login redirect, so keep the two in sync.
export const SESSION_COOKIE = 'co_session';
const SESSION_TTL_S = 30 * 24 * 60 * 60; // 30 days

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

interface SessionPayload {
  uid: string;
  email: string | null;
  name: string | null;
  pic: string | null;
  iat: number;
  exp: number;
}

export function b64urlEncode(data: Uint8Array | ArrayBuffer | string): string {
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : data;
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(secret: string, user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    uid: user.id,
    email: user.email,
    name: user.name,
    pic: user.picture,
    iat: now,
    exp: now + SESSION_TTL_S,
  };
  const data = b64urlEncode(JSON.stringify(payload));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64urlEncode(sig)}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionUser | null> {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(data)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data))) as SessionPayload;
    if (!payload.uid || Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return { id: payload.uid, email: payload.email ?? null, name: payload.name ?? null, picture: payload.pic ?? null };
  } catch {
    return null;
  }
}

export function getCookie(c: Context<AppEnv>, name: string): string | null {
  const header = c.req.header('cookie') ?? '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}

/**
 * The authenticated user for this request, verified locally against the session
 * cookie's HMAC — no network call. Returns null when signed out/expired.
 */
export async function getSessionUser(c: Context<AppEnv>): Promise<SessionUser | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  return verifySession(token, c.env.AUTH_JWT_SECRET);
}

function cookieScope(appUrl: string): string {
  let scope = '';
  try {
    const { protocol, hostname } = new URL(appUrl);
    // Host-only + non-Secure for localhost dev; in production scope to the apex
    // domain so the cookie is shared across www/apex/api hosts.
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      scope += `; Domain=${hostname.replace(/^www\./, '')}`;
    }
    if (protocol === 'https:') scope += '; Secure';
  } catch {
    scope = '; Secure';
  }
  return scope;
}

export function sessionCookie(token: string, appUrl: string, clear = false): string {
  const maxAge = clear ? 0 : SESSION_TTL_S;
  return `${SESSION_COOKIE}=${clear ? '' : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${cookieScope(appUrl)}`;
}

/** Short-lived cookie holding the OAuth CSRF nonce + PKCE verifier mid-flow. */
export function oauthStateCookie(name: string, value: string, appUrl: string, clear = false): string {
  const maxAge = clear ? 0 : 600;
  return `${name}=${clear ? '' : value}; Path=/api/auth; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${cookieScope(appUrl)}`;
}
