// Share links and PDF routes on the deployed site, signed out: unknown links and other people's
// projects are a plain 404, never an error page or a leak.
import { expect, test } from '@playwright/test';

test('an unknown share link is a 404', async ({ page }) => {
  const res = await page.goto('/p/e2e-unknown-share-token');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('the PDF of an unknown share link is a 404', async ({ request }) => {
  const res = await request.get('/api/share/e2e-unknown-share-token/report');
  expect(res.status()).toBe(404);
});

test('a project PDF needs its signed-in owner', async ({ request }) => {
  const res = await request.get('/api/projects/00000000-0000-4000-8000-000000000000/report');
  expect(res.status()).toBe(404);
  expect(res.headers()['content-type'] ?? '').not.toContain('application/pdf');
});
