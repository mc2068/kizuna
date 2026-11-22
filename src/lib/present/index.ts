// TEMPORARY (until #3/#4 merges): minimal stand-in for Hamza's presentation helpers (Contract 1,
// src/lib/present). Same names, so the tool keeps working when the real module lands.
import type { Scenario, ScenarioResult, Verdict } from "@/lib/engine";

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatNumber(value: number): string {
  // Values that round to zero print as "0", never "-0".
  return grouped.format(Math.abs(value) < 0.005 ? 0 : value);
}

/** 200000 -> "200k", 1750000 -> "1.75M" (TND, before VAT). */
export function formatTnd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${grouped.format(Math.round(value / 10_000) / 100)}M`;
  if (abs >= 1_000) return `${grouped.format(Math.round(value / 1_000))}k`;
  return grouped.format(value);
}

const MONEY_KEYS: ReadonlyArray<keyof ScenarioResult> = ["capexTnd", "annualSavingsTnd", "demandChargeSavingTnd"];

export function formatValue(key: keyof ScenarioResult, value: number): string {
  if (MONEY_KEYS.includes(key)) return formatTnd(value);
  if (key === "primaryEnergySaving") return `${Math.round(value * 100)}%`;
  return formatNumber(value);
}

export type FormattedRange = {
  /** Lower and upper ends across the favourable and unfavourable scenarios, and the central value. */
  low: string;
  central: string;
  high: string;
  lowValue: number;
  centralValue: number;
  highValue: number;
  /** The same ends, by scenario (#10's range rails label each end). */
  favourable: string;
  unfavourable: string;
  favourableValue: number;
  unfavourableValue: number;
  unit: string;
  /** e.g. "5–21.5 yrs" */
  text: string;
};

export function formatRange(
  scenarios: Record<Scenario, ScenarioResult>,
  key: keyof ScenarioResult,
  unit = "",
): FormattedRange {
  const a = scenarios.favourable[key];
  const b = scenarios.unfavourable[key];
  const lowValue = Math.min(a, b);
  const highValue = Math.max(a, b);
  const centralValue = scenarios.central[key];
  const low = formatValue(key, lowValue);
  const high = formatValue(key, highValue);
  return {
    low,
    high,
    central: formatValue(key, centralValue),
    lowValue,
    highValue,
    centralValue,
    favourable: formatValue(key, a),
    unfavourable: formatValue(key, b),
    favourableValue: a,
    unfavourableValue: b,
    unit,
    text: low === high ? `${low}${unit ? ` ${unit}` : ""}` : `${low}–${high}${unit ? ` ${unit}` : ""}`,
  };
}

// ---------------------------------------------------------------------------------------------
// TEMPORARY (until Hamza's #12 helpers merge): extra helpers added by #10 for the full results.
// ---------------------------------------------------------------------------------------------

export type Scale = { max: number; ticks: number[] };

/**
 * Axis for a range rail: 0 to a round number at or above `value`, with 3 to 5 round ticks.
 * `cap` stops one extreme value (e.g. a 64-year payback) from squashing the rest of the rail.
 */
export function niceScale(value: number, cap = Infinity): Scale {
  const target = Math.min(Math.max(value, Number.EPSILON), cap);
  const magnitude = 10 ** Math.floor(Math.log10(target));
  for (const [m, step] of [
    [1, 0.25],
    [1.5, 0.5],
    [2, 0.5],
    [2.5, 0.5],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 2],
    [8, 2],
    [10, 2.5],
  ] as const) {
    const max = m * magnitude;
    if (max >= target - 1e-9) {
      const s = step * magnitude;
      const ticks: number[] = [];
      for (let v = 0; v <= max + 1e-9; v += s) ticks.push(Math.round(v / s) * s);
      return { max, ticks };
    }
  }
  return { max: target, ticks: [0, target] };
}

/** Payback rails stop at 30 years: beyond that the plant is out of the picture anyway. */
export const PAYBACK_RAIL_CAP_YEARS = 30;

const precise = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

/** A number from the assumptions table, at full precision: fractions as %, yes/no flags as words. */
export function formatAssumptionValue(value: number, unit: string, words: { yes: string; no: string }): string {
  if (unit === "fraction") return `${precise.format(Math.round(value * 1000) / 10)}%`;
  if (unit === "yes=1") return value ? words.yes : words.no;
  return precise.format(value);
}

/** The unit shown next to an assumption: none for fractions (already %) and flags. */
export function assumptionUnit(unit: string): string {
  return unit === "fraction" || unit === "yes=1" || unit === "-" ? "" : unit;
}

export type SourcePart = { kind: "text"; text: string } | { kind: "link"; href: string; label: string };

export function hasSourceLink(source: string): boolean {
  return sourceParts(source).some((p) => p.kind === "link");
}

const URL_PATTERN = /https?:\/\/[^\s)]+[^\s).,;]/g;

/** Splits an engine source note into text and links; a link is labelled with its host (e.g. "energy.gov"). */
export function sourceParts(source: string): SourcePart[] {
  const parts: SourcePart[] = [];
  let last = 0;
  for (const match of source.matchAll(URL_PATTERN)) {
    const at = match.index ?? 0;
    if (at > last) parts.push({ kind: "text", text: source.slice(last, at) });
    let label = match[0];
    try {
      label = new URL(match[0]).hostname.replace(/^www\./, "");
    } catch {
      // keep the raw URL as the label
    }
    parts.push({ kind: "link", href: match[0], label });
    last = at + match[0].length;
  }
  if (last < source.length) parts.push({ kind: "text", text: source.slice(last) });
  return parts;
}

export type VerdictTone = "good" | "maybe" | "weak";

export function verdictTone(verdict: Verdict): VerdictTone {
  if (verdict === "good fit") return "good";
  if (verdict === "possible fit, needs a study") return "maybe";
  return "weak";
}

export function warningText(warning: string): string {
  return warning;
}
