import { describe, expect, it } from 'vitest';
import { snapshot, type PlantOption } from '@/lib/engine';
import { formatRange } from '@/lib/present';
import { RESULT_ROWS, buildReport, chartMax, type ReportData } from './model';

const demoSnap = snapshot({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });
const demo: ReportData = { hotelName: 'Hotel Djerba Plage', createdAt: '2026-11-22T09:00:00Z', ...demoSnap };
const m = buildReport(demo);

describe('cover', () => {
  it('names the product, the hotel and the inputs', () => {
    expect(m.productName).toBe('[PRODUCT NAME]');
    expect(m.cover.hotelName).toBe('Hotel Djerba Plage');
    expect(m.cover.context).toBe('300 rooms · Djerba · pool');
    expect(m.cover.tariff).toBe('STEG medium-voltage time-of-use prices, before VAT');
    expect(m.cover.calculated).toBe('Calculated on 22 November 2026');
  });

  it('shows the verdict and the headline plant', () => {
    expect(m.cover.verdict).toBe('Possible fit, needs a study');
    expect(m.cover.tone).toBe('maybe');
    expect(m.cover.plant).toBe('200 kWe engine + 64 kWc absorption chiller');
    expect(m.cover.payback).toBe('5 to 21.5 years (9 central)');
  });

  it('flat price and no pool', () => {
    const r = buildReport({ ...demo, ...snapshot({ rooms: 120, city: 'sousse', pool: false, elecPrice: 0.296 }) });
    expect(r.cover.context).toBe('120 rooms · Sousse · no pool');
    expect(r.cover.tariff).toBe('Electricity at 0.296 TND/kWh, before VAT');
  });
});

describe('results: every number is the web helper output for the same stored snapshot', () => {
  it('two columns for the demo: trigeneration and CHP only', () => {
    expect(m.results.columns.map((c) => c.plant)).toEqual([
      '200 kWe engine + 64 kWc absorption chiller',
      '100 kWe engine, no chiller',
    ]);
  });

  it('cells equal formatRange(option, key).text', () => {
    const options = [demo.results.options.trigeneration, demo.results.options.best] as PlantOption[];
    for (const [i, key] of RESULT_ROWS.entries()) {
      expect(m.results.rows[i]?.key).toBe(key);
      expect(m.results.rows[i]?.cells).toEqual(options.map((o) => formatRange(o, key).text));
    }
    expect(m.results.rows.find((r) => r.key === 'capexTnd')?.cells[0]).toBe('1.24 M to 2.36 M TND (1.75 M central)');
  });

  it('labels the FTE payback as unconfirmed', () => {
    expect(m.results.rows.find((r) => r.key === 'paybackYearsWithFte')?.label).toContain('eligibility unconfirmed');
  });

  it('says the CHP-only plant pays back faster', () => {
    expect(m.results.fasterOption).toContain('7.5 years central');
  });

  it('translates warnings, never prints them raw', () => {
    const weak = buildReport({ ...demo, ...snapshot({ rooms: 100, city: 'djerba', pool: true, elecPrice: null }) });
    expect(weak.results.warnings).toEqual([
      'Only 2,400 full-load hours a year (below 4,000).',
      'Central payback above 10 years.',
    ]);
    expect(weak.cover.verdict).toBe('Weak fit');
  });
});

describe('hourly charts', () => {
  it('two days, three energy types, 24 points each, shared scale per type', () => {
    expect(m.hourly.seasons.map((s) => s.title)).toEqual(['Summer day', 'Winter day']);
    for (const s of m.hourly.seasons) {
      expect(s.charts.map((c) => c.kind)).toEqual(['electricity', 'heat', 'cooling']);
      for (const c of s.charts) {
        expect(c.need).toHaveLength(24);
        expect(c.supplied).toHaveLength(24);
        c.supplied.forEach((v, h) => expect(v, `${c.kind} ${h}`).toBeLessThanOrEqual((c.need[h] as number) + 1));
        expect(Math.max(...c.need)).toBeLessThanOrEqual(c.max);
      }
    }
    const [summer, winter] = m.hourly.seasons;
    expect(summer?.charts.map((c) => c.max)).toEqual(winter?.charts.map((c) => c.max));
  });

  it('chartMax rounds up to 1, 2 or 5 x 10^n', () => {
    expect([0, 7, 10, 11, 180, 201, 745].map((v) => chartMax([v]))).toEqual([1, 10, 10, 20, 200, 500, 1000]);
  });
});

describe('assumptions, method, staleness', () => {
  it('lists every stored assumption with formatted values and split sources', () => {
    expect(m.assumptions.rows).toHaveLength(demo.results.assumptions.length);
    expect(m.assumptions.rows[0]).toMatchObject({ favourable: '0.068', central: '0.068', unfavourable: '0.09', unit: 'TND/kWh' });
    const eff = m.assumptions.rows.find((r) => r.name.startsWith('Engine electrical efficiency'));
    expect([eff?.favourable, eff?.central, eff?.unit]).toEqual(['40%', '38%', '']);
    expect(m.assumptions.rows.some((r) => r.source.some((p) => p.kind === 'link'))).toBe(true);
  });

  it('method summary, limits (incl. no blackout cover), version and disclaimer', () => {
    expect(m.method.steps.length).toBeGreaterThanOrEqual(6);
    expect(m.method.limits.map((l) => l.title)).toContain('Blackout cover');
    expect(m.method.engineVersion).toBe('Engine version 2.0.0');
    expect(m.method.stale).toBeNull();
    expect(m.method.disclaimer).toMatch(/^Screening estimate, not a quote/);
  });

  it('a snapshot from an older engine says so, and keeps its stored numbers', () => {
    const old = buildReport({ ...demo, engineVersion: '0.0.0-fake' });
    expect(old.method.stale).toBe(
      'Calculated with engine version 0.0.0-fake; the current version is 2.0.0. Re-run the project for up-to-date numbers.',
    );
    expect(old.cover.payback).toBe(m.cover.payback);
  });

  it('footer and page label', () => {
    expect(m.footer).toBe('[PRODUCT NAME] · Hotel Djerba Plage');
    expect(m.pageLabel(2, 5)).toBe('Page 2 of 5');
  });
});
