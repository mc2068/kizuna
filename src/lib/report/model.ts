// The [PRODUCT NAME] PDF report as plain data (#23): every string and every chart series the PDF shows, built
// from a STORED snapshot (project.results), never recomputed. Report.tsx only lays this out, so this file is
// where "the PDF shows the same numbers as the web page" is tested: every number goes through @/lib/present.

import { createTranslator } from 'next-intl';
import { siteConfig } from '@/config/site';
import { LIMITS, METHOD_STEPS } from '@/content/method';
import { ENGINE_VERSION, isStale, type HourRow, type PlantOption, type SizingInput, type SizingResult } from '@/lib/engine';
import {
  assumptionUnit,
  formatAssumptionValue,
  formatRange,
  formatYears,
  sourceParts,
  verdictKey,
  verdictTone,
  warningText,
  type RangeKey,
  type SourcePart,
  type VerdictTone,
} from '@/lib/present';
import engineMessages from '../../../messages/en/engine.json';

/** What a saved project or a shared link gives the report. */
export type ReportData = {
  hotelName: string;
  inputs: SizingInput;
  results: SizingResult;
  engineVersion: string;
  /** ISO date of the calculation (project.createdAt). */
  createdAt: string;
};

export type Translate = (key: string, values?: Record<string, string | number | boolean>) => string;

/** Translator for the "engine" namespace. English only at launch; French adds messages/fr/engine.json. */
export function reportTranslator(): Translate {
  const t = createTranslator({ locale: siteConfig.locale, messages: { engine: engineMessages }, namespace: 'engine' });
  return (key, values) => (t as unknown as (k: string, v?: Record<string, unknown>) => string)(key, values);
}

export const COLORS = {
  ink: '#1d1d1f',
  muted: '#6e6e73',
  faint: '#86868b',
  line: '#d2d2d7',
  tile: '#f5f5f7',
  link: '#0066cc',
  elec: '#f28c28',
  heat: '#e5484d',
  cool: '#0b8fc7',
  good: '#1f8a4c',
  maybe: '#b26b00',
  weak: '#8e8e93',
} as const;

export type ChartKind = 'electricity' | 'heat' | 'cooling';

export type ChartSeries = { kind: ChartKind; title: string; color: string; max: number; need: number[]; supplied: number[] };

export type ReportModel = {
  productName: string;
  footer: string;
  pageLabel: (page: number, total: number) => string;
  cover: {
    title: string;
    subtitle: string;
    preparedFor: string;
    hotelName: string;
    context: string;
    tariff: string;
    calculated: string;
    verdictLabel: string;
    verdict: string;
    tone: VerdictTone;
    plantLabel: string;
    plant: string;
    paybackLabel: string;
    payback: string;
    readAs: string;
  };
  results: {
    title: string;
    intro: string;
    columns: { title: string; plant: string; verdict: string; tone: VerdictTone }[];
    rows: { key: RangeKey; label: string; cells: string[] }[];
    warningsTitle: string;
    warnings: string[];
    fasterOption: string | null;
    notes: string[];
  };
  hourly: {
    title: string;
    intro: string;
    legend: { need: string; supplied: string };
    seasons: { title: string; charts: ChartSeries[] }[];
  };
  assumptions: {
    title: string;
    intro: string;
    headers: { name: string; favourable: string; central: string; unfavourable: string; source: string };
    rows: { name: string; favourable: string; central: string; unfavourable: string; unit: string; source: SourcePart[] }[];
  };
  method: {
    title: string;
    steps: { title: string; body: string }[];
    limitsTitle: string;
    limits: { title: string; detail: string }[];
    engineVersion: string;
    stale: string | null;
    disclaimer: string;
  };
};

/** Rows of the results table, in reading order. */
export const RESULT_ROWS: RangeKey[] = [
  'capexTnd',
  'annualSavingsTnd',
  'paybackYears',
  'paybackYearsWithFte',
  'co2AvoidedTonnes',
  'fullLoadHours',
  'primaryEnergySaving',
  'peakGridReliefKw',
];

const sameOption = (a: PlantOption | null, b: PlantOption | null) =>
  !!a && !!b && a.engineKwe === b.engineKwe && a.chillerKwc === b.chillerKwc;

/** Round a chart's top up to 1, 2 or 5 x 10^n so the axis reads cleanly. */
export function chartMax(values: number[]): number {
  const top = Math.max(1, ...values);
  const magnitude = 10 ** Math.floor(Math.log10(top));
  return ([1, 2, 5, 10].map((m) => m * magnitude).find((m) => m >= top) as number);
}

