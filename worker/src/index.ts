import { Hono } from 'hono';
import type { AppEnv } from './types';
import { alertAdmin } from './lib/alert';
import misc from './routes/misc';
import prompts from './routes/prompts';
import tools from './routes/tools';
import workspace from './routes/workspace';
import ai from './routes/ai';
import support from './routes/support';
import payment from './routes/payment';
import admin from './routes/admin';
import blogs from './routes/blogs';

const app = new Hono<AppEnv>();

// Consistent last-resort handler: any route that throws lands here, gets logged +
// alerted, and returns a uniform JSON 500 instead of Hono's default error page.
app.onError(async (err, c) => {
  console.error('[unhandled]', c.req.method, c.req.path, err);
  await alertAdmin(
    c.env,
    `unhandled:${c.req.path}`,
    `Unhandled error on ${c.req.method} ${c.req.path}`,
    String((err as Error)?.stack || err),
  );
  return c.json({ error: 'Internal server error' }, 500);
});

const api = new Hono<AppEnv>();

api.get('/__health', (c) => c.json({ ok: true }));

api.route('/', misc);
api.route('/', prompts);
api.route('/', tools);
api.route('/', workspace);
api.route('/', ai);
api.route('/', support);
api.route('/', payment);
api.route('/', admin);
api.route('/', blogs);

app.route('/api', api);

export default app;
