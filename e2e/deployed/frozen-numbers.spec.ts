// The frozen Djerba numbers (docs/team/README.md, "Frozen numbers") read the same on every page that
// shows them, on the deployed build. Each page formats them its own way; the strings below are what
// src/lib/present prints for engine v2's demo hotel (300 rooms, Djerba, pool).
import { expect, test } from '@playwright/test';

const PAGES: { path: string; texts: string[] }[] = [
  {
    path: '/',
    texts: ['200 kWe engine + 64 kWc chiller', '5 to 21.5 years', '1.75 M TND', '200k TND', '70 to 260 t CO2/yr', 'Possible fit'],
  },
  {
    path: '/tool',
    texts: [
      'Possible fit, needs a study',
      '200 kWe engine',
      '64 kWc absorption chiller',
      '5 to 21.5 years (9 central)',
      '1.24 M to 2.36 M TND (1.75 M central)',
      '110k to 260k TND (200k central)',
      '70 to 260 t CO2/yr (210 central)',
      '4,900 to 6,100 h/yr (5,700 central)',
      '220 kW',
    ],
  },
  {
    path: '/case-study/djerba',
    texts: ['200 kWe engine + 64 kWc absorption chiller', 'Payback 5 to 21.5 years, central 9 years', '1.75 M TND', '200k TND', '70 to 260 t CO2/yr', 'Possible fit'],
  },
  {
    path: '/request-study?rooms=300&city=djerba&pool=1',
    texts: ['200 kWe engine + 64 kWc chiller', 'Payback 5 to 21.5 years, central 9 years', 'Possible fit'],
  },
];

for (const { path, texts } of PAGES) {
  test(`${path} shows the frozen Djerba numbers`, async ({ page }) => {
    await page.goto(path);
    const main = page.locator('main');
    for (const text of texts) await expect(main, text).toContainText(text);
  });
}

test('/sources states the verdict thresholds', async ({ page }) => {
  await page.goto('/sources');
  await expect(page.locator('main')).toContainText('possible fit that needs a study (10 years or less)');
});
