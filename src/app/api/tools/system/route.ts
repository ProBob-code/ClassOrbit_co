import { NextResponse } from 'next/server';
import { getDB } from '@/lib/d1';

export const runtime = 'edge';

export async function GET() {
  const db = getDB();
  if (!db) return NextResponse.json({ tools: [] }, { status: 200 });

  const result = await db.prepare(
    'SELECT * FROM system_tools WHERE active = 1 ORDER BY sort_order ASC, created_at ASC'
  ).all();

  const tools = (result.results as any[]).map(t => ({
    ...t,
    supported_outputs: (() => { try { return JSON.parse(t.supported_outputs); } catch { return []; } })(),
    walkthrough_steps: (() => { try { return t.walkthrough_steps ? JSON.parse(t.walkthrough_steps) : null; } catch { return null; } })(),
    is_free: t.is_free === 1,
    active: t.active === 1,
    is_new: t.is_new === 1 && (!t.new_until || new Date(t.new_until) > new Date()),
  }));

  return NextResponse.json({ tools }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
