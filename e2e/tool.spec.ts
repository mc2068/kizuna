// The sizing tool (#9, #10): the demo hotel's verdict, inputs that update the result with no
// submit, and a URL that restores the same result. Runs on the fake and on Supabase.
import { expect, test, type Page } from '@playwright/test';

const verdict = (page: Page) => page.getByRole('heading', { level: 3, name: /fit\./ });

/** Opens the tool and waits for the URL's inputs to replace the static (inert) demo shell. */
async function openTool(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('#main [inert]')).toHaveCount(0);
}

test('run the tool and see a verdict, change inputs, and reload from the URL', async ({ page }) => {
  await openTool(page, '/tool');
  await expect(verdict(page)).toHaveText('A possible fit. It needs a study.');
  await expect(page.getByText('200 kWe engine').first()).toBeVisible();

  await page.locator('label', { hasText: 'Tozeur' }).click();
  const rooms = page.getByRole('slider', { name: 'Rooms.' });
  await rooms.focus();
  await rooms.press('Home'); // 50 rooms
  for (let i = 0; i < 5; i++) await rooms.press('ArrowRight'); // + 5 x 10
  await expect(rooms).toHaveValue('100');

  await expect(page).toHaveURL(/[?&]rooms=100\b/);
  await expect(page).toHaveURL(/[?&]city=tozeur\b/);
  await expect(verdict(page)).toHaveText("A weak fit. A plant probably won't pay here.");

  await page.reload();
  await expect(page.locator('#main [inert]')).toHaveCount(0);
  await expect(page.getByRole('slider', { name: 'Rooms.' })).toHaveValue('100');
  await expect(page.getByRole('radio', { name: /Tozeur/ })).toBeChecked();
  await expect(verdict(page)).toHaveText("A weak fit. A plant probably won't pay here.");
});

test('"Request a study" carries the inputs to the form', async ({ page }) => {
  await openTool(page, '/tool?rooms=420&city=sousse&pool=1&price=');
  // The result's call to action (the header's "Request a study" has no inputs).
  await page.locator('a[href^="/request-study?"]', { hasText: 'Request a study' }).click();
  await expect(page).toHaveURL(/\/request-study\?.*rooms=420/);
  await expect(page.getByLabel('Rooms')).toHaveValue('420');
  await expect(page.getByRole('combobox', { name: 'City' })).toContainText('Sousse');
});
