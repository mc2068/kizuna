// Runs before every page render (Next 16 renamed middleware.ts to proxy.ts).
// 1. Refreshes the Supabase session cookies.
// 2. /projects: signed-out visitors are redirected to /sign-in?next=<where they were>.
// 3. /admin/**: everyone but admins gets the 404 page, so the admin area is not revealed.
// 4. /p/<token>: an unknown or deleted share link gets the 404 page.
// The checks live here, before rendering starts, so the status codes are real (307, 404): a check
// in a layout runs after the page has started streaming. The layouts repeat them as a backstop.
import { NextResponse, type NextRequest } from 'next/server';
import { accessFor, isShareToken, shareTokenOf, signInPath } from '@/lib/auth/paths';
import { fakeStore } from '@/lib/db/fake/store';
import type { CurrentUser } from '@/lib/db/types';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const access = accessFor(request.nextUrl.pathname);
  const shareToken = shareTokenOf(request.nextUrl.pathname);
  if (shareToken !== null && !(await shareExists(shareToken))) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 });
  }

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

/** Whether a share link points at a project. Public (no session): the same function the page calls. */
async function shareExists(token: string): Promise<boolean> {
  if (!isShareToken(token)) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return (await fakeStore.sharedProject(token)) !== null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${url}/rest/v1/rpc/get_shared_project?select=hotel_name`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
    cache: 'no-store',
  });
  // On an outage let the page render (and fail or 404 there) rather than hide a working link.
  if (!res.ok) return true;
  const rows = (await res.json()) as unknown[];
  return rows.length > 0;
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
