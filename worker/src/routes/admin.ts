import { Hono, type Context } from 'hono';
import type { AppEnv } from '../types';
import { getDB, nanoid } from '../lib/d1';
import { isAdminRequest, signAdminToken, makeCookie } from '../lib/admin-auth';

const router = new Hono<AppEnv>();

async function requireAdmin(c: Context<AppEnv>): Promise<Response | null> {
  const valid = await isAdminRequest(c.req.raw, c.env.ADMIN_JWT_SECRET);
  if (!valid) return c.json({ error: 'Unauthorized' }, 401);
  return null;
}

router.get('/admin/:action{.+}', async (c) => {
  const path = c.req.param('action');
  const segments = path.split('/');

  if (path === 'verify') {
    const valid = await isAdminRequest(c.req.raw, c.env.ADMIN_JWT_SECRET);
    return c.json({ valid });
  }

  const denied = await requireAdmin(c);
  if (denied) return denied;
  const db = getDB(c);

  if (path === 'stats') {
    const [
      totalPrompts,
      uniqueUsers,
      proUsers,
      waitlistCount,
      activeTools,
      totalTools,
      recentPrompts,
      recentWaitlist,
      toolUsageSummary,
      customToolsList,
      feedbackStats,
      feedbackList,
      openTickets,
    ] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM saved_prompts').first<{ count: number }>().catch(() => ({ count: 0 })),
      db.prepare('SELECT COUNT(*) as count FROM user_profiles').first<{ count: number }>().catch(() => ({ count: 0 })),
      db.prepare("SELECT COUNT(*) as count FROM user_profiles WHERE plan_type = 'pro'").first<{ count: number }>().catch(() => ({ count: 0 })),
      db.prepare('SELECT COUNT(*) as count FROM waitlist').first<{ count: number }>().catch(() => ({ count: 0 })),
      db.prepare('SELECT COUNT(*) as count FROM system_tools WHERE active = 1').first<{ count: number }>().catch(() => ({ count: 0 })),
      db.prepare('SELECT COUNT(*) as count FROM system_tools').first<{ count: number }>().catch(() => ({ count: 0 })),
      db.prepare('SELECT user_id, topic, content_type, created_at FROM saved_prompts ORDER BY created_at DESC LIMIT 10').all().catch(() => ({ results: [] })),
      db.prepare('SELECT email, name, created_at FROM waitlist ORDER BY created_at DESC LIMIT 10').all().catch(() => ({ results: [] })),
      db.prepare('SELECT tool_id, tool_name, is_custom, COUNT(*) as count, MAX(created_at) as last_used FROM tool_usage GROUP BY tool_id, tool_name, is_custom ORDER BY count DESC LIMIT 20').all().catch(() => ({ results: [] })),
      db.prepare('SELECT c.id, c.user_id, c.tool_name, c.tool_url, c.description, c.category, c.is_free, c.created_at, p.email as user_email FROM custom_tools c LEFT JOIN user_profiles p ON c.user_id = p.user_id ORDER BY c.created_at DESC LIMIT 50').all().catch(() => ({ results: [] })),
      db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM platform_feedback').first<{ avg: number; count: number }>().catch(() => ({ avg: 0, count: 0 })),
      db.prepare('SELECT user_email, rating, feedback, created_at FROM platform_feedback ORDER BY created_at DESC LIMIT 50').all().catch(() => ({ results: [] })),
      db.prepare("SELECT COUNT(*) as count FROM support_tickets WHERE status = 'open'").first<{ count: number }>().catch(() => ({ count: 0 })),
    ]);

    return c.json({
      total_prompts: totalPrompts?.count ?? 0,
      unique_users: uniqueUsers?.count ?? 0,
      pro_users: (proUsers as any)?.count ?? 0,
      waitlist_count: waitlistCount?.count ?? 0,
      active_tools: activeTools?.count ?? 0,
      total_tools: totalTools?.count ?? 0,
      recent_prompts: recentPrompts.results ?? [],
      recent_waitlist: recentWaitlist.results ?? [],
      tool_usage: toolUsageSummary?.results ?? [],
      custom_tools: customToolsList?.results ?? [],
      feedback_avg: feedbackStats?.avg ?? 0,
      feedback_count: feedbackStats?.count ?? 0,
      feedback_list: feedbackList?.results ?? [],
      open_tickets_count: openTickets?.count ?? 0,
    });
  }

  if (path === 'tools') {
    const result = await db.prepare('SELECT * FROM system_tools ORDER BY sort_order ASC, created_at ASC').all();
    const tools = (result.results as any[]).map(t => ({
      ...t,
      supported_outputs: (() => { try { return JSON.parse(t.supported_outputs); } catch { return []; } })(),
      walkthrough_steps: (() => { try { return t.walkthrough_steps ? JSON.parse(t.walkthrough_steps) : null; } catch { return null; } })(),
      is_free: t.is_free === 1,
      active: t.active === 1,
      is_new: t.is_new === 1,
    }));
    return c.json({ tools });
  }

  if (path === 'users') {
    try {
      const users = await db.prepare(
        'SELECT user_id, plan_type, subscription_status, plan_expires_at, is_blocked, email, name, created_at FROM user_profiles ORDER BY created_at DESC'
      ).all();
      return c.json({ users: users.results || [] });
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      return c.json({ error: 'Failed to fetch users' }, 500);
    }
  }

  if (path === 'blogs') {
    try {
      const blogs = await db.prepare('SELECT * FROM blogs ORDER BY created_at DESC').all();
      return c.json({ blogs: blogs.results || [] });
    } catch (error: any) {
      console.error('Failed to fetch blogs:', error);
      return c.json({ error: 'Failed to fetch blogs' }, 500);
    }
  }

  return c.json({ error: 'Not Found' }, 404);
});

