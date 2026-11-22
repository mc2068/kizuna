import { expect, test } from '@playwright/test';
import { ROUTES } from '../src/config/routes';

for (const route of ROUTES) {
  test(`${route.path} responds and has a heading`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(route.path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}
