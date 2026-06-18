import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB, nanoid } from '../lib/d1';
import { getSupabase } from '../lib/supabase';

const router = new Hono<AppEnv>();

router.get('/tools', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const result = await db.prepare(
    'SELECT * FROM custom_tools WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return c.json({ tools: result.results });
});

router.post('/tools', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { tool_name, tool_url, description, category = 'text', is_free = true } = await c.req.json();
  if (!tool_name?.trim() || !tool_url?.trim()) {
    return c.json({ error: 'tool_name and tool_url are required' }, 400);
  }

  const id = nanoid();
  await db.prepare(
    'INSERT INTO custom_tools (id, user_id, tool_name, tool_url, description, category, is_free) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user.id, tool_name.trim(), tool_url.trim(), description ?? null, category, is_free ? 1 : 0).run();

  return c.json({ id });
});

router.delete('/tools/:id', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await db.prepare('DELETE FROM custom_tools WHERE id = ? AND user_id = ?').bind(id, user.id).run();

  return c.json({ ok: true });
});

router.get('/tools/system', async (c) => {
  const db = getDB(c);

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

  return c.json({ tools }, 200, { 'Cache-Control': 'no-store, max-age=0' });
});

router.post('/tools/usage', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { tool_id, tool_name, is_custom = false, action_type } = await c.req.json();

  if (!tool_id || !tool_name || !action_type) {
    return c.json({ error: 'Missing required parameters' }, 400);
  }

  const id = nanoid();
  await db.prepare(`
    INSERT INTO tool_usage (id, user_id, tool_id, tool_name, is_custom, action_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    user.id,
    tool_id,
    tool_name.trim(),
    is_custom ? 1 : 0,
    action_type
  ).run();

  return c.json({ success: true });
});

export default router;
