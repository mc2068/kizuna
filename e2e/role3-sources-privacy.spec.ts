// Role 3 (Gaith): Sources and method, Privacy (#18).
import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './role3-pages';

test.describe('sources and method', () => {
  test('every footnote on the site resolves to an anchor on /sources', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'same content on phones');
    const ids = new Set<string>();
    for (const path of PUBLIC_PAGES.filter((p) => p !== '/sources')) {
      await page.goto(path);
      for (const href of await page.locator('main sup a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))) {
        expect(href, `${path}`).toMatch(/^\/sources#ref-/);
        ids.add(href.split('#')[1]);
      }
    }
    expect(ids.size).toBeGreaterThan(8);
    await page.goto('/sources');
    for (const id of ids) await expect(page.locator(`li#${id}`), id).toHaveCount(1);
  });

  test('has the five sections, a table of contents and the engine assumptions', async ({ page }) => {
    await page.goto('/sources');
    for (const id of ['calculate', 'assumptions', 'moves', 'limits', 'references']) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
      await expect(page.getByRole('navigation', { name: 'On this page' }).locator(`a[href="#${id}"]`)).toHaveCount(1);
    }
    // Every engine parameter plus the fixed constants (method.ts ASSUMPTIONS), each with its source line.
    const rows = await page.locator('[data-assumption]').count();
    expect(rows).toBeGreaterThanOrEqual(16);
    await expect(page.locator('[data-assumption-source]')).toHaveCount(rows);
    await expect(page.locator('[data-limit]').first()).toBeVisible();
    expect(await page.locator('[data-sensitivity]').count()).toBeGreaterThanOrEqual(6);
    await expect(page.locator('[data-assumption="gasPrice"]')).toContainText('0.068');
    expect(await page.locator('#calculate ol > li').count()).toBeGreaterThanOrEqual(5);
  });

  test('external links open safely', async ({ page }) => {
    await page.goto('/sources');
    const links = await page.locator('main a[href^="http"]').evaluateAll((as) =>
      as.map((a) => ({ href: a.getAttribute('href'), rel: a.getAttribute('rel') ?? '' })),
    );
    expect(links.length).toBeGreaterThan(15);
    for (const l of links) {
      expect(l.href).toMatch(/^https:\/\//);
      expect(l.rel).toContain('noopener');
    }
  });

  test('the table of contents sticks on desktop', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'desktop only');
    await page.goto('/sources');
    const nav = page.getByRole('navigation', { name: 'On this page' });
    await page.locator('#references').scrollIntoViewIfNeeded();
    await expect(nav).toBeInViewport();
  });
});

test.describe('privacy', () => {
  test('is marked as a draft and lists every data item the forms collect', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('[data-privacy-draft]')).toContainText('Draft, pending legal review');
    const requests = page.locator('[data-collected="requests"]');
    for (const item of ['name', 'email', 'phone', 'hotel name', 'city', 'rooms', 'pool', 'electricity price', 'message', 'consent']) {
      await expect(requests).toContainText(item);
    }
    await expect(page.locator('[data-collected="signIn"]')).toContainText('email');
    await expect(page.locator('[data-collected="projects"]')).toContainText('hotel name');
    for (const p of ['supabase', 'resend', 'vercel']) await expect(page.locator(`[data-processor="${p}"]`)).toHaveCount(1);
    await expect(page.getByText(/Organic Law 2004-63/)).toBeVisible();
    await expect(page.getByRole('link', { name: /@/ }).first()).toHaveAttribute('href', /^mailto:/);
  });
});
