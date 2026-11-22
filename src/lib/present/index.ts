// Contract 1 presentation helpers (Role 1, Hamza). STAND-IN with simple versions until #12 lands.
import type { Scenario, ScenarioResult, Verdict } from '@/lib/engine';

const nf = (digits = 0) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });

/** 1234567 -> "1.23M", 200000 -> "200k", 950 -> "950". */
export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1e6) return `${nf(2).format(n / 1e6)}M`;
  if (Math.abs(n) >= 1e4) return `${nf(0).format(Math.round(n / 1000))}k`;
  return nf(1).format(n);
}

export function formatNumber(n: number, digits = 1): string {
  return nf(digits).format(n);
}

export function formatTnd(n: number): string {
  return `${formatCompact(n)} TND`;
}

type RangeKey = keyof ScenarioResult;

/** Low and high ends of a range, ordered, plus the central value. */
export function rangeOf(scenarios: Record<Scenario, ScenarioResult>, key: RangeKey) {
  const a = scenarios.favourable[key];
  const b = scenarios.unfavourable[key];
  return { low: Math.min(a, b), central: scenarios.central[key], high: Math.max(a, b) };
}

/** "5–21.5 years", "110k–260k TND", "70–260 t". */
export function formatRange(scenarios: Record<Scenario, ScenarioResult>, key: RangeKey, unit = ''): string {
  const { low, high } = rangeOf(scenarios, key);
  const money = unit === 'TND';
  const f = (v: number) => (money ? formatCompact(v) : formatNumber(v));
  return `${f(low)}–${f(high)}${unit ? ` ${unit}` : ''}`;
}

export function formatValue(v: number, unit = ''): string {
  const s = unit === 'TND' ? formatCompact(v) : formatNumber(v);
  return unit ? `${s} ${unit}` : s;
}

export type VerdictTone = 'good' | 'maybe' | 'weak';
export function verdictTone(verdict: Verdict): VerdictTone {
  if (verdict === 'good fit') return 'good';
  if (verdict === 'possible fit, needs a study') return 'maybe';
  return 'weak';
}

export function verdictLabel(verdict: Verdict): string {
  return { good: 'Good fit', maybe: 'Possible fit', weak: 'Weak fit' }[verdictTone(verdict)];
}

export function warningText(w: string): string {
  return w;
}
