// Saving a project from /tool (#21): signed in it saves in one step; signed out the visitor signs
// in by magic link and the project saves itself once on return. Results are always the server's.
import { expect, test, type Page } from '@playwright/test';
import { freshEmail, magicLinkFromInbox, onSupabase, SEEDED, serviceClient, signInAs, SKIP_REASON } from './support/supabase';

test.skip(!onSupabase, SKIP_REASON);

const TOOL = '/tool?rooms=420&city=tozeur&pool=0&price=';

async function savedRows(hotelName: string) {
  const { data, error } = await serviceClient().from('projects').select('id, inputs, results').eq('hotel_name', hotelName);
  if (error) throw error;
  return data;
}

async function saveFromTool(page: Page, hotelName: string) {
  await page.getByRole('button', { name: 'Save this project' }).click();
  const dialog = page.getByRole('dialog', { name: 'Save this project.' });
  await dialog.getByLabel('Hotel name').fill(hotelName);
  await dialog.getByRole('button', { name: 'Save' }).click();
}

test('signed in, a project saves in one step with server-side results', async ({ page }) => {
  const hotelName = `Signed-in hotel ${Date.now()}`;
  await signInAs(page, SEEDED.user, TOOL);
  await saveFromTool(page, hotelName);
  await expect(page.getByText('Saved to My projects.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const rows = await savedRows(hotelName);
  expect(rows).toHaveLength(1);
  expect(rows[0].inputs).toEqual({ rooms: 420, city: 'tozeur', pool: false, elecPrice: null });
  expect((rows[0].results as { engineKwe: number }).engineKwe).toBeGreaterThan(0);
});

test('a short hotel name is refused before anything is sent', async ({ page }) => {
  await page.goto(TOOL);
  await saveFromTool(page, 'A');
  await expect(page.getByRole('alert').filter({ hasText: 'Enter a hotel name of 2 to 80 characters.' })).toBeVisible();
  await expect(page).toHaveURL(TOOL);
});

test('signed out, the project saves itself once after the magic link', async ({ page }) => {
  const email = freshEmail('save');
  const hotelName = `Pending hotel ${Date.now()}`;

  await page.goto(TOOL);
  await saveFromTool(page, hotelName);
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  expect(new URL(page.url()).searchParams.get('next')).toBe('/tool?rooms=420&city=tozeur&pool=0&price=&resume=1');

  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Email me a link' }).click();
  await expect(page.getByRole('status')).toContainText('Check your inbox');
  await page.goto(await magicLinkFromInbox(email));

  await expect(page.getByText('Saved to My projects.')).toBeVisible();
  await expect(page).toHaveURL(TOOL);
  expect(await savedRows(hotelName)).toHaveLength(1);

  // Coming back or reloading does not save it again.
  await page.goto(`${TOOL}&resume=1`);
  await expect(page).toHaveURL(TOOL);
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(await savedRows(hotelName)).toHaveLength(1);
});
