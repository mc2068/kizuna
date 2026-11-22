// The result ranges the tool shows, in display order, and the axes their rails share.
// Strings live under tool.results.metrics.<id> in messages/en/tool.json; numbers come from @/lib/present.
import type { PlantOption, ScenarioResult } from '@/lib/engine';
import { MAX_SHOWN_PAYBACK_YEARS } from '@/lib/present';

export type MetricId = 'payback' | 'capex' | 'savings' | 'co2' | 'flh' | 'pes' | 'peak';

export type Metric = { id: MetricId; key: keyof ScenarioResult; cap?: number };

export const METRICS: readonly Metric[] = [
  { id: 'payback', key: 'paybackYears', cap: MAX_SHOWN_PAYBACK_YEARS },
  { id: 'capex', key: 'capexTnd' },
  { id: 'savings', key: 'annualSavingsTnd' },
  { id: 'co2', key: 'co2AvoidedTonnes' },
  { id: 'flh', key: 'fullLoadHours' },
  { id: 'pes', key: 'primaryEnergySaving' },
  { id: 'peak', key: 'peakGridReliefKw' },
];

/** Money and CO2 ranges: the ones the side-by-side comparison draws as rails. */
export const COMPARE_RAILS: readonly MetricId[] = ['payback', 'capex', 'savings', 'co2'];

export function metric(id: MetricId): Metric {
  return METRICS.find((m) => m.id === id)!;
}

/** Rail axis: 0 to `max`. `capped` is true when a value runs past it (e.g. a 64-year payback). */
export type Scale = { max: number };

const NICE_STEPS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] as const;

/** 0 to a round number at or above `value` (and at most `cap`), so rails read like a chart axis. */
export function niceScale(value: number, cap = Infinity): Scale {
  const target = Math.min(Math.max(value, Number.EPSILON), cap);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const step = NICE_STEPS.find((m) => m * magnitude >= target - 1e-9) ?? 10;
  return { max: Math.min(step * magnitude, cap) };
}

/** One axis per metric, wide enough for every option shown, so rails compare at a glance. */
export function scalesFor(options: PlantOption[]): Record<MetricId, Scale> {
  return Object.fromEntries(
    METRICS.map((m) => {
      const high = Math.max(
        ...options.flatMap((o) => [o.scenarios.favourable[m.key], o.scenarios.central[m.key], o.scenarios.unfavourable[m.key]]),
      );
      return [m.id, niceScale(high, m.cap)];
    }),
  ) as Record<MetricId, Scale>;
}

export function samePlant(a: PlantOption, b: PlantOption): boolean {
  return a.engineKwe === b.engineKwe && a.chillerKwc === b.chillerKwc;
}

/**
 * The faster option to show beside the trigeneration one, or null: only when the engine found a
 * different plant that pays back sooner in the central case.
 */
export function fasterOption(options: { best: PlantOption | null; trigeneration: PlantOption | null }): PlantOption | null {
  const { best, trigeneration } = options;
  if (!best || !trigeneration || samePlant(best, trigeneration)) return null;
  return best.scenarios.central.paybackYears < trigeneration.scenarios.central.paybackYears ? best : null;
}

export type SourcePart = { kind: 'text'; text: string } | { kind: 'link'; href: string; label: string };

const URL_PATTERN = /https?:\/\/[^\s)]+[^\s).,;]/g;

/** Splits an engine source note into text and links; a link is labelled with its host (e.g. "energy.gov"). */
export function sourceParts(source: string): SourcePart[] {
  const parts: SourcePart[] = [];
  let last = 0;
  for (const match of source.matchAll(URL_PATTERN)) {
    const at = match.index ?? 0;
    if (at > last) parts.push({ kind: 'text', text: source.slice(last, at) });
    let label = match[0];
    try {
      label = new URL(match[0]).hostname.replace(/^www\./, '');
    } catch {
      // keep the raw URL as the label
    }
    parts.push({ kind: 'link', href: match[0], label });
    last = at + match[0].length;
  }
  if (last < source.length) parts.push({ kind: 'text', text: source.slice(last) });
  return parts;
}
