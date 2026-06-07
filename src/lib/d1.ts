import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDB(): D1Database | null {
  try {
    const { env } = getRequestContext();
    return (env as Record<string, unknown>).DB as D1Database ?? null;
  } catch {
    return null;
  }
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 6);
}
