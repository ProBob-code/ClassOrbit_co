import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/d1';

const router = new Hono<AppEnv>();

router.get('/blogs', async (c) => {
  const db = getDB(c);
  try {
    const result = await db.prepare(
      'SELECT id, title, slug, excerpt, author, cover_image_url, published, created_at, updated_at FROM blogs WHERE published = 1 ORDER BY created_at DESC'
    ).all();
    return c.json({ blogs: result.results || [] });
  } catch (error: any) {
    console.error('Failed to fetch blogs:', error);
    return c.json({ error: 'Failed to fetch blogs' }, 500);
  }
});

router.get('/blogs/:slug', async (c) => {
  const db = getDB(c);
  const slug = c.req.param('slug');
  try {
    const result = await db.prepare(
      'SELECT * FROM blogs WHERE slug = ? AND published = 1'
    ).bind(slug).first();
    
    if (!result) {
      return c.json({ error: 'Blog not found' }, 404);
    }
    
    return c.json({ blog: result });
  } catch (error: any) {
    console.error('Failed to fetch blog:', error);
    return c.json({ error: 'Failed to fetch blog' }, 500);
  }
});

export default router;
