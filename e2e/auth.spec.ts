// Sign-in by magic link end to end (#7): the email is read from local Supabase's inbox (Mailpit).
import { expect, test } from '@playwright/test';
import { freshEmail, magicLinkFromInbox, onSupabase, SKIP_REASON } from './support/supabase';

test.skip(!onSupabase, SKIP_REASON);

test('a new visitor signs in from the inbox, lands where they were going, and signs out', async ({ page }) => {
  const email = freshEmail('signin');

  await page.goto('/projects');
  await expect(page).toHaveURL('/sign-in?next=%2Fprojects');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await expect(page.getByRole('status')).toContainText('Check your inbox');
  await expect(page.getByRole('status')).toContainText(email);

  await page.goto(await magicLinkFromInbox(email));
  await expect(page).toHaveURL('/projects');
  await expect(page.locator('h1')).toHaveCount(1);

  await page.goto('/sign-in');
  await expect(page.getByText(`You are signed in as ${email}.`)).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/projects');
  await expect(page).toHaveURL('/sign-in?next=%2Fprojects');
});

test('a magic link works only once', async ({ page, browser }) => {
  const email = freshEmail('once');
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await expect(page.getByRole('status')).toContainText('Check your inbox');
  const link = await magicLinkFromInbox(email);

  await page.goto(link);
  await expect(page).toHaveURL('/projects');

  // A second browser (no session, no PKCE cookie) opening the same link is refused.
  const other = await browser.newContext();
  const second = await other.newPage();
  await second.goto(link);
  await expect(second).toHaveURL(/\/sign-in\?error=link/);
  await other.close();
});
