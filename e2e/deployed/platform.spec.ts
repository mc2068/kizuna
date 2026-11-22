// Platform checks on the deployed site: HTTPS only, cookie-free for visitors (Vercel Analytics sets
// no cookie), and the study request form asks for consent and links the privacy notice. The form is
// submitted empty only, so no lead is ever created in production.
import { expect, test } from '@playwright/test';
import { PUBLIC_ROUTES } from './support';

test('HTTP redirects to HTTPS and HSTS is on', async ({ request, baseURL }) => {
  const res = await request.get('/');
  expect(res.headers()['strict-transport-security']).toMatch(/max-age=\d{7,}/);

  const http = baseURL!.replace(/^https:/, 'http:');
  const plain = await request.get(http, { maxRedirects: 0 });
  expect([301, 307, 308]).toContain(plain.status());
  expect(plain.headers()['location']).toMatch(/^https:/);
});

test('a signed-out visit sets no cookies', async ({ page, context }) => {
  for (const route of PUBLIC_ROUTES) await page.goto(route.path);
  expect(await context.cookies()).toEqual([]);
});

test('the study request form needs consent and links the privacy notice', async ({ page }) => {
  await page.goto('/request-study');
  const form = page.locator('[data-study-form]');
  await expect(form.getByRole('checkbox')).toBeVisible();
  await expect(form.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');

  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('We need your consent to answer the request.')).toBeVisible();
  await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true');
});
