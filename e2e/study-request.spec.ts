// A study request end to end (#20, #24, #25): a hotel submits the form, an admin finds it in the
// pipeline as "new", moves it to "contacted" and uploads a file. Needs Supabase (one server serves
// the visitor and the admin). The requests made here are deleted afterwards.
import { expect, test } from '@playwright/test';
import { onSupabase, SEEDED, serviceClient, signInAs, SKIP_REASON } from './support/supabase';

test.skip(!onSupabase, SKIP_REASON);

const created: string[] = [];

// The form allows 5 requests per client per hour; repeated local runs would hit it.
test.beforeAll(async () => {
  const { error } = await serviceClient().from('study_request_attempts').delete().gt('id', 0);
  if (error) throw error;
});

test.afterAll(async () => {
  if (!created.length) return;
  const sb = serviceClient();
  const { data: files } = await sb.from('lead_files').select('path').in('lead_id', created);
  if (files?.length) await sb.storage.from('lead-files').remove(files.map((f) => f.path));
  await sb.from('leads').delete().in('id', created);
});

test('request a study, then as an admin see it, change its status and upload a file', async ({ page, browser }) => {
  const hotel = `E2E Hotel ${Date.now()}`;

  // The hotel, signed out, comes from the tool.
  const visitor = await browser.newContext();
  const form = await visitor.newPage();
  await form.goto('/request-study?rooms=300&city=djerba&pool=1');
  await form.getByLabel('Your name').fill('Sami Trabelsi');
  await form.getByLabel('Email').fill('sami@hotel.example');
  await form.getByLabel('Hotel name').fill(hotel);
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Send request' }).click();
  const success = form.locator('[data-study-success]');
  await expect(success).toContainText('Thank you, Sami Trabelsi.');
  const id = (await success.textContent())?.match(/L-\d+/)?.[0];
  expect(id, 'lead reference on the success panel').toBeTruthy();
  created.push(id!);
  await visitor.close();

  // The admin finds it in the pipeline.
  await signInAs(page, SEEDED.admin, '/admin?status=new');
  const card = page.locator(`[data-lead="${id}"]`);
  await expect(card).toContainText(hotel);
  await expect(card).toContainText('300 rooms · pool');
  await expect(card).toContainText('Possible fit');
  await card.getByRole('link', { name: `Open lead ${hotel}` }).click();
  await expect(page).toHaveURL(`/admin/leads/${id}`);

  // Status: new -> contacted, logged in History.
  const status = page.getByRole('combobox', { name: 'Status' });
  await expect(status).toHaveValue('new');
  await status.selectOption('contacted');
  await page.getByRole('tab', { name: 'History' }).click();
  const history = page.getByRole('tabpanel', { name: 'History' });
  await expect(history).toContainText('moved the status from New to Contacted');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('contacted');

  // Files: upload a small PDF; it is listed, downloadable, and logged.
  await page.getByRole('tab', { name: 'Files' }).click();
  const files = page.getByRole('tabpanel', { name: 'Files' });
  await expect(files).toContainText('No files yet.');
  await files.locator('input[type="file"]').setInputFiles({
    name: 'site-survey.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
  });
  await expect(files).toContainText('Uploaded site-survey.pdf');
  const row = files.getByRole('row', { name: /site-survey\.pdf/ });
  await expect(row).toBeVisible();

  await page.getByRole('tab', { name: 'History' }).click();
  await expect(history).toContainText('uploaded site-survey.pdf');

  // Download asks for a short-lived signed Storage URL; it serves the same bytes.
  await page.getByRole('tab', { name: 'Files' }).click();
  const signed = page.waitForRequest(/\/storage\/v1\/object\/sign\/lead-files\//);
  await row.getByRole('button', { name: 'Download site-survey.pdf' }).click();
  const res = await page.request.get((await signed).url());
  expect(res.status()).toBe(200);
  expect((await res.body()).subarray(0, 5).toString()).toBe('%PDF-');
});
