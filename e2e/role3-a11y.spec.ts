// Role 3 (Gaith): automated accessibility check (axe-core, WCAG 2.0/2.1 A and AA) on every page
// Role 3 owns, at 1440 and 360 px.
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PUBLIC_PAGES } from './role3-pages';

const PAGES = [...PUBLIC_PAGES.filter((p) => p !== '/tool'), '/admin', '/request-study?rooms=300&city=djerba&pool=1'];

for (const path of PAGES) {
  test(`no WCAG A/AA violations on ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(summary).toEqual([]);
  });
}
