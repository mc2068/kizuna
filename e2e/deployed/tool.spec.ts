// The sizing tool on the deployed site (#9, #10, #27): defaults give the Djerba verdict, changing the
// inputs updates the result and the URL with no submit, a reload restores them, and the hourly
// chart loads when scrolled into view.
import { expect, test } from '@playwright/test';
import { collectErrors } from './support';

test('run the tool, change the hotel and reload', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/tool');
  const main = page.locator('main');
  await expect(main).toContainText('Possible fit, needs a study');
  await expect(main).toContainText('5 to 21.5 years (9 central)');

  await page.getByRole('radio', { name: /Tozeur/ }).check({ force: true });
  await page.locator('input[type="range"]').first().fill('100');
  await expect(page).toHaveURL(/city=tozeur/);
  await expect(page).toHaveURL(/rooms=100/);
  await expect(main).not.toContainText('5 to 21.5 years (9 central)');

  await page.reload();
  await expect(page.getByRole('radio', { name: /Tozeur/ })).toBeChecked();
  await expect(page.locator('input[type="range"]').first()).toHaveValue('100');
  await expect(main).not.toContainText('5 to 21.5 years (9 central)');
  expect(errors).toEqual([]);
});

test('the hourly chart loads when scrolled into view', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/tool');
  const section = page.getByRole('region', { name: 'A typical day, hour by hour.' });
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('.recharts-surface')).toBeVisible();
  await section.getByRole('tab', { name: 'Hot water' }).click();
  await expect(section.getByRole('tab', { name: 'Hot water' })).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});
