// Role 3 (Gaith): Request a study page and form (#20), against the server action and fake db.
import { expect, test } from '@playwright/test';

test.describe('request a study', () => {
  test('prefills from a tool link and shows the screening summary', async ({ page }) => {
    await page.goto('/request-study?rooms=300&city=djerba&pool=1');
    const summary = page.locator('[data-screening-summary]');
    await expect(summary).toContainText('Possible fit');
    await expect(summary).toContainText('200 kWe engine + 64 kWc chiller');
    await expect(summary).toContainText('Payback 5–21.5 years, central 9 years');
    await expect(page.getByLabel('Rooms')).toHaveValue('300');
    await expect(page.getByRole('combobox', { name: 'City' })).toContainText('Djerba');
    await expect(page.getByRole('switch', { name: 'Heated pool' })).toHaveAttribute('aria-checked', 'true');
  });

  test('has no summary without a tool link', async ({ page }) => {
    await page.goto('/request-study');
    await expect(page.locator('[data-screening-summary]')).toHaveCount(0);
    await expect(page.getByText('Price on request')).toBeVisible();
  });

  test('shows field errors and requires consent', async ({ page }) => {
    await page.goto('/request-study');
    await page.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByText('Please check the fields marked in red.')).toBeVisible();
    await expect(page.getByText('We need your consent to answer the request.')).toBeVisible();
    await expect(page.getByLabel('Your name')).toBeFocused();
    await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true');
  });

  test('can be completed with the keyboard and lands on the success panel', async ({ page }) => {
    await page.goto('/request-study?rooms=420&city=sousse&pool=1');
    await page.getByLabel('Your name').fill('Leila Ben Ali');
    await page.keyboard.press('Tab');
    await page.keyboard.type('leila@hotel.example');
    await page.getByLabel('Hotel name').fill('Hotel Playwright');
    await page.getByLabel('Anything we should know?').fill('Open all year, indoor pool.');
    await page.getByRole('checkbox').focus();
    await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Send request' }).focus();
    await page.keyboard.press('Enter');
    const success = page.locator('[data-study-success]');
    await expect(success).toBeVisible();
    await expect(success).toContainText('Thank you, Leila Ben Ali.');
    await expect(success).toContainText(/Your reference is L-\d+/);
    await expect(success).toBeFocused();
    await success.getByRole('button', { name: 'Send another request' }).click();
    await expect(page.locator('[data-study-form]')).toBeVisible();
  });

  test('the consent links to Privacy', async ({ page }) => {
    await page.goto('/request-study');
    await expect(page.locator('[data-study-form]').getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  });
});
