import type { Context } from 'hono';
import type { AppEnv } from '../types';

export function getDB(c: Context<AppEnv>): D1Database {
  return c.env.DB;
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 6);
}
