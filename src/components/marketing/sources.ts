import type { Assumption } from '@/lib/engine';

export type AssumptionStatus = 'sourced' | 'estimated';

/** The engine marks its own reasoning with "ESTIMATE" in the source note. */
export function assumptionStatus(a: Pick<Assumption, 'source'>): AssumptionStatus {
  return /\bESTIMATE\b/.test(a.source) ? 'estimated' : 'sourced';
}

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

/** Engine values are fractions for efficiencies and shares: show them as written in the engine. */
export function assumptionValue(v: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(v);
}
