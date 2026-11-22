// Shared bits for the specs that run against the deployed site (playwright.deployed.config.ts).
import type { Page } from '@playwright/test';
import { ROUTES } from '../../src/config/routes';
import { accessFor } from '../../src/lib/auth/paths';

/**
 * Public pages that can be checked on any deployment. /p/demo-djerba is left out: it is a share link
 * seeded only in the local database and the in-memory fake, so production answers 404 for it.
 * share.spec.ts covers share links instead.
 */
export const PUBLIC_ROUTES = ROUTES.filter((r) => r.access === 'public' && !r.path.startsWith('/p/'));
export const SIGNED_IN_ROUTES = ROUTES.filter((r) => r.access === 'signed-in');
export const ADMIN_ROUTES = ROUTES.filter((r) => r.access === 'admin');

/** Link prefetches of /admin/** answer 404 to non-admins on purpose (the admin area stays hidden). */
function isHiddenAdminPrefetch(url: string): boolean {
  if (!url) return false;
  const { pathname, searchParams } = new URL(url);
  return searchParams.has('_rsc') && accessFor(pathname) === 'admin';
}

/** Collects page errors and console errors from now on; read the array at the end of the test. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !isHiddenAdminPrefetch(m.location().url)) errors.push(`console: ${m.text()} ${m.location().url}`);
  });
  return errors;
}