router.post('/admin/:action{.+}', async (c) => {
  const path = c.req.param('action');
  const segments = path.split('/');

  if (path === 'login') {
    const { username, password } = await c.req.json();
    if (!username?.trim() || !password?.trim()) {
      return c.json({ error: 'Credentials required' }, 400);
    }
    const env = {
      username: c.env.ADMIN_USERNAME || 'admin',
      password: c.env.ADMIN_PASSWORD || '',
      jwtSecret: c.env.ADMIN_JWT_SECRET || 'dev_secret',
    };
    if (username.trim() !== env.username || password.trim() !== env.password) {
      await new Promise(r => setTimeout(r, 500));
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    const token = await signAdminToken(env.jwtSecret);
    c.header('Set-Cookie', makeCookie(token));
    return c.json({ ok: true });
  }

  const denied = await requireAdmin(c);
  if (denied) return denied;
  const db = getDB(c);

  if (path === 'tools') {
    const {
      tool_name, tool_url, tool_logo, category = 'text',
      supported_outputs = [], description, is_free = false,
      pricing_info, active = true, sort_order = 0,
      is_new = false, new_until, walkthrough_steps,
    } = await c.req.json();

    if (!tool_name?.trim() || !tool_url?.trim()) {
      return c.json({ error: 'tool_name and tool_url required' }, 400);
    }

    const id = nanoid();
    let computedNewUntil = new_until ?? null;
    if (is_new && !new_until) {
      const d = new Date(); d.setDate(d.getDate() + 7);
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

    return c.json({ id });
  }

  if (segments.length === 3 && segments[0] === 'users' && segments[2] === 'block') {
    const id = segments[1];
    const body = await c.req.json();
    const is_blocked = body.is_blocked ? 1 : 0;
    try {
      await db.prepare('UPDATE user_profiles SET is_blocked = ? WHERE user_id = ?').bind(is_blocked, id).run();
      return c.json({ success: true, is_blocked });
    } catch (error: any) {
      console.error('Failed to update block status:', error);
      return c.json({ error: 'Failed to update user' }, 500);
    }
  }

  // Manually set a user's plan (e.g. after the admin validates offline payment proof).
  if (segments.length === 3 && segments[0] === 'users' && segments[2] === 'plan') {
    const id = segments[1];
    const body = await c.req.json();
    const planType = body.plan_type === 'pro' ? 'pro' : 'free';
    try {
      if (planType === 'free') {
        const res = await db.prepare(
          "UPDATE user_profiles SET plan_type = 'free', subscription_status = 'active', plan_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
        ).bind(id).run();
        if (!res.meta.changes) return c.json({ error: 'User not found' }, 404);
        return c.json({ success: true, plan_type: 'free' });
      }

      const cycle = body.billing_cycle === 'yearly' ? 'yearly' : 'monthly';
      const expires = new Date();
      if (cycle === 'yearly') expires.setFullYear(expires.getFullYear() + 1);
      else expires.setDate(expires.getDate() + 30);

      const res = await db.prepare(
        "UPDATE user_profiles SET plan_type = 'pro', subscription_status = 'active', plan_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
      ).bind(expires.toISOString(), id).run();
      if (!res.meta.changes) return c.json({ error: 'User not found' }, 404);

      return c.json({ success: true, plan_type: 'pro', billing_cycle: cycle, plan_expires_at: expires.toISOString() });
    } catch (error: any) {
      console.error('Failed to update user plan:', error);
      return c.json({ error: 'Failed to update user plan' }, 500);
    }
  }

  if (path === 'images') {
    const { filename, mime, data_base64 } = await c.req.json();
    if (!mime?.startsWith('image/') || typeof data_base64 !== 'string' || !data_base64) {
      return c.json({ error: 'mime (image/*) and data_base64 required' }, 400);
    }
    // Client compresses crops before upload; this is just a sanity cap
    // against abuse now that bytes go to R2 instead of a D1 row.
    if (data_base64.length > 11_000_000) {
      return c.json({ error: 'Image too large. Max ~8MB after compression.' }, 413);
    }
    const id = nanoid();
    const ext = mime.split('/')[1]?.split('+')[0] || 'bin';
    const r2Key = `blog/${id}.${ext}`;
    try {
      const bytes = Uint8Array.from(atob(data_base64), (ch) => ch.charCodeAt(0));
      await c.env.IMAGES.put(r2Key, bytes, { httpMetadata: { contentType: mime } });
      await db.prepare(
        'INSERT INTO blog_images (id, filename, mime, r2_key, size) VALUES (?, ?, ?, ?, ?)'
      ).bind(id, filename ?? null, mime, r2Key, bytes.byteLength).run();
      return c.json({ id, url: `/api/images/${id}` });
    } catch (error: any) {
      console.error('Failed to store image:', error);
      return c.json({ error: 'Failed to store image' }, 500);
    }
  }

  if (path === 'blogs') {
    const { title, slug, content, excerpt, author, published, cover_image_url } = await c.req.json();
    if (!title?.trim() || !slug?.trim() || !content?.trim()) {
      return c.json({ error: 'title, slug, and content required' }, 400);
    }
    const id = nanoid();
    try {
      await db.prepare(`
        INSERT INTO blogs (id, title, slug, content, excerpt, author, cover_image_url, published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, title.trim(), slug.trim(), content.trim(), excerpt ?? null, author ?? null, cover_image_url ?? null, published ? 1 : 0
      ).run();
      return c.json({ id });
    } catch (error: any) {
      console.error('Failed to create blog:', error);
      return c.json({ error: 'Failed to create blog. Slug might not be unique.' }, 500);
    }
  }

  return c.json({ error: 'Not Found' }, 404);
});

router.patch('/admin/:action{.+}', async (c) => {
  const path = c.req.param('action');
  const segments = path.split('/');

  const denied = await requireAdmin(c);
  if (denied) return denied;
  const db = getDB(c);

  if (segments.length === 2 && segments[0] === 'tools') {
    const id = segments[1];
    const body = await c.req.json();
    const sets: string[] = [];
    const values: any[] = [];
    const fields = ['tool_name', 'tool_url', 'tool_logo', 'category', 'description', 'pricing_info', 'sort_order', 'new_until'];
    for (const f of fields) {
      if (f in body) { sets.push(`${f} = ?`); values.push(body[f]); }
    }
    for (const f of ['is_free', 'active', 'is_new']) {
      if (f in body) { sets.push(`${f} = ?`); values.push(body[f] ? 1 : 0); }
    }
    if ('supported_outputs' in body) { sets.push('supported_outputs = ?'); values.push(JSON.stringify(body.supported_outputs)); }
    if ('walkthrough_steps' in body) { sets.push('walkthrough_steps = ?'); values.push(body.walkthrough_steps ? JSON.stringify(body.walkthrough_steps) : null); }
    if (body.is_new && !body.new_until) {
      const d = new Date(); d.setDate(d.getDate() + 7);
      sets.push('new_until = ?'); values.push(d.toISOString());
    }
    sets.push('updated_at = ?'); values.push(new Date().toISOString());
    values.push(id);

    await db.prepare(`UPDATE system_tools SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
    return c.json({ ok: true });
  }

  if (segments.length === 2 && segments[0] === 'blogs') {
    const id = segments[1];
    const body = await c.req.json();
    const sets: string[] = [];
    const values: any[] = [];
    const fields = ['title', 'slug', 'content', 'excerpt', 'author', 'cover_image_url'];
    for (const f of fields) {
      if (f in body) { sets.push(`${f} = ?`); values.push(body[f]); }
    }
    if ('published' in body) { sets.push('published = ?'); values.push(body.published ? 1 : 0); }
    if (sets.length > 0) {
      sets.push('updated_at = ?'); values.push(new Date().toISOString());
      values.push(id);
      try {
        await db.prepare(`UPDATE blogs SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
      } catch (error: any) {
        console.error('Failed to update blog:', error);
        return c.json({ error: 'Failed to update blog' }, 500);
      }
    }
    return c.json({ ok: true });
  }

  return c.json({ error: 'Not Found' }, 404);
});

router.delete('/admin/:action{.+}', async (c) => {
  const path = c.req.param('action');
  const segments = path.split('/');

  const denied = await requireAdmin(c);
  if (denied) return denied;
  const db = getDB(c);

  if (segments.length === 2 && segments[0] === 'tools') {
    const id = segments[1];
    await db.prepare('DELETE FROM system_tools WHERE id = ?').bind(id).run();
    return c.json({ ok: true });
  }

  if (segments.length === 2 && segments[0] === 'blogs') {
    const id = segments[1];
    try {
      await db.prepare('DELETE FROM blogs WHERE id = ?').bind(id).run();
      return c.json({ ok: true });
    } catch (error: any) {
      console.error('Failed to delete blog:', error);
      return c.json({ error: 'Failed to delete blog' }, 500);
    }
  }

  if (segments.length === 2 && segments[0] === 'images') {
    const id = segments[1];
    try {
      const row = await db.prepare('SELECT r2_key FROM blog_images WHERE id = ?').bind(id).first<{ r2_key: string }>();
      if (row) await c.env.IMAGES.delete(row.r2_key);
      await db.prepare('DELETE FROM blog_images WHERE id = ?').bind(id).run();
      return c.json({ ok: true });
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      return c.json({ error: 'Failed to delete image' }, 500);
    }
  }

  return c.json({ error: 'Not Found' }, 404);
});

export default router;
