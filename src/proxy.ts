// Runs before every page render (Next 16 renamed middleware.ts to proxy.ts).
// 1. Refreshes the Supabase session cookies.
// 2. /projects: signed-out visitors are redirected to /sign-in?next=<where they were>.
// 3. /admin/**: everyone but admins gets the 404 page, so the admin area is not revealed.
// The checks live here, before rendering starts, so the status codes are real (307, 404): a check
// in a layout runs after the page has started streaming. The layouts repeat them as a backstop.
import { NextResponse, type NextRequest } from 'next/server';
import { accessFor, signInPath } from '@/lib/auth/paths';
import { fakeStore } from '@/lib/db/fake/store';
import type { CurrentUser } from '@/lib/db/types';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const access = accessFor(request.nextUrl.pathname);

  let response = NextResponse.next();
  let user: CurrentUser | null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    ({ response, user } = await updateSession(request));
  } else {
    // The in-memory fake: no session, just the configured demo user.
    if (access === 'public') return response;
    user = await fakeStore.currentUser();
  }

  if (access === 'signed-in' && !user) {
    const { pathname, search } = request.nextUrl;
    return withCookies(NextResponse.redirect(new URL(signInPath(`${pathname}${search}`), request.url)), response);
  }
  if (access === 'admin' && user?.role !== 'admin') {
    return withCookies(NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 }), response);
  }
  return response;
}

/** Keep any cookies the session refresh rotated or cleared. */
function withCookies(target: NextResponse, source: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie);
  return target;
}

export const config = {
  // Everything except static assets and image optimisation.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|pdf)$).*)'],
};
