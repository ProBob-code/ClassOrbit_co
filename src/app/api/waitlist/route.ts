import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

export async function POST(req: Request) {
  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const { email, name } = await req.json();
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  try {
    await db.prepare(
      'INSERT INTO waitlist (email, name) VALUES (?, ?)'
    ).bind(email.trim().toLowerCase(), name?.trim() ?? null).run();
    return NextResponse.json({ ok: true });
  } catch {
    // UNIQUE constraint — already on waitlist
    return NextResponse.json({ ok: true, already: true });
  }
}
