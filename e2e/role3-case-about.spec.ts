// Role 3 (Gaith): Djerba case study and About (#17).
import { expect, test } from '@playwright/test';

test.describe('Djerba case study', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/case-study/djerba');
  });

  test('introduces the demo hotel and its verdict', async ({ page }) => {
    await expect(page.locator('[data-case-facts]')).toHaveText('300 rooms · Djerba · heated pool · 4-star beach hotel');
    const verdict = page.locator('[data-case-verdict]');
    await expect(verdict).toContainText('Possible fit');
    await expect(verdict).toContainText('200 kWe engine + 64 kWc absorption chiller');
    await expect(verdict).toContainText('5 to 21.5 years, central 9 years');
  });

  test('shows a summer and a winter day with consistent winter figures', async ({ page }) => {
    await expect(page.locator('[data-day]')).toHaveCount(2);
    const note = await page.locator('[data-day="winter"] figcaption').textContent();
    const [, low, high] = note!.match(/only (\d+) to (\d+) kW/)!;
    await expect(page.getByText(`needs only ${low} to ${high} kW of electricity`)).toBeVisible();
    await expect(page.getByText(/runs about 5,700\./)).toBeVisible();
  });

  test('compares trigeneration with CHP only, both from the engine', async ({ page }) => {
    await expect(page.locator('[data-option="trigeneration"]')).toContainText('200 kWe + 64 kWc');
    await expect(page.locator('[data-option="chp"]')).toContainText('100 kWe, no chiller');
    await expect(page.locator('[data-option="chp"]')).toContainText('4.5 to 15.5 years');
  });

  test('has range rails, the tornado and CTAs that prefill the study', async ({ page }) => {
    await expect(page.locator('[data-range-rail]')).toHaveCount(4);
    await expect(page.getByRole('heading', { name: 'What moves the payback.' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Request a study' }).last()).toHaveAttribute(
      'href',
      '/request-study?rooms=300&city=djerba&pool=1',
    );
  });
});

test.describe('about', () => {
  test('shows the four team members with initials until photos arrive', async ({ page }) => {
    await page.goto('/about');
    const members = page.locator('[data-member]');
    await expect(members).toHaveCount(4);
    for (const [id, name] of [['mohamed', 'Mohamed'], ['hamza', 'Hamza'], ['ahmed', 'Ahmed'], ['gaith', 'Gaith']]) {
      await expect(page.locator(`[data-member="${id}"] h3`)).toHaveText(name);
    }
    await expect(page.getByRole('main').getByRole('link', { name: 'Request a study' }).last()).toHaveAttribute('href', '/request-study');
    await expect(page.getByRole('link', { name: /^Email / })).toHaveAttribute('href', /^mailto:/);
  });
});
