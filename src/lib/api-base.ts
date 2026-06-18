// Base URL for server-side fetches to the ClassOrbit API worker.
// In dev, hits the local wrangler API worker directly instead of looping back
// through the Next.js dev server's /api rewrite (which doubles request latency).
export function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8787' : 'https://classorbit.co';
}
