// Role 3 (Gaith): admin leads pipeline (#24), on the seeded fake data (17 leads). Other specs may
// add "new" leads to the shared in-memory store while this runs, so totals are read from the page
// and exact counts are only asserted where those runs can't change them.
import { expect, test, type Page } from '@playwright/test';

async function total(page: Page): Promise<number> {
  const text = (await page.locator('[data-results-count]').textContent()) ?? '';
  return Number(text.match(/of (\d+)/)?.[1]);
}

test.describe('admin pipeline', () => {
  test('shows the KPI strip, the status tiles and all lead cards', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Study requests' })).toBeVisible();
    await expect(page.locator('[data-kpi="winRate"]')).toContainText('50%');
    for (const [s, n] of [['contacted', 4], ['quoted', 4], ['won', 2], ['lost', 2]] as const) {
      await expect(page.locator(`[data-tile="${s}"]`)).toContainText(String(n));
    }
    const all = await total(page);
    expect(all).toBeGreaterThanOrEqual(17);
    await expect(page.locator('[data-lead]')).toHaveCount(all);
    const card = page.locator('[data-lead="L-1052"]');
    await expect(card).toContainText('Résidence Bahr Azur');
    await expect(card).toContainText('420 rooms · pool');
    await expect(card).toContainText('Possible fit');
    await expect(card.getByRole('link', { name: 'Open lead Résidence Bahr Azur' })).toHaveAttribute('href', '/admin/leads/L-1052');
  });

  test('a status tile filters, and clicking it again clears the filter', async ({ page }) => {
    await page.goto('/admin');
    await page.locator('[data-tile="quoted"]').click();
    await expect(page).toHaveURL(/\/admin\?status=quoted$/);
    await expect(page.locator('[data-lead]')).toHaveCount(4);
    await expect(page.locator('[data-tile="quoted"]')).toHaveAttribute('aria-current', 'true');
    await page.locator('[data-tile="quoted"]').click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('[data-lead]')).toHaveCount(await total(page));
  });

  test('filters combine, live in the URL and survive a reload', async ({ page }) => {
    await page.goto('/admin?status=contacted');
    await page.getByRole('switch', { name: 'Assigned to me' }).click();
    await expect(page).toHaveURL(/status=contacted&mine=1/);
    await expect(page.locator('[data-lead]')).toHaveCount(2);
    await page.getByRole('combobox', { name: 'City' }).click();
    await page.getByRole('option', { name: 'Djerba' }).click();
    await expect(page).toHaveURL(/status=contacted&city=djerba&mine=1/);
    await expect(page.locator('[data-lead]')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-lead="L-1047"]')).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Assigned to me' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('[data-results-count]')).toHaveText(/^1 lead of \d+$/);
  });

  test('the verdict filter and an empty state with a way back', async ({ page }) => {
    await page.goto('/admin?verdict=weak');
    const cards = page.locator('[data-lead]');
    expect(await cards.count()).toBeGreaterThan(0);
    for (const c of await cards.all()) await expect(c).toContainText('Weak fit');
    await page.goto('/admin?status=lost&city=tozeur');
    await expect(page.locator('[data-empty]')).toContainText('No leads match these filters.');
    await page.getByRole('link', { name: 'Clear all filters' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('[data-lead]')).toHaveCount(await total(page));
  });

  test('"Assigned to me" in the rail shows only my leads', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('complementary', { name: 'Admin' }).getByRole('link', { name: 'Assigned to me' }).click();
    await expect(page).toHaveURL(/\/admin\?mine=1$/);
    const cards = page.locator('[data-lead]');
    expect(await cards.count()).toBeGreaterThanOrEqual(6);
    for (const c of await cards.all()) await expect(c.locator('footer')).toContainText('Mohamed Chakroun');
  });

  test('is usable at 768 px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/admin');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.locator('[data-filter-bar]')).toBeVisible();
    await expect(page.locator('[data-lead]').first()).toBeVisible();
  });

  test('signed-out visitors cannot see it', async ({ page, context }) => {
    await context.addCookies([{ name: 'kz-fake-user', value: 'none', url: 'http://localhost:3100' }]);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator('[data-lead]')).toHaveCount(0);
  });
});
