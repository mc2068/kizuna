// Role 3 (Gaith): How it works and Services and pricing (#16).
import { expect, test } from '@playwright/test';

test.describe('how it works', () => {
  test('shows the energy-flow diagram in the layout that fits the screen', async ({ page }, info) => {
    await page.goto('/how-it-works');
    const flow = page.locator('[data-energy-flow]');
    const visible = flow.locator('svg:visible');
    await expect(visible).toHaveCount(1);
    await expect(visible).toHaveAccessibleName(/38% of the gas becomes electricity, 43% becomes useful heat .* and 19% is lost/);
    const box = await visible.boundingBox();
    expect(box).not.toBeNull();
    // Wide diagram on desktop, tall one on phones.
    if (info.project.name === 'desktop') expect(box!.width).toBeGreaterThan(box!.height);
    else expect(box!.height).toBeGreaterThan(box!.width);
    for (const node of ['gas', 'engine', 'elec', 'heat', 'hotWater', 'chiller', 'cold', 'loss']) {
      await expect(visible.locator(`[data-node="${node}"]`)).toHaveCount(1);
    }
  });

  test('explains the verdict rules and links to the method', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(page.getByText(/Good fit up to 6 years of central payback\. Possible fit up to 10 years\./)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sources and method' }).first()).toHaveAttribute('href', '/sources');
    await expect(page.getByRole('heading', { name: 'Who it fits.' })).toBeVisible();
  });
});

test.describe('services and pricing', () => {
  test('has three offers: prices on request, shared savings coming soon', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('[data-offer]')).toHaveCount(3);
    await expect(page.locator('[data-offer="study"]')).toContainText('Price on request');
    await expect(page.locator('[data-offer="referral"]')).toContainText('Price on request');
    await expect(page.locator('[data-offer="esco"]')).toContainText('Coming soon');
    await expect(page.locator('[data-offer="esco"]')).not.toContainText('Price on request');
    await expect(page.getByRole('main')).not.toContainText(/\d[\d,.]*\s?(TND|DT)/);
  });

  test('shows the four-step process and a keyboard-friendly FAQ', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('ol > li')).toHaveCount(4);
    const q = page.getByRole('button', { name: 'Does the FTE subsidy apply to hotels?' });
    await q.focus();
    await page.keyboard.press('Enter');
    await expect(q).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/hotel eligibility is unconfirmed/)).toBeVisible();
  });

  test('ends with CTAs to the tool and the study request', async ({ page }) => {
    await page.goto('/services');
    await expect(page.getByRole('link', { name: 'Screen my hotel' })).toHaveAttribute('href', /^\/tool\?/);
    await expect(page.getByRole('link', { name: 'Request a study' }).last()).toHaveAttribute('href', '/request-study');
  });
});
