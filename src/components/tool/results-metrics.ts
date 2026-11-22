// The result ranges the tool shows, in display order, and the axes they share.
// Strings live under tool.results.metrics.<id> in messages/en/tool.json.
import type { PlantOption, ScenarioResult } from "@/lib/engine";
import { PAYBACK_RAIL_CAP_YEARS, niceScale, type Scale } from "@/lib/present";

export type MetricId = "payback" | "capex" | "savings" | "co2" | "flh" | "pes" | "peak";

export type Metric = { id: MetricId; key: keyof ScenarioResult; cap?: number };

export const METRICS: readonly Metric[] = [
  { id: "payback", key: "paybackYears", cap: PAYBACK_RAIL_CAP_YEARS },
  { id: "capex", key: "capexTnd" },
  { id: "savings", key: "annualSavingsTnd" },
  { id: "co2", key: "co2AvoidedTonnes" },
  { id: "flh", key: "fullLoadHours" },
  { id: "pes", key: "primaryEnergySaving" },
  { id: "peak", key: "peakGridReliefKw" },
];

/** Money and CO2 ranges: the ones the side-by-side comparison draws as rails. */
export const COMPARE_RAILS: readonly MetricId[] = ["payback", "capex", "savings", "co2"];

export function metric(id: MetricId): Metric {
  return METRICS.find((m) => m.id === id)!;
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
