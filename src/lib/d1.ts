import { getRequestContext } from '@cloudflare/next-on-pages';

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = any>(colName?: string): Promise<T | null>;
  all<T = any>(): Promise<{ results: T[]; success: boolean; [key: string]: any }>;
  run<T = any>(): Promise<{ success: boolean; [key: string]: any }>;
}

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch(statements: D1PreparedStatement[]): Promise<any[]>;
  exec(query: string): Promise<any>;
};

export function getDB(): D1Database | null {
  try {
    const { env } = getRequestContext();
    return (env as Record<string, unknown>).DB as any ?? null;
  } catch {
    return null;
  }
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 6);
}
