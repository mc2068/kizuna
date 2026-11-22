import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/** axe WCAG 2.1 A/AA violations with serious or critical impact, as short readable lines. */
export async function seriousA11yViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}
