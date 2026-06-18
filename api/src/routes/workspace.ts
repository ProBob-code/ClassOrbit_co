import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB, nanoid } from '../lib/d1';
import { getSupabase } from '../lib/supabase';

const router = new Hono<AppEnv>();

router.get('/workspace', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  // Ensure tables exist (handles fresh/local D1 databases)
  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
          sticker TEXT NOT NULL DEFAULT '📚', color TEXT NOT NULL DEFAULT 'bg-primary',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL, folder_id TEXT NOT NULL,
          name TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'prompt',
          content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id TEXT PRIMARY KEY, plan_type TEXT DEFAULT 'free',
          subscription_status TEXT DEFAULT 'active', plan_expires_at DATETIME,
          razorpay_order_id TEXT, razorpay_payment_id TEXT,
          has_seeded_workspace INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_blocked INTEGER DEFAULT 0
        )
      `)
    ]);

    const profile = await db.prepare('SELECT has_seeded_workspace FROM user_profiles WHERE user_id = ?').bind(user.id).first<{ has_seeded_workspace: number }>();

    if (!profile || profile.has_seeded_workspace === 0) {
      const folder1Id = nanoid();
      const folder2Id = nanoid();

      await db.prepare('INSERT INTO folders (id, user_id, name, sticker, color) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)')
        .bind(
          folder1Id, user.id, 'Lesson Plans', '📚', 'bg-blue-500',
          folder2Id, user.id, 'Quizzes & Assessments', '📝', 'bg-emerald-500'
        ).run();

      const prompt1Id = nanoid();
      const prompt2Id = nanoid();

      const p1Text = 'Act as an expert math teacher. Create a comprehensive lesson plan on introducing fractions to 4th graders. Include visual analogies (like pizza), hands-on activities, and a 5-minute wrap-up assessment.';
      const p2Text = 'Create a 10-question multiple-choice quiz about the Solar System for 6th-grade students. Include an answer key and brief explanations for why each correct answer is right.';

      await db.prepare('INSERT INTO files (id, user_id, folder_id, name, type, content) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)')
        .bind(
          prompt1Id, user.id, folder1Id, 'Intro to Fractions', 'prompt', p1Text,
          prompt2Id, user.id, folder2Id, 'Solar System Quiz', 'prompt', p2Text
        ).run();

      await db.prepare('INSERT INTO saved_prompts (id, user_id, content_type, grade, subject, topic, tools, is_favorite, prompt_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
          nanoid(), user.id, 'Lesson Plan', '4th Grade', 'Math', 'Fractions', '[]', 1, p1Text,
          nanoid(), user.id, 'Quiz', '6th Grade', 'Science', 'Solar System', '[]', 1, p2Text
        ).run();

      await db.prepare('INSERT INTO user_profiles (user_id, has_seeded_workspace) VALUES (?, 1) ON CONFLICT(user_id) DO UPDATE SET has_seeded_workspace = 1')
        .bind(user.id).run();
    }
  } catch (e) {
    // If table doesn't exist yet, silently fallback to returning what we have
    console.error('Seeding error:', e);
  }

  try {
    const [foldersResult, filesResult] = await Promise.all([
      db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY created_at ASC').bind(user.id).all(),
      db.prepare('SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC').bind(user.id).all(),
    ]);

    return c.json({
      folders: foldersResult.results,
      files: filesResult.results,
    });
  } catch (e) {
    console.error('Fetch error:', e);
    return c.json({ folders: [], files: [] });
  }
});

router.post('/workspace', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json();

  if (body.kind === 'folder') {
    const { name, sticker = '📚', color = 'bg-primary' } = body;
    if (!name?.trim()) return c.json({ error: 'Name required' }, 400);

    const id = nanoid();
    await db.prepare(
      'INSERT INTO folders (id, user_id, name, sticker, color) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, user.id, name.trim(), sticker, color).run();

    return c.json({ id, name: name.trim(), sticker, color, user_id: user.id });
  }

  if (body.kind === 'file') {
    const { folder_id, name, type = 'prompt', content = '' } = body;
    if (!name?.trim()) return c.json({ error: 'Name required' }, 400);
    if (!folder_id) return c.json({ error: 'folder_id required' }, 400);

    const id = nanoid();
    await db.prepare(
      'INSERT INTO files (id, user_id, folder_id, name, type, content) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, user.id, folder_id, name.trim(), type, content).run();

    return c.json({ id, name: name.trim(), type, content, folder_id, user_id: user.id });
  }

  return c.json({ error: 'Invalid kind' }, 400);
});

router.patch('/workspace/:id', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const body = await c.req.json();

  if (body.kind === 'folder') {
    const { name, sticker, color } = body;
    await db.prepare(
      'UPDATE folders SET name = COALESCE(?, name), sticker = COALESCE(?, sticker), color = COALESCE(?, color) WHERE id = ? AND user_id = ?'
    ).bind(name ?? null, sticker ?? null, color ?? null, id, user.id).run();
    return c.json({ ok: true });
  }

  if (body.kind === 'file') {
    const { content, name } = body;
    await db.prepare(
      'UPDATE files SET content = COALESCE(?, content), name = COALESCE(?, name) WHERE id = ? AND user_id = ?'
    ).bind(content ?? null, name ?? null, id, user.id).run();
    return c.json({ ok: true });
  }

  return c.json({ error: 'Invalid kind' }, 400);
});

router.delete('/workspace/:id', async (c) => {
  const db = getDB(c);
  const supabase = getSupabase(c);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const id = c.req.param('id');
  const { kind } = await c.req.json();

  if (kind === 'folder') {
    await db.prepare('DELETE FROM files WHERE folder_id = ? AND user_id = ?').bind(id, user.id).run();
    await db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return c.json({ ok: true });
  }

  if (kind === 'file') {
    await db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?').bind(id, user.id).run();
    return c.json({ ok: true });
  }

  return c.json({ error: 'Invalid kind' }, 400);
});

export default router;
