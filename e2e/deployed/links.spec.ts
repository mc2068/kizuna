// No broken internal links: every same-site link on every public page answers below 400 (after
// redirects, so /projects lands on sign-in). Read-only GET requests.
import { expect, test } from '@playwright/test';
import { PUBLIC_ROUTES } from './support';

test('every internal link on the public pages resolves', async ({ page, request, baseURL }) => {
  test.setTimeout(180_000);
  const origin = new URL(baseURL!).origin;
  const found = new Map<string, string>(); // link path -> first page it was seen on

  for (const route of PUBLIC_ROUTES) {
    await page.goto(route.path);
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin !== origin) continue;
      const path = url.pathname + url.search;
      if (!found.has(path)) found.set(path, route.path);
    }
  }

  const broken: string[] = [];
  for (const [path, from] of found) {
    const res = await request.get(path);
    if (res.status() >= 400) broken.push(`${path} -> ${res.status()} (linked from ${from})`);
  }
  expect(found.size).toBeGreaterThan(5);
  expect(broken).toEqual([]);
});

test('an unknown page answers 404 with the site not-found page', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('link').first()).toBeVisible();
});
