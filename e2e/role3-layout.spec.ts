// Role 3 (Gaith): header, footer and AdminShell on every page, at 1440 and 360 px.
import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './role3-pages';

test.describe('layout', () => {
  for (const path of PUBLIC_PAGES) {
    test(`header, footer, one h1 and no sideways scroll on ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      // The signed-in header streams in and replaces the static one.
      await expect(page.locator('[data-site-header]')).toHaveCount(1);
      await expect(page.locator('[data-site-header]')).toBeVisible();
      await expect(page.locator('[data-site-footer]')).toBeVisible();
      // /tool is still Ahmed's scaffold stub (no #main yet); every Role 3 page has one.
      if (path !== '/tool') await expect(page.locator('main#main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test('the skip link moves focus to the content', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('[data-site-header]')).toHaveCount(1);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('the mobile menu opens, lists every section and closes with Escape', async ({ page, isMobile }, info) => {
    test.skip(info.project.name !== 'phone', 'phone only');
    void isMobile;
    await page.goto('/');
    await expect(page.locator('[data-site-header]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    for (const name of ['How it works', 'Sizing tool', 'Services', 'Djerba case', 'About', 'Sources']) {
      await expect(dialog.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(dialog.getByRole('link', { name: 'Screen your hotel' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('desktop nav marks the current page', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'desktop only');
    await page.goto('/services');
    await expect(page.locator('[data-site-header]')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page');
  });

  test('admin pages use AdminShell instead of the public header and footer', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('complementary', { name: 'Admin' })).toBeVisible();
    await expect(page.locator('[data-site-header]')).toHaveCount(0);
    await expect(page.locator('[data-site-footer]')).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });


  test('/dev/ui is development only', async ({ page }) => {
    const res = await page.goto('/dev/ui');
    expect(res?.status()).toBe(404);
  });
});
