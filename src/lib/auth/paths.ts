// Pure helpers for where sign-in sends people. No Next or Supabase imports, so the proxy, route
// handlers, server actions and tests can all use them.

export const SIGN_IN_PATH = '/sign-in';
export const DEFAULT_AFTER_SIGN_IN = '/projects';

export type Access = 'public' | 'signed-in' | 'admin';

/**
 * A same-origin path to return to after sign-in, or the default. Rejects absolute URLs,
 * protocol-relative "//host" and "/\host" tricks, and anything that is not a path, so ?next=
 * can never send a visitor to another site.
 */
export function safeNextPath(raw: string | null | undefined, fallback = DEFAULT_AFTER_SIGN_IN): string {
  if (!raw || typeof raw !== 'string') return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  // Control characters (tabs, newlines) are stripped by browsers and can turn "/\t/evil" into "//evil".
  if (/[\u0000-\u001f\u007f]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, 'http://same-origin.invalid');
    if (url.origin !== 'http://same-origin.invalid') return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    // Never bounce back into the sign-in page or the callback itself.
    if (url.pathname === SIGN_IN_PATH || url.pathname.startsWith('/auth/')) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

/** The sign-in page, returning to `next` afterwards. */
export function signInPath(next?: string | null): string {
  const safe = next ? safeNextPath(next, '') : '';
  return safe ? `${SIGN_IN_PATH}?next=${encodeURIComponent(safe)}` : SIGN_IN_PATH;
}

/** Who may open a path: /projects needs a signed-in visitor, /admin/** an admin. */
export function accessFor(pathname: string): Access {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/projects' || pathname.startsWith('/projects/')) return 'signed-in';
  return 'public';
}
