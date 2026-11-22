// Role 3: helpers for the Sources page. Statuses come from method.ts (ASSUMPTIONS), set by Hamza from
// docs/research/assumptions-audit.md.
import type { AssumptionStatus } from '@/content/method';

/** Badge colour per assumption status. */
export const STATUS_BADGE: Record<AssumptionStatus, 'good' | 'maybe' | 'weak'> = {
  sourced: 'good',
  estimated: 'maybe',
  unconfirmed: 'weak',
};

/** Split an engine source note into readable text and the https links it contains. */
export function splitSource(source: string): { text: string; urls: string[] } {
  const urls = Array.from(source.matchAll(/https?:\/\/[^\s)]+/g), (m) => m[0].replace(/[.,;]+$/, ''));
  const text = source
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/\(\s*via\s*\)/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([.,;)])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { text, urls: Array.from(new Set(urls)) };
}

/** Values as the engine writes them, up to three decimals, en-GB. */
export function assumptionValue(v: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 }).format(v);
}
