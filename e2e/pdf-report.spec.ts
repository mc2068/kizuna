// The PDF report (#23): the owner downloads it from My projects, anyone with the share link
// downloads it signed out, and nobody else gets it. Uses the seeded demo project (owned by the
// seeded admin, share token demo-djerba). Needs Supabase.
import { expect, test, type APIResponse } from '@playwright/test';
import { onSupabase, SEEDED, signInAs, SKIP_REASON } from './support/supabase';

test.skip(!onSupabase, SKIP_REASON);

async function expectPdf(res: APIResponse) {
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  expect(res.headers()['content-disposition']).toMatch(/attachment; filename=.*\.pdf/);
  expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
}

test('the owner downloads the PDF from My projects; signed out or another user gets a 404', async ({ page, browser }) => {
  await signInAs(page, SEEDED.admin, '/projects');
  const link = page.getByRole('link', { name: 'Download PDF' }).first();
  const href = await link.getAttribute('href');
  expect(href).toMatch(/^\/api\/projects\/[0-9a-f-]{36}\/report$/);
  await expectPdf(await page.request.get(href!));

  const anon = await browser.newContext();
  expect((await anon.request.get(href!)).status()).toBe(404);
  await anon.close();

  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signInAs(otherPage, SEEDED.user, '/projects');
  expect((await otherPage.request.get(href!)).status()).toBe(404);
  await other.close();
});

test('the share link downloads the PDF signed out; an unknown token is a 404', async ({ page }) => {
  await page.goto('/p/demo-djerba');
  const href = await page.getByRole('link', { name: 'Download PDF report' }).getAttribute('href');
  expect(href).toBe('/api/share/demo-djerba/report');
  await expectPdf(await page.request.get(href!));
  expect((await page.request.get('/api/share/not-a-token/report')).status()).toBe(404);
});
