// Role 3 (Gaith): Home page (#15).
import { expect, test } from '@playwright/test';

test.describe('home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has the prototype sections in order', async ({ page }) => {
    const headings = await page.locator('main h1, main h2').allTextContents();
    const expected = [
      'Make your own energy.',
      'A 300-room hotel in Djerba.',
      'One engine. Three jobs.',
      'Most hotels will hear “not yet”.',
      'Screen your hotel.',
      'What moves the answer.',
      'From a screening to a plant.',
      'Already running in Tunisia.',
      'Possible fit?',
    ];
    let at = 0;
    for (const want of expected) {
      const i = headings.findIndex((h, j) => j >= at && h.startsWith(want));
      expect(i, `"${want}" after position ${at}`).toBeGreaterThanOrEqual(0);
      at = i + 1;
    }
  });

  test('shows the frozen Djerba numbers from the engine', async ({ page }) => {
    const demo = page.locator('#demo');
    await expect(demo).toContainText('200 kWe engine + 64 kWc chiller');
    await expect(demo).toContainText('5 to 21.5 years');
    await expect(demo).toContainText('110k to 260k TND');
    await expect(demo).toContainText('70 to 260 t CO2/yr');
    await expect(demo).toContainText('3.5 to 15 years');
    await expect(page.getByRole('img', { name: /electricity 53%, hot water 58%, cooling 3%/ })).toBeVisible();
  });

  test('CTAs go to the tool, how it works and the study request', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Screen my hotel' })).toHaveAttribute('href', '/tool?rooms=300&city=djerba&pool=1');
    await expect(page.getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '/how-it-works');
    await expect(page.getByRole('link', { name: 'Request a feasibility study' })).toHaveAttribute('href', '/request-study');
  });

  test('every footnote links to a source anchor on /sources', async ({ page }) => {
    const hrefs = await page.locator('main sup a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(5);
    for (const h of hrefs) expect(h).toMatch(/^\/sources#ref-[a-z0-9-]+$/);
  });

  test('has a title and description', async ({ page }) => {
    await expect(page).toHaveTitle(/Trigeneration screening for Tunisian hotels/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /two minutes/);
  });
});