function charts(rows: { summer: HourRow[]; winter: HourRow[] }, t: Translate) {
  const series = (r: HourRow[]) => ({
    electricity: { need: r.map((h) => h.engineElec + h.gridImport), supplied: r.map((h) => h.engineElec) },
    // Recovered heat goes to hot water and the pool first, the rest to the chiller (engine model).
    heat: { need: r.map((h) => h.heatDemand), supplied: r.map((h) => Math.min(h.heatDemand, h.recoveredHeat)) },
    cooling: { need: r.map((h) => h.coolDemand), supplied: r.map((h) => h.chillerCool) },
  });
  const s = { summer: series(rows.summer), winter: series(rows.winter) };
  const kinds: { kind: ChartKind; color: string }[] = [
    { kind: 'electricity', color: COLORS.elec },
    { kind: 'heat', color: COLORS.heat },
    { kind: 'cooling', color: COLORS.cool },
  ];
  // One scale per energy type across both days, so summer and winter compare at a glance.
  const max = Object.fromEntries(
    kinds.map(({ kind }) => [kind, chartMax([...s.summer[kind].need, ...s.winter[kind].need])]),
  ) as Record<ChartKind, number>;
  return (['summer', 'winter'] as const).map((season) => ({
    title: t(`report.hourly.${season}`),
    charts: kinds.map(({ kind, color }) => ({ kind, color, title: t(`report.hourly.${kind}`), max: max[kind], ...s[season][kind] })),
  }));
}

export function buildReport(data: ReportData, t: Translate = reportTranslator()): ReportModel {
  const { results: r, inputs } = data;
  const trigen = r.options.trigeneration;
  const best = r.options.best;
  const columns: { title: string; option: PlantOption }[] = [];
  if (trigen) columns.push({ title: t('report.results.trigeneration'), option: trigen });
  if (best && !sameOption(best, trigen)) columns.push({ title: t('report.results.chpOnly'), option: best });
  if (columns.length === 0) columns.push({ title: t('report.results.trigeneration'), option: r });

  const plantText = (o: PlantOption) =>
    o.chillerKwc > 0
      ? t('report.plant', { engineKwe: o.engineKwe, chillerKwc: o.chillerKwc })
      : t('report.plantNoChiller', { engineKwe: o.engineKwe });
  const verdict = (o: PlantOption) => t(verdictKey(o.verdict));

  const faster =
    trigen && best && !sameOption(best, trigen) && best.scenarios.central.paybackYears < trigen.scenarios.central.paybackYears
      ? t('report.results.fasterOption', { years: formatYears(best.scenarios.central.paybackYears) })
      : null;

  const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Africa/Tunis' }).format(new Date(data.createdAt));
  const words = { yes: t('report.assumptions.yes'), no: t('report.assumptions.no') };

  return {
    productName: siteConfig.name,
    footer: `${siteConfig.name} · ${data.hotelName}`,
    pageLabel: (page, total) => t('report.page', { page, total }),
    cover: {
      title: t('report.title'),
      subtitle: t('report.subtitle'),
      preparedFor: t('report.preparedFor'),
      hotelName: data.hotelName,
      context: t('report.context', { rooms: inputs.rooms, city: t(`report.cities.${inputs.city}`), pool: inputs.pool }),
      tariff: inputs.elecPrice == null ? t('report.tariff') : t('report.flatTariff', { price: inputs.elecPrice }),
      calculated: t('report.calculated', { date }),
      verdictLabel: t('report.verdict'),
      verdict: verdict(r),
      tone: verdictTone(r.verdict),
      plantLabel: t('report.headlinePlant'),
      plant: plantText(r),
      paybackLabel: t('report.headlinePayback'),
      payback: formatRange(r, 'paybackYears').text,
      readAs: t('report.readAs'),
    },
    results: {
      title: t('report.results.title'),
      intro: t('report.results.intro'),
      columns: columns.map(({ title, option }) => ({
        title,
        plant: plantText(option),
        verdict: verdict(option),
        tone: verdictTone(option.verdict),
      })),
      rows: RESULT_ROWS.map((key) => ({
        key,
        label: t(`report.results.metrics.${key}`),
        cells: columns.map(({ option }) => formatRange(option, key).text),
      })),
      warningsTitle: t('report.results.warnings'),
      warnings: r.warnings.map((w) => warningText(w, t)),
      fasterOption: faster,
      notes: [t('report.readAs'), t('report.results.peakNote')],
    },
    hourly: {
      title: t('report.hourly.title'),
      intro: t('report.hourly.intro'),
      legend: { need: t('report.hourly.need'), supplied: t('report.hourly.supplied') },
      seasons: charts(r.hourly, t),
    },
    assumptions: {
      title: t('report.assumptions.title'),
      intro: t('report.assumptions.intro'),
      headers: {
        name: t('report.assumptions.name'),
        favourable: t('report.assumptions.favourable'),
        central: t('report.assumptions.central'),
        unfavourable: t('report.assumptions.unfavourable'),
        source: t('report.assumptions.source'),
      },
      rows: r.assumptions.map((a) => ({
        name: a.name,
        favourable: formatAssumptionValue(a.favourable, a.unit, words),
        central: formatAssumptionValue(a.central, a.unit, words),
        unfavourable: formatAssumptionValue(a.unfavourable, a.unit, words),
        unit: assumptionUnit(a.unit),
        source: sourceParts(a.source),
      })),
    },
    method: {
      title: t('report.method.title'),
      steps: METHOD_STEPS.map(({ title, body }) => ({ title, body })),
      limitsTitle: t('report.method.limits'),
      limits: LIMITS.map(({ title, detail }) => ({ title, detail })),
      engineVersion: t('report.method.engineVersion', { version: data.engineVersion }),
      stale: isStale(data) ? t('report.method.stale', { stored: data.engineVersion, current: ENGINE_VERSION }) : null,
      disclaimer: t('report.method.disclaimer'),
    },
  };
}
