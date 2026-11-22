// Presentation helpers (Contract 1). SIMPLE VERSIONS from the scaffold (#3);
// Hamza replaces them in #12. The UI never formats engine numbers itself.
import type { PlantOption, Scenario, ScenarioResult, Verdict } from '@/lib/engine';

const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

function tndValue(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${number.format(n / 1_000_000)} M`;
  if (Math.abs(n) >= 1_000) return `${number.format(n / 1_000)}k`;
  return number.format(n);
}

export function formatTnd(n: number): string {
  return `${tndValue(n)} TND`;
}

export type RangeKind = 'tnd' | 'years' | 'tonnes' | 'kw' | 'hours' | 'percent';

/** How each kind shows a bare value, and the unit that follows it. */
const KIND: Record<RangeKind, { value: (n: number) => string; unit: string }> = {
  tnd: { value: tndValue, unit: ' TND' },
  years: { value: (n) => number.format(n), unit: ' years' },
  tonnes: { value: (n) => number.format(n), unit: ' t/yr' },
  kw: { value: (n) => number.format(n), unit: ' kW' },
  hours: { value: (n) => number.format(n), unit: ' h/yr' },
  percent: { value: (n) => number.format(Math.round(n * 100)), unit: '%' },
};

export type FormattedRange = { favourable: string; central: string; unfavourable: string; text: string };

type Scenarios = Record<Scenario, ScenarioResult>;

/**
 * Favourable end first, then unfavourable, with the central case marked:
 * "5 to 21.5 years (9 central)". Pass a plant option (or the result) or its scenarios.
 */
export function formatRange(
  source: Pick<PlantOption, 'scenarios'> | Scenarios,
  key: keyof ScenarioResult,
  kind: RangeKind,
): FormattedRange {
  const scenarios: Scenarios = 'scenarios' in source ? source.scenarios : source;
  const { value, unit } = KIND[kind];
  const bare = (s: Scenario) => value(scenarios[s][key]);
  const full = (s: Scenario) => bare(s) + unit;
  const central = kind === 'tnd' ? full('central') : bare('central');
  return {
    favourable: full('favourable'),
    central: full('central'),
    unfavourable: full('unfavourable'),
    text: `${bare('favourable')} to ${full('unfavourable')} (${central} central)`,
  };
}

export type VerdictTone = 'good' | 'maybe' | 'weak';

const TONE: Record<Verdict, VerdictTone> = {
  'good fit': 'good',
  'possible fit, needs a study': 'maybe',
  'weak fit': 'weak',
};

export function verdictTone(verdict: Verdict): VerdictTone {
  return TONE[verdict];
}

/** Engine warnings are plain English sentences today; #12 maps them to messages/en/engine.json. */
export function warningText(warning: string): string {
  return warning;
}
