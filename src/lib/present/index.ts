// Presentation helpers for the sizing engine (Contract 1). The UI, the share page and the PDF
// never format engine numbers themselves: they call these. Pure functions, no React, en-GB number format.
//
// Numbers are shown exactly as the engine rounds them (e.g. capex 2,360,000 -> "2.36 M TND"); these helpers
// never add precision and never round further.

import type { PlantOption, Scenario, ScenarioResult, Verdict, Warning } from '@/lib/engine';

const LOCALE = 'en-GB';
const nf = (maxFractionDigits: number) => new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maxFractionDigits });
const int = nf(0);
const upTo2 = nf(2);
const upTo1 = nf(1);

/** Paybacks above this read "over 30 years": longer than the plant's life, so the exact figure means nothing. */
export const MAX_SHOWN_PAYBACK_YEARS = 30;

// ---------------------------------------------------------------------------------------------------------------
// Single values
// ---------------------------------------------------------------------------------------------------------------

type MoneyParts = { value: string; scale: '' | 'k' | ' M' };

function moneyParts(n: number): MoneyParts {
  const k = Math.round(n / 1000);
  if (Math.abs(k) >= 1000) return { value: upTo2.format(n / 1_000_000), scale: ' M' };
  if (Math.abs(n) >= 1000) return { value: int.format(k), scale: 'k' };
  return { value: int.format(n), scale: '' };
}

/** 200000 -> "200k TND", 1750000 -> "1.75 M TND", 0 -> "0 TND", -15000 -> "-15k TND". */
export function formatTnd(n: number): string {
  const { value, scale } = moneyParts(n);
  return `${value}${scale} TND`;
}

const yearsNumber = (n: number): string => (n > MAX_SHOWN_PAYBACK_YEARS ? `over ${MAX_SHOWN_PAYBACK_YEARS}` : upTo1.format(n));

/** 9 -> "9 years", 21.5 -> "21.5 years", 1 -> "1 year", 99 -> "over 30 years". */
export function formatYears(n: number): string {
  return `${yearsNumber(n)} ${n === 1 ? 'year' : 'years'}`;
}

export type PowerUnit = 'kW' | 'kWe' | 'kWc';

/** 200 -> "200 kW"; formatKw(64, 'kWc') -> "64 kWc". */
export function formatKw(n: number, unit: PowerUnit = 'kW'): string {
  return `${int.format(n)} ${unit}`;
}

/** CO2 avoided: 210 -> "210 t CO2/yr". */
export function formatTonnes(n: number): string {
  return `${int.format(n)} t CO2/yr`;
}

/** Fraction to percent: 0.16 -> "16%". */
export function formatPercent(n: number): string {
  return `${int.format(n * 100)}%`;
}

/** Full-load hours: 5700 -> "5,700 h/yr". */
export function formatHours(n: number): string {
  return `${int.format(n)} h/yr`;
}

// ---------------------------------------------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------------------------------------------

export type RangeKey = keyof ScenarioResult;

type Scenarios = Record<Scenario, ScenarioResult>;

/** Same names as the scaffold's simple helpers, so existing calls keep working. */
export type RangeKind = 'tnd' | 'years' | 'kw' | 'tonnes' | 'percent' | 'hours';

/** How each engine output is formatted. */
export const RANGE_KIND: Record<RangeKey, RangeKind> = {
  capexTnd: 'tnd',
  annualSavingsTnd: 'tnd',
  demandChargeSavingTnd: 'tnd',
  co2AvoidedTonnes: 'tonnes',
  paybackYears: 'years',
  paybackYearsWithFte: 'years',
  fullLoadHours: 'hours',
  primaryEnergySaving: 'percent',
  peakGridReliefKw: 'kw',
};

const FORMAT: Record<RangeKind, (n: number) => string> = {
  tnd: formatTnd,
  years: formatYears,
  kw: (n) => formatKw(n),
  tonnes: formatTonnes,
  percent: formatPercent,
  hours: formatHours,
};

/** Number and unit of each kind, so a range prints its unit once: "5 to 21.5 years". */
function split(kind: RangeKind, n: number): { num: string; unit: string } {
  switch (kind) {
    case 'tnd': {
      const { value, scale } = moneyParts(n);
      return { num: `${value}${scale}`, unit: 'TND' };
    }
    case 'years':
      return { num: yearsNumber(n), unit: 'years' };
    case 'kw':
      return { num: int.format(n), unit: 'kW' };
    case 'tonnes':
      return { num: int.format(n), unit: 't CO2/yr' };
    case 'percent':
      return { num: `${int.format(n * 100)}%`, unit: '' };
    case 'hours':
      return { num: int.format(n), unit: 'h/yr' };
  }
}

export type FormattedRange = {
  /** Each scenario on its own, with its unit: "5 years". */
  favourable: string;
  central: string;
  unfavourable: string;
  /** Raw engine values, for charts such as <RangeRail/>. */
  values: Record<Scenario, number>;
  /** Low to high, unit once, central marked: "5 to 21.5 years (9 central)". One value: "6,600 h/yr". */
  text: string;
  /** Which end of the low-to-high range is the favourable one. */
  favourableEnd: 'low' | 'high';
};

