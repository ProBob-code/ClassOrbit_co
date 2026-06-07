import { NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDB, nanoid } from '@/lib/d1';
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

async function requireAdmin(req: Request): Promise<Response | null> {
  const valid = await isAdminRequest(req, getJwtSecret());
  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const result = await db.prepare(
    'SELECT * FROM system_tools ORDER BY sort_order ASC, created_at ASC'
  ).all();

  const tools = (result.results as any[]).map(t => ({
    ...t,
    supported_outputs: (() => { try { return JSON.parse(t.supported_outputs); } catch { return []; } })(),
    walkthrough_steps: (() => { try { return t.walkthrough_steps ? JSON.parse(t.walkthrough_steps) : null; } catch { return null; } })(),
    is_free: t.is_free === 1,
    active: t.active === 1,
    is_new: t.is_new === 1,
  }));

  return NextResponse.json({ tools });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = getDB();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

  const {
    tool_name, tool_url, tool_logo, category = 'text',
    supported_outputs = [], description, is_free = false,
    pricing_info, active = true, sort_order = 0,
    is_new = false, new_until, walkthrough_steps,
  } = await req.json();

  if (!tool_name?.trim() || !tool_url?.trim()) {
    return NextResponse.json({ error: 'tool_name and tool_url required' }, { status: 400 });
  }

  const id = nanoid();

  let computedNewUntil = new_until ?? null;
  if (is_new && !new_until) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    computedNewUntil = d.toISOString();
  }

  const defaultSteps = is_new ? JSON.stringify([
    { title: `🎉 New: ${tool_name}!`, body: description || `${tool_name} is now available on ClassOrbit.` },
    { title: 'Use it in the Builder', body: `Select ${tool_name} from the AI platforms list when building your prompt. Your prompt will be optimized specifically for ${tool_name}.` },
    { title: 'Launch from Launchpad', body: `Find ${tool_name} in your Launchpad. Click "Launch Integration" to open it directly.` },
  ]) : null;

  await db.prepare(`
    INSERT INTO system_tools
      (id, tool_name, tool_url, tool_logo, category, supported_outputs, description, is_free, pricing_info, active, sort_order, is_new, new_until, walkthrough_steps)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, tool_name.trim(), tool_url.trim(), tool_logo ?? null,
    category, JSON.stringify(supported_outputs), description ?? null,
    is_free ? 1 : 0, pricing_info ?? null, active ? 1 : 0, sort_order,
    is_new ? 1 : 0, computedNewUntil, walkthrough_steps ? JSON.stringify(walkthrough_steps) : defaultSteps
  ).run();

  return NextResponse.json({ id });
}
