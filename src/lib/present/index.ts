// Presentation helpers (Contract 1). SIMPLE VERSIONS from the scaffold (#3);
// Hamza replaces them in #12. The UI never formats engine numbers itself.
import type { PlantOption, ScenarioResult, Verdict } from '@/lib/engine';

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

const UNIT: Record<Exclude<RangeKind, 'tnd'>, (n: number) => string> = {
  years: (n) => `${number.format(n)} years`,
  tonnes: (n) => `${number.format(n)} t/yr`,
  kw: (n) => `${number.format(n)} kW`,
  hours: (n) => `${number.format(n)} h/yr`,
  percent: (n) => `${number.format(Math.round(n * 100))}%`,
};

export type FormattedRange = { favourable: string; central: string; unfavourable: string; text: string };

/** Favourable end first, then unfavourable, with the central case marked. */
export function formatRange(
  option: Pick<PlantOption, 'scenarios'>,
  key: keyof ScenarioResult,
  kind: RangeKind,
): FormattedRange {
  const { favourable, central, unfavourable } = option.scenarios;
  if (kind === 'tnd') {
    const [f, c, u] = [favourable[key], central[key], unfavourable[key]];
    return {
      favourable: formatTnd(f),
      central: formatTnd(c),
      unfavourable: formatTnd(u),
      text: `${tndValue(f)} to ${formatTnd(u)} (${formatTnd(c)} central)`,
    };
  }
  const fmt = UNIT[kind];
  const out = { favourable: fmt(favourable[key]), central: fmt(central[key]), unfavourable: fmt(unfavourable[key]) };
  const bareF = number.format(kind === 'percent' ? Math.round(favourable[key] * 100) : favourable[key]);
  const bareC = number.format(kind === 'percent' ? Math.round(central[key] * 100) : central[key]);
  return { ...out, text: `${bareF} to ${out.unfavourable} (${bareC} central)` };
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
