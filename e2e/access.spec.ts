// Who can open what (#7): /projects needs a signed-in visitor, /admin/** is a 404 for everyone but
// admins, and the sign-in page keeps ?next= on this site.
import { expect, test } from '@playwright/test';
import { ROUTES } from '../src/config/routes';
import { onSupabase, SEEDED, SKIP_REASON, signInAs } from './support/supabase';

const signedIn = ROUTES.filter((r) => r.access === 'signed-in');
const admin = ROUTES.filter((r) => r.access === 'admin');

test.describe('signed out', () => {
  for (const route of signedIn) {
    test(`${route.path} sends visitors to sign-in and back`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(`/sign-in?next=${encodeURIComponent(route.path)}`);
      await expect(page.locator('form input[name="next"]').first()).toHaveValue(route.path);
    });
  }

  for (const route of admin) {
    test(`${route.path} is a 404`, async ({ page }) => {
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
});

test.describe('signed in', () => {
  test.skip(!onSupabase, SKIP_REASON);

  test('a hotel user opens /projects but gets a 404 on /admin', async ({ page }) => {
    await signInAs(page, SEEDED.user, '/projects');
    await expect(page.locator('h1')).toHaveCount(1);
    for (const route of admin) {
      const res = await page.goto(route.path);
      expect(res?.status(), route.path).toBe(404);
    }
  });

  test('an admin opens every admin page', async ({ page }) => {
    await signInAs(page, SEEDED.admin, '/admin');
    for (const route of admin) {
      const res = await page.goto(route.path);
      expect(res?.status(), route.path).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

  test('a callback with a bad token goes back to sign-in with an error', async ({ page }) => {
    await page.goto('/auth/callback?token_hash=nope&type=magiclink&next=/projects');
    await expect(page).toHaveURL('/sign-in?error=link&next=%2Fprojects');
    await expect(page.getByRole('alert').filter({ hasText: 'That sign-in link is invalid or has expired.' })).toBeVisible();
  });
});