/**
 * Format one output of a plant option (or the result, or a scenarios record) across its three scenarios.
 * The text always reads low to high; for money and payback `favourableEnd` says which end is the good one
 * (low payback and capex, high savings).
 */
export function formatRange(
  source: Pick<PlantOption, 'scenarios'> | Scenarios,
  key: RangeKey,
  /** Optional: the kind is known from the key. Pass it only to override. */
  kind: RangeKind = RANGE_KIND[key],
): FormattedRange {
  const scenarios: Scenarios = 'scenarios' in source ? source.scenarios : source;
  const fmt = FORMAT[kind];
  const values: Record<Scenario, number> = {
    favourable: scenarios.favourable[key],
    central: scenarios.central[key],
    unfavourable: scenarios.unfavourable[key],
  };
  const lo = Math.min(values.favourable, values.unfavourable);
  const hi = Math.max(values.favourable, values.unfavourable);
  let text: string;
  if (lo === hi && values.central === lo) {
    text = fmt(lo);
  } else {
    const a = split(kind, lo);
    const b = split(kind, hi);
    const c = split(kind, values.central);
    const unit = b.unit ? ` ${b.unit}` : '';
    text = `${a.num} to ${b.num}${unit} (${c.num} central)`;
  }
  return {
    favourable: fmt(values.favourable),
    central: fmt(values.central),
    unfavourable: fmt(values.unfavourable),
    values,
    text,
    favourableEnd: values.favourable <= values.unfavourable ? 'low' : 'high',
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Verdicts and warnings (i18n: messages/en/engine.json, next-intl namespace "engine")
// ---------------------------------------------------------------------------------------------------------------

export type VerdictTone = 'good' | 'maybe' | 'weak';

const TONE: Record<Verdict, VerdictTone> = {
  'good fit': 'good',
  'possible fit, needs a study': 'maybe',
  'weak fit': 'weak',
};

const VERDICT_KEY: Record<Verdict, string> = {
  'good fit': 'verdicts.goodFit',
  'possible fit, needs a study': 'verdicts.possibleFit',
  'weak fit': 'verdicts.weakFit',
};

/** Colour of the verdict pill: --good, --maybe or --weak (Contract 2). */
export function verdictTone(verdict: Verdict): VerdictTone {
  return TONE[verdict];
}

/** i18n key in the "engine" namespace: useTranslations('engine')(verdictKey(v)). */
export function verdictKey(verdict: Verdict): string {
  return VERDICT_KEY[verdict];
}

export type Message = { key: string; values: Record<string, number> };

/** i18n key in the "engine" namespace plus ICU values for one warning. */
export function warningMessage(w: Warning): Message {
  return { key: `warnings.${w.code}`, values: { ...w.params } };
}

/** A next-intl `t` (or any translator with the same shape) for the "engine" namespace. */
export type Translate = (key: string, values?: Record<string, number>) => string;

/** The warning as text: warningText(w, useTranslations('engine')). Never render a warning any other way. */
export function warningText(w: Warning, t: Translate): string {
  const { key, values } = warningMessage(w);
  return t(key, values);
}

// ---------------------------------------------------------------------------------------------------------------
// Assumptions (Sources page, PDF report)
// ---------------------------------------------------------------------------------------------------------------

const precise = nf(4);

/**
 * An assumption value as written in the engine, at its own precision: fractions as percent (0.38 -> "38%"),
 * yes/no flags as the given words, everything else as a number ("7,000", "0.068").
 */
export function formatAssumptionValue(value: number, unit: string, words: { yes: string; no: string }): string {
  if (unit === 'fraction') return `${precise.format(Math.round(value * 1000) / 10)}%`;
  if (unit === 'yes=1') return value ? words.yes : words.no;
  return precise.format(value);
}

/** The unit printed after an assumption value: none for fractions (already a percent), flags and "-". */
export function assumptionUnit(unit: string): string {
  return unit === 'fraction' || unit === 'yes=1' || unit === '-' ? '' : unit;
}

export type SourcePart = { kind: 'text'; text: string } | { kind: 'link'; href: string; label: string };

const SOURCE_URL = /https?:\/\/[^\s)]*[^\s).,;:]/g;

/** An engine source note split into text and links; each link is labelled with its host ("energy.gov"). */
export function sourceParts(source: string): SourcePart[] {
  const parts: SourcePart[] = [];
  let last = 0;
  for (const match of source.matchAll(SOURCE_URL)) {
    const at = match.index;
    if (at > last) parts.push({ kind: 'text', text: source.slice(last, at) });
    parts.push({ kind: 'link', href: match[0], label: new URL(match[0]).hostname.replace(/^www\./, '') });
    last = at + match[0].length;
  }
  if (last < source.length) parts.push({ kind: 'text', text: source.slice(last) });
  return parts;
}
