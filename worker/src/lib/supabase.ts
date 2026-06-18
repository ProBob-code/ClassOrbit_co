import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Context } from 'hono';
import type { AppEnv } from '../types';

function parseCookieHeader(header: string | undefined | null): { name: string; value: string }[] {
  if (!header) return [];
  return header.split(';').map((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return { name: pair.trim(), value: '' };
    return { name: pair.slice(0, idx).trim(), value: decodeURIComponent(pair.slice(idx + 1).trim()) };
  });
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (options.path) str += `; Path=${options.path}`;
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.maxAge !== undefined) str += `; Max-Age=${options.maxAge}`;
  if (options.expires) str += `; Expires=${new Date(options.expires).toUTCString()}`;
  if (options.httpOnly) str += '; HttpOnly';
  if (options.secure) str += '; Secure';
  if (options.sameSite) {
    const sameSite = typeof options.sameSite === 'string' ? options.sameSite : 'Strict';
    str += `; SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`;
  }
  return str;
}

/** Same-origin Supabase server client for the API worker: reads/writes cookies via the raw Cookie/Set-Cookie headers. */
export function getSupabase(c: Context<AppEnv>) {
  const supabaseUrl = c.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuqwqukqsgkbnhkztpyw.supabase.co';
  const supabaseAnonKey = c.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Iojn3bf-uWrIwbeJcQ3KqA_5YOF2-gZ';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(c.req.header('cookie'));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          c.header('Set-Cookie', serializeCookie(name, value, options), { append: true });
        }
      },
    },
  });
}
