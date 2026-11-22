// My projects and the shared project page (#22), on local Supabase: each test signs in a new user so
// runs never share data. Who sees what is also checked against RLS in tests/rls.test.ts and the
// data layer contract (src/lib/db/contract.suite.ts).
import { expect, test, type Browser, type Page } from '@playwright/test';
import { freshEmail, onSupabase, serviceClient, signInAs, SKIP_REASON } from './support/supabase';

test.skip(!onSupabase, SKIP_REASON);


/** A new, confirmed user signed in on `page`. */
async function newUser(page: Page): Promise<{ id: string; email: string }> {
  const email = freshEmail('projects');
  const { data, error } = await serviceClient().auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  await signInAs(page, email, '/projects');
  return { id: data.user.id, email };
}

/** Saves through the tool, like a visitor would, and returns to /projects. */
async function saveThroughTool(page: Page, hotelName: string) {
  await page.goto('/tool?rooms=300&city=djerba&pool=1&price=');
  await page.getByRole('button', { name: 'Save this project' }).click();
  await page.getByRole('dialog').getByLabel('Hotel name').fill(hotelName);
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved to My projects.')).toBeVisible();
  await page.goto('/projects');
}

function card(page: Page, hotelName: string) {
  return page.getByRole('article', { name: hotelName });
}

async function signedOutPage(browser: Browser) {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

test('the empty state links to the tool', async ({ page }) => {
  await newUser(page);
  await expect(page.getByRole('heading', { name: 'No projects yet.' })).toBeVisible();
  await page.getByRole('link', { name: 'Open the sizing tool' }).click();
  await expect(page).toHaveURL('/tool');
});

test('a saved project shows as a card, renames, shares signed out and deletes', async ({ page, browser, context }) => {
  const { email } = await newUser(page);
  const hotelName = `Card hotel ${Date.now()}`;
  await saveThroughTool(page, hotelName);

  const c = card(page, hotelName);
  await expect(c).toBeVisible();
  await expect(c).toContainText('300 rooms · Djerba · pool');
  await expect(c).toContainText('Payback, central case');
  await expect(c.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('href', /^\/api\/projects\/[0-9a-f-]{36}\/report$/);
  await expect(c.getByRole('link', { name: 'Open in the tool' })).toHaveAttribute('href', '/tool?rooms=300&city=djerba&pool=1&price=');

  // Rename
  await c.getByRole('button', { name: 'Rename' }).click();
  const renamed = `${hotelName} renamed`;
  await page.getByRole('dialog').getByLabel('Hotel name').fill(renamed);
  await page.getByRole('dialog').getByRole('button', { name: 'Save name' }).click();
  await expect(card(page, renamed)).toBeVisible();

  // Copy the share link and open it signed out
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await card(page, renamed).getByRole('button', { name: 'Copy share link' }).click();
  await expect(page.getByText('Share link copied.')).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/p\/[0-9a-f]{32}$/);

  const outside = await signedOutPage(browser);
  const res = await outside.page.goto(link);
  expect(res?.status()).toBe(200);
  await expect(outside.page.getByRole('heading', { level: 1 })).toHaveText(renamed);
  await expect(outside.page.getByRole('heading', { name: 'The numbers, as ranges.' })).toBeVisible();
  await expect(outside.page.getByRole('heading', { name: 'A typical day, hour by hour.' })).toBeVisible();
  await expect(outside.page.getByRole('link', { name: 'Screen your own hotel' })).toHaveAttribute('href', '/tool');
  await expect(outside.page.getByRole('button', { name: 'Save this project' })).toHaveCount(0);
  await expect(outside.page.getByRole('link', { name: 'Download PDF report' })).toHaveAttribute('href', `/api/share/${link.split('/p/')[1]}/report`);
  await expect(outside.page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  expect(await outside.page.content()).not.toContain(email);

  // Delete: the card goes and the share link stops working
  await card(page, renamed).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete project' }).click();
  await expect(card(page, renamed)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No projects yet.' })).toBeVisible();
  expect((await outside.page.goto(link))?.status()).toBe(404);
  await outside.context.close();
});

test('another user never sees the project', async ({ page, browser }) => {
  await newUser(page);
  const hotelName = `Private hotel ${Date.now()}`;
  await saveThroughTool(page, hotelName);
  await expect(card(page, hotelName)).toBeVisible();

  const other = await signedOutPage(browser);
  await newUser(other.page);
  await expect(other.page.getByRole('heading', { name: 'No projects yet.' })).toBeVisible();
  await expect(other.page.getByText(hotelName)).toHaveCount(0);
  await other.context.close();
});

test('a project from an older engine is flagged and re-runs', async ({ page }) => {
  const { id: ownerId } = await newUser(page);
  const hotelName = `Old engine hotel ${Date.now()}`;
  await saveThroughTool(page, hotelName);
  const { error } = await serviceClient().from('projects').update({ engine_version: '1.0.0' }).eq('owner_id', ownerId);
  if (error) throw error;

  await page.reload();
  const c = card(page, hotelName);
  await expect(c).toContainText('Calculated with an older engine');
  await c.getByRole('button', { name: 'Re-run' }).click();
  await expect(page.getByText('Re-run with the current engine.')).toBeVisible();
  await expect(c).not.toContainText('Calculated with an older engine');
  await expect(c.getByRole('button', { name: 'Re-run' })).toHaveCount(0);
});

test('an unknown share link is a 404', async ({ page }) => {
  expect((await page.goto('/p/00000000000000000000000000000000'))?.status()).toBe(404);
  expect((await page.goto(`/p/${'x'.repeat(200)}`))?.status()).toBe(404);
});

test.describe('seeded demo', () => {
  test('the demo share link shows the stored inputs', async ({ page }) => {
    await page.goto('/p/demo-djerba');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Djerba');
    await expect(page.getByText(/300 rooms · Djerba · heated pool · STEG time-of-use tariff/)).toBeVisible();
  });
});
