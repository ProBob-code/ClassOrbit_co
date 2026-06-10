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

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const secret = getJwtSecret();
  if (!(await isAdminRequest(req, secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const body = await req.json();
  const is_blocked = body.is_blocked ? 1 : 0;

  try {
    await db.prepare(
      'UPDATE user_profiles SET is_blocked = ? WHERE user_id = ?'
    ).bind(is_blocked, params.id).run();

    return NextResponse.json({ success: true, is_blocked });
  } catch (error: any) {
    console.error('Failed to update block status:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
