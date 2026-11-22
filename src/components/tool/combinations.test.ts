// #27: every input combination the tool can be asked for, run through the real engine, and every value
// the tool renders checked: present, finite, formatted without NaN/undefined, or deliberately capped
// ("over 30 years"). 4 cities x pool on/off x 50, 100, 300, 800 rooms x STEG time-of-use and a flat price.
import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { CITIES, sizeHotel, type PlantOption, type SizingInput } from '@/lib/engine';
import { MAX_SHOWN_PAYBACK_YEARS, formatKw, formatRange, verdictTone, warningText } from '@/lib/present';
import engineMessages from '../../../messages/en/engine.json';
import toolMessages from '../../../messages/en/tool.json';
import { HOURLY_TABS, SEASONS, TABLE_COLUMNS, dayFigures, tabScale } from './hourly-data';
import { METRICS, fasterOption, scalesFor, sourceParts } from './results-metrics';
import { parseToolInputs, toSearchString } from './url-state';

const ROOMS = [50, 100, 300, 800];
const PRICES = [null, 0.296];

const COMBINATIONS: SizingInput[] = CITIES.flatMap((city) =>
  [true, false].flatMap((pool) =>
    ROOMS.flatMap((rooms) => PRICES.map((elecPrice) => ({ city, pool, rooms, elecPrice }))),
  ),
);

const tTool = createTranslator({ locale: 'en', messages: { tool: toolMessages }, namespace: 'tool' });
const tEngine = createTranslator({ locale: 'en', messages: { engine: engineMessages }, namespace: 'engine' });

/** A string the page shows: non-empty, and no sign of a missing or broken number. */
function expectText(s: string) {
  expect(s.trim()).not.toBe('');
  expect(s).not.toMatch(/NaN|Infinity|undefined|null|\{|\}/);
}

function expectFiniteNonNegative(n: number) {
  expect(Number.isFinite(n)).toBe(true);
  expect(n).toBeGreaterThanOrEqual(0);
}

function checkOption(option: PlantOption) {
  expect(option.engineKwe).toBeGreaterThan(0);
  expectFiniteNonNegative(option.chillerKwc);
  expectText(formatKw(option.engineKwe, 'kWe'));
  expectText(tTool(`verdict.${verdictTone(option.verdict)}`));

  for (const m of [...METRICS.map((x) => x.key), 'paybackYearsWithFte' as const]) {
    const range = formatRange(option, m);
    for (const v of Object.values(range.values)) expectFiniteNonNegative(v);
    for (const s of [range.favourable, range.central, range.unfavourable, range.text]) expectText(s);
  }
  // Paybacks past the plant's life are capped on screen, never printed as a raw 99.
  for (const key of ['paybackYears', 'paybackYearsWithFte'] as const) {
    const range = formatRange(option, key);
    for (const scenario of ['favourable', 'central', 'unfavourable'] as const) {
      if (range.values[scenario] > MAX_SHOWN_PAYBACK_YEARS) expect(range[scenario]).toBe('over 30 years');
    }
  }
  expectFiniteNonNegative(option.scenarios.favourable.demandChargeSavingTnd);
  for (const w of option.warnings) expectText(warningText(w, tEngine));
}

describe.each(COMBINATIONS)('$city, pool $pool, $rooms rooms, price $elecPrice', (input) => {
  const result = sizeHotel(input);

  it('renders the headline option: plant, verdict, every range and warning', () => {
    checkOption(result);
    // The verdict matches the central payback, as the copy under the badge says.
    const central = result.scenarios.central.paybackYears;
    const tone = verdictTone(result.verdict);
    if (tone === 'good') expect(central).toBeLessThanOrEqual(6);
    if (tone === 'maybe') expect(central).toBeLessThanOrEqual(10);
    if (tone === 'weak') expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('gives every rail a finite axis', () => {
    for (const scale of Object.values(scalesFor([result]))) {
      expect(Number.isFinite(scale.max)).toBe(true);
      expect(scale.max).toBeGreaterThan(0);
    }
  });

  it('shows the faster option only beside a real trigeneration option', () => {
    const faster = fasterOption(result.options);
    if (!faster) return;
    const trigeneration = result.options.trigeneration;
    expect(trigeneration).not.toBeNull();
    checkOption(faster);
    checkOption(trigeneration!);
    expect(faster.scenarios.central.paybackYears).toBeLessThan(trigeneration!.scenarios.central.paybackYears);
    for (const scale of Object.values(scalesFor([trigeneration!, faster]))) expect(scale.max).toBeGreaterThan(0);
  });

  it('fills the hourly dashboard: 24 finite hours a season, finite axes and shares', () => {
    for (const season of SEASONS) {
      const rows = result.hourly[season];
      expect(rows.map((r) => r.hour)).toEqual(Array.from({ length: 24 }, (_, h) => h));
      for (const r of rows) for (const key of TABLE_COLUMNS) expectFiniteNonNegative(r[key]);
      const f = dayFigures(rows);
      for (const share of [f.engineShare, f.heatShare, f.coolShare]) {
        expect(share).toBeGreaterThanOrEqual(0);
        expect(share).toBeLessThanOrEqual(1);
      }
    }
    for (const tab of HOURLY_TABS) {
      const { max, ticks } = tabScale(result.hourly, tab);
      expect(Number.isFinite(max)).toBe(true);
      expect(max).toBeGreaterThan(0);
      expect(ticks).toHaveLength(5);
    }
  });

  it('lists every assumption with three finite values and a source', () => {
    expect(result.assumptions.length).toBeGreaterThan(0);
    for (const a of result.assumptions) {
      expectText(a.name);
      for (const v of [a.unfavourable, a.central, a.favourable]) expect(Number.isFinite(v)).toBe(true);
      expect(sourceParts(a.source).length).toBeGreaterThan(0);
    }
  });

  it('round-trips through the URL', () => {
    expect(parseToolInputs(new URLSearchParams(toSearchString(input)))).toEqual(input);
  });
});

describe('cases the issue names', () => {
  it('100 rooms in Djerba with a pool is a weak fit with its reasons', () => {
    const r = sizeHotel({ city: 'djerba', pool: true, rooms: 100, elecPrice: null });
    expect(verdictTone(r.verdict)).toBe('weak');
    expect(r.warnings.map((w) => w.code)).toContain('lowFullLoadHours');
  });

  it('the 300-room Djerba demo shows CHP only beside trigeneration', () => {
    const r = sizeHotel({ city: 'djerba', pool: true, rooms: 300, elecPrice: null });
    const faster = fasterOption(r.options);
    expect(faster?.chillerKwc).toBe(0);
    expect(r.options.trigeneration?.chillerKwc).toBeGreaterThan(0);
  });
});
