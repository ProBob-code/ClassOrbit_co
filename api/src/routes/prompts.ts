import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB, nanoid } from '../lib/d1';
import { getSupabase } from '../lib/supabase';

const router = new Hono<AppEnv>();

router.get('/prompts', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const result = await db.prepare(
    'SELECT * FROM saved_prompts WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  const prompts = result.results.map((p: any) => ({
    ...p,
    tools: p.tools ? JSON.parse(p.tools) : [],
    is_favorite: p.is_favorite === 1,
  }));

  return c.json({ prompts });
});

router.post('/prompts', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { content_type, grade, subject, topic, tools = [], is_favorite = false, prompt_text } = await c.req.json();

  const id = nanoid();
  await db.prepare(
    'INSERT INTO saved_prompts (id, user_id, content_type, grade, subject, topic, tools, is_favorite, prompt_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user.id, content_type ?? null, grade ?? null, subject ?? null, topic ?? null, JSON.stringify(tools), is_favorite ? 1 : 0, prompt_text ?? null).run();

  return c.json({ id });
});

router.patch('/prompts/:id', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const { is_favorite } = await c.req.json();

  await db.prepare(
    'UPDATE saved_prompts SET is_favorite = ? WHERE id = ? AND user_id = ?'
  ).bind(is_favorite ? 1 : 0, id, user.id).run();

  return c.json({ ok: true });
});

router.delete('/prompts/:id', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  await db.prepare('DELETE FROM saved_prompts WHERE id = ? AND user_id = ?').bind(id, user.id).run();

  return c.json({ ok: true });
});

router.post('/share', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();

  const { tool_name, tool_url, prompt_text, topic, content_type, grade, subject } = await c.req.json();
  if (!prompt_text?.trim() || !tool_name?.trim()) {
    return c.json({ error: 'prompt_text and tool_name required' }, 400);
  }

  const id = nanoid();
  await db.prepare(
    'INSERT INTO prompt_shares (id, user_id, tool_name, tool_url, prompt_text, topic, content_type, grade, subject) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, user?.id ?? null, tool_name, tool_url ?? '', prompt_text, topic ?? null, content_type ?? null, grade ?? null, subject ?? null).run();

  return c.json({ id, url: `/p/${id}` });
});

router.get('/share', async (c) => {
  const db = getDB(c);

  const id = c.req.query('id');
  if (!id) return c.json({ error: 'id required' }, 400);

  const share = await db.prepare(
    'SELECT * FROM prompt_shares WHERE id = ?'
  ).bind(id).first();

  if (!share) return c.json({ error: 'Not found' }, 404);

  await db.prepare('UPDATE prompt_shares SET view_count = view_count + 1 WHERE id = ?').bind(id).run();

  return c.json(share);
});

export default router;
