import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { getDB } from '../lib/d1';

// Public serving of admin-uploaded blog images (cover + body images).
// Uploads/deletes are admin-only and live in routes/admin.ts.
const router = new Hono<AppEnv>();

router.get('/images/:id', async (c) => {
  const db = getDB(c);
  const id = c.req.param('id');
  try {
    const row = await db
      .prepare('SELECT mime, r2_key FROM blog_images WHERE id = ?')
      .bind(id)
      .first<{ mime: string; r2_key: string }>();
    if (!row) return c.json({ error: 'Image not found' }, 404);

    const object = await c.env.IMAGES.get(row.r2_key);
    if (!object) return c.json({ error: 'Image not found' }, 404);

    // Ids are unique per upload (never overwritten), so cache aggressively.
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Content-Type', row.mime);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return new Response(object.body, { headers });
  } catch (error: any) {
    console.error('Failed to serve image:', error);
    return c.json({ error: 'Failed to serve image' }, 500);
  }
});

export default router;
