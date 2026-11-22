// Role 3: the public pages every layout and footnote check walks through.
import type { Page } from '@playwright/test';
import { onSupabase, SEEDED, signInAs } from './support/supabase';
export const PUBLIC_PAGES = [
  '/', '/how-it-works', '/tool', '/services', '/case-study/djerba', '/about', '/sources', '/request-study', '/privacy',
];

/** Signs in as the seeded admin before an /admin visit. On the in-memory fake the Role 3 server is
 *  already the demo admin (FAKE_DB_USER=admin in playwright.config.ts), so there is nothing to do. */
export async function asAdmin(page: Page): Promise<void> {
  if (onSupabase) await signInAs(page, SEEDED.admin, '/admin');
}
