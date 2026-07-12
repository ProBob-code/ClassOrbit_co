// Base URL for server-side fetches to the ClassOrbit API worker.
// In dev, hits the local wrangler API worker directly instead of looping back
// through the Next.js dev server's /api rewrite (which doubles request latency).
// In production this must be the api.classorbit.co Custom Domain, not classorbit.co
// itself: same-zone Worker-to-Worker fetch() is blocked when the target is bound via
// a route (Cloudflare error 1042), which silently broke the blog page's SSR fetch.
export function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8787' : 'https://api.classorbit.co';
}
