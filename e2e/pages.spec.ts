// Every public page renders: 200, one h1, nothing logged to the console, and no serious or critical
// axe (WCAG 2.1 AA) violations. Runs on desktop and at phone size (the `mobile` project).
import { expect, test } from '@playwright/test';
import { ROUTES } from '../src/config/routes';
import { accessFor } from '../src/lib/auth/paths';
import { seriousA11yViolations } from './support/a11y';

/** Link prefetches of /admin/** answer 404 to non-admins on purpose (the admin area stays hidden). */
function isHiddenAdminPrefetch(url: string): boolean {
  const { pathname, searchParams } = new URL(url);
  return searchParams.has('_rsc') && accessFor(pathname) === 'admin';
}

for (const route of ROUTES.filter((r) => r.access === 'public')) {
  test(`${route.path} renders cleanly and passes axe`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' && !isHiddenAdminPrefetch(m.location().url)) errors.push(`console: ${m.text()} ${m.location().url}`);
    });

    const res = await page.goto(route.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
}
