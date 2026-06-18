export const ADMIN_COOKIE = 'co_admin_token';
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signAdminToken(secret: string): Promise<string> {
  const payload = { exp: Date.now() + EXPIRY_MS };
  const data = btoa(JSON.stringify(payload));
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

export async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return false;
    const key = await getKey(secret);
    const sigBytes = Uint8Array.from(atob(sig), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return false;
    const payload = JSON.parse(atob(data));
    return Date.now() < payload.exp;
  } catch {
    return false;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

/** Verify admin token from request using the provided secret. */
export async function isAdminRequest(req: Request, secret: string): Promise<boolean> {
  const token = getTokenFromRequest(req);
  if (!token) return false;
  return verifyAdminToken(token, secret);
}

export function makeCookie(token: string, clear = false): string {
  if (clear) return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(EXPIRY_MS / 1000)}`;
}
