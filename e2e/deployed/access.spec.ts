// Who can open what, on the deployed site, signed out (#7). Nothing here signs in or sends an email:
// the bad-email check is rejected before any send.
import { expect, test } from '@playwright/test';
import { ADMIN_ROUTES, SIGNED_IN_ROUTES } from './support';

for (const route of SIGNED_IN_ROUTES) {
  test(`${route.path} sends visitors to sign-in and back`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page).toHaveURL(`/sign-in?next=${encodeURIComponent(route.path)}`);
    await expect(page.locator('form input[name="next"]').first()).toHaveValue(route.path);
  });
}

for (const route of ADMIN_ROUTES) {
  test(`${route.path} is a 404 signed out`, async ({ page }) => {
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

test('sign-in rejects a bad email without sending anything', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Enter a valid email address.' })).toBeVisible();
});

test('a callback with a bad token goes back to sign-in with an error', async ({ page }) => {
  await page.goto('/auth/callback?token_hash=nope&type=magiclink&next=/projects');
  await expect(page).toHaveURL('/sign-in?error=link&next=%2Fprojects');
  await expect(page.getByRole('alert').filter({ hasText: 'That sign-in link is invalid or has expired.' })).toBeVisible();
});
