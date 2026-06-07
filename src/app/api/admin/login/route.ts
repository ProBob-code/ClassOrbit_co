import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { signAdminToken, makeCookie } from '@/lib/admin-auth';

export const runtime = 'edge';

function getAdminEnv() {
  try {
    const { env } = getRequestContext();
    const e = env as Record<string, string>;
    return {
      username: e.ADMIN_USERNAME || process.env.ADMIN_USERNAME || 'admin',
      password: e.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '',
      jwtSecret: e.ADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'dev_secret',
    };
  } catch {
    return {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || '',
      jwtSecret: process.env.ADMIN_JWT_SECRET || 'dev_secret',
    };
  }
}

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!username?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
  }

  const env = getAdminEnv();

  if (username.trim() !== env.username || password.trim() !== env.password) {
    // Artificial delay to slow brute-force
    await new Promise(r => setTimeout(r, 500));
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signAdminToken(env.jwtSecret);
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', makeCookie(token));
  return res;
}
