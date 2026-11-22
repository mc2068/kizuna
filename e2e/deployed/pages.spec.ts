// Every public page of the deployed site: 200 over HTTPS, one h1, a title, nothing in the console,
// and no serious or critical axe (WCAG 2.1 AA) violations. Desktop and Pixel 7.
import { expect, test } from '@playwright/test';
import { seriousA11yViolations } from '../support/a11y';
import { collectErrors, PUBLIC_ROUTES } from './support';

for (const route of PUBLIC_ROUTES) {
  test(`${route.path} renders cleanly and passes axe`, async ({ page }) => {
    const errors = collectErrors(page);

    const res = await page.goto(route.path);
    expect(res?.status()).toBe(200);
    expect(new URL(page.url()).protocol).toBe('https:');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/\S/);
    await page.waitForLoadState('load');

    expect(errors).toEqual([]);
    expect(await seriousA11yViolations(page)).toEqual([]);
  });
}
