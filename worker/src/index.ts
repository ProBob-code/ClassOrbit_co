import { Hono } from 'hono';
import type { AppEnv } from './types';
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
