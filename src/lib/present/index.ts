// TEMPORARY (until #3/#4 merges): minimal stand-in for Hamza's presentation helpers (Contract 1,
// src/lib/present). Same names, so the tool keeps working when the real module lands.
import type { Scenario, ScenarioResult, Verdict } from "@/lib/engine";

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatNumber(value: number): string {
  return grouped.format(value);
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
    unit,
    text: `${low}–${high}${unit ? ` ${unit}` : ""}`,
  };
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
