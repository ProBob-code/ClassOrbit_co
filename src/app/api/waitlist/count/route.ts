import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

export async function GET() {
  const db = getDB();
  if (!db) return NextResponse.json({ count: 0 });

  const result = await db.prepare('SELECT COUNT(*) as count FROM waitlist').first<{ count: number }>();
  return NextResponse.json({ count: result?.count ?? 0 });
}
