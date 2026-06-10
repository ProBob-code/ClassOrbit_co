import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDB } from '@/lib/d1';
import { isAdminRequest } from '@/lib/admin-auth';

export const runtime = 'edge';

function getJwtSecret(): string {
  try {
    const { env } = getRequestContext();
    return ((env as Record<string, string>).ADMIN_JWT_SECRET) || process.env.ADMIN_JWT_SECRET || 'dev_secret';
  } catch {
    return process.env.ADMIN_JWT_SECRET || 'dev_secret';
  }
}

export async function GET(req: Request) {
  const secret = getJwtSecret();
  if (!(await isAdminRequest(req, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  try {
    const users = await db.prepare(
      'SELECT user_id, plan_type, subscription_status, plan_expires_at, is_blocked, created_at FROM user_profiles ORDER BY created_at DESC'
    ).all();

    return NextResponse.json({ users: users.results || [] });
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
