// The hourly chart loads only near the viewport (#27), so it must still appear once the visitor
// scrolls to it, with no layout jump and nothing in the console.
import { expect, test } from '@playwright/test';

test('the hourly chart loads when scrolled into view', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/tool');
  const section = page.getByRole('region', { name: 'A typical day, hour by hour.' });
  await expect(section.locator('.recharts-surface')).toHaveCount(0);

  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('.recharts-surface')).toBeVisible();
  await section.getByRole('tab', { name: 'Hot water' }).click();
  await expect(section.getByRole('tab', { name: 'Hot water' })).toHaveAttribute('aria-selected', 'true');
  expect(errors).toEqual([]);
});
