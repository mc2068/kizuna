import { expect, test } from '@playwright/test';
import { ROUTES } from '../src/config/routes';

// The production build runs on the in-memory fake with nobody signed in (playwright.config.ts).
for (const route of ROUTES.filter((r) => r.access === 'public')) {
  test(`${route.path} responds and has a heading`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(route.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

for (const route of ROUTES.filter((r) => r.access === 'signed-in')) {
  test(`${route.path} sends signed-out visitors to sign-in and back`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveURL(`/sign-in?next=${encodeURIComponent(route.path)}`);
    await expect(page.locator('form input[name="next"]').first()).toHaveValue(route.path);
  });
}

for (const route of ROUTES.filter((r) => r.access === 'admin')) {
  test(`${route.path} is a 404 for signed-out visitors`, async ({ page }) => {
    const res = await page.goto(route.path);
    expect(res?.status()).toBe(404);
  });
}

test('sign-in shows the magic link form, Google and the privacy link', async ({ page }) => {
  await page.goto('/sign-in?next=/tool');
  await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Email me a link' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'privacy notice' })).toHaveAttribute('href', '/privacy');
});

test('sign-in ignores an off-site ?next=', async ({ page }) => {
  await page.goto('/sign-in?next=//evil.example');
  await expect(page.locator('form input[name="next"]').first()).toHaveValue('/projects');
});
