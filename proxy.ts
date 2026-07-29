import { NextResponse, type NextRequest } from 'next/server';

// Must match SESSION_COOKIE in worker/src/lib/user-auth.ts.
const SESSION_COOKIE = 'co_session';

// UX-only gate: a cookie presence check so signed-out visitors land on /login
// instead of an empty dashboard. Real auth is enforced by the API worker, which
// verifies the cookie's signature on every request.
export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/builder/:path*',
    '/workspace/:path*',
    '/tools/:path*',
    '/prompts/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/help/:path*',
  ],
};
