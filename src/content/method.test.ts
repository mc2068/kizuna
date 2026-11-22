import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PARAMS, SCENARIOS, type PlantOption, type ScenarioResult } from '@/lib/engine';

import { ASSUMPTIONS, DEMO, LIMITS, METHOD_STEPS, REFERENCES, SENSITIVITY } from './method';

// ---------------------------------------------------------------------------------------------------------------
// FROZEN NUMBERS. These pin the table in docs/team/README.md ("Frozen numbers"). If this test fails, the engine
// changed the numbers every page, the tool and the PDF show: update the README table (and docs/engine/spec.md,
// the "Start here" blocks in docs/team/role-*.md), then tell the team. Never just edit the expected values.
// ---------------------------------------------------------------------------------------------------------------

/** [favourable, central, unfavourable], the order the README reads. */
const fcu = (o: PlantOption, k: keyof ScenarioResult) => [
  o.scenarios.favourable[k],
  o.scenarios.central[k],
  o.scenarios.unfavourable[k],
];

describe('frozen Djerba demo numbers (docs/team/README.md)', () => {
  const r = DEMO.result;
  const chp = r.options.best as PlantOption;

  it('trigeneration headline', () => {
    expect([r.engineKwe, r.chillerKwc]).toEqual([200, 64]);
    expect(fcu(r, 'capexTnd')).toEqual([1_240_000, 1_750_000, 2_360_000]);
    expect(fcu(r, 'annualSavingsTnd')).toEqual([260_000, 200_000, 110_000]);
    expect(fcu(r, 'paybackYears')).toEqual([5, 9, 21.5]);
    expect(fcu(r, 'paybackYearsWithFte')).toEqual([3.5, 6, 15]);
    expect(fcu(r, 'co2AvoidedTonnes')).toEqual([260, 210, 70]);
    expect(fcu(r, 'fullLoadHours')).toEqual([6100, 5700, 4900]);
    expect(r.scenarios.central.peakGridReliefKw).toBe(220);
    expect(r.verdict).toBe('possible fit, needs a study');
  });

  it('CHP only', () => {
    expect([chp.engineKwe, chp.chillerKwc]).toEqual([100, 0]);
    expect(fcu(chp, 'capexTnd')).toEqual([610_000, 850_000, 1_100_000]);
    expect(fcu(chp, 'annualSavingsTnd')).toEqual([135_000, 110_000, 70_000]);
    expect(fcu(chp, 'paybackYears')).toEqual([4.5, 7.5, 15.5]);
    expect(fcu(chp, 'paybackYearsWithFte')).toEqual([3, 5.5, 11]);
    expect(fcu(chp, 'co2AvoidedTonnes')).toEqual([150, 130, 60]);
    expect(fcu(chp, 'fullLoadHours')).toEqual([6600, 6600, 6500]);
  });

  it('the README table shows the same capex as the engine', () => {
    const readme = readFileSync(fileURLToPath(new URL('../../docs/team/README.md', import.meta.url)), 'utf8');
    // "| Capex | 1.24 / 1.75 / 2.36 M TND | 0.61 / 0.85 / 1.1 M TND |"
    const asMillions = (o: PlantOption) =>
      fcu(o, 'capexTnd')
        .map((n) => String(n / 1_000_000))
        .join(' / ');
    expect(readme).toContain(`| Capex | ${asMillions(r)} M TND | ${asMillions(chp)} M TND |`);
    expect(readme).toContain('| Payback | **5 / 9 / 21.5 years** | 4.5 / 7.5 / 15.5 years |');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Content shape
// ---------------------------------------------------------------------------------------------------------------

describe('references', () => {
  it('have unique ids and urls', () => {
    expect(new Set(REFERENCES.map((r) => r.id)).size).toBe(REFERENCES.length);
    expect(new Set(REFERENCES.map((r) => r.url)).size).toBe(REFERENCES.length);
    for (const r of REFERENCES) {
      expect(r.url, r.id).toMatch(/^https:\/\//);
      expect(r.accessed, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('every URL cited in an engine source is in the reference list', () => {
    const known = new Set(REFERENCES.map((r) => r.url));
    for (const a of ASSUMPTIONS) for (const u of a.urls) expect(known, `${a.id}: ${u}`).toContain(u);
  });

  it('every reference is used by an assumption, or is a hotel-load benchmark', () => {
    const used = new Set(ASSUMPTIONS.flatMap((a) => a.refs));
    const benchmarks = ['anme-hotels-2026', 'bertolazzi-2023', 'ulpgc-hotels', 'eu-2012-27'];
    for (const r of REFERENCES) expect(used.has(r.id) || benchmarks.includes(r.id), r.id).toBe(true);
  });
});

describe('assumptions', () => {
  it('cover every engine parameter, with its three values', () => {
    for (const [id, p] of Object.entries(PARAMS)) {
      const a = ASSUMPTIONS.find((x) => x.id === id);
      expect(a, id).toBeDefined();
      expect([a?.unfavourable, a?.central, a?.favourable]).toEqual([...p.values]);
    }
  });

  it('have unique ids, a status and a source', () => {
    expect(new Set(ASSUMPTIONS.map((a) => a.id)).size).toBe(ASSUMPTIONS.length);
    for (const a of ASSUMPTIONS) {
      expect(['sourced', 'estimated', 'unconfirmed'], a.id).toContain(a.status);
      expect(a.source.length, a.id).toBeGreaterThan(5);
    }
  });

  it('the FTE subsidy is marked unconfirmed', () => {
    expect(ASSUMPTIONS.find((a) => a.id === 'fteShare')?.status).toBe('unconfirmed');
  });
});

describe('sensitivity (spec: "What moves the central 9-year payback")', () => {
  const row = (id: string) => SENSITIVITY.rows.find((r) => r.id === id);

  it('is computed on the demo plant', () => {
    expect(SENSITIVITY.plant).toEqual({ engineKwe: 200, chillerKwc: 64 });
    expect(SENSITIVITY.centralPaybackYears).toBe(8.9);
  });

  it('matches the spec table', () => {
    expect(row('engineCapexAt500')).toMatchObject({ unfavourablePaybackYears: 11.3, favourablePaybackYears: 6.6 });
    expect(row('gasPrice')).toMatchObject({ unfavourablePaybackYears: 10.9, favourablePaybackYears: 8.9 });
    expect(row('occupancyWinter')).toMatchObject({ unfavourablePaybackYears: 9.9, favourablePaybackYears: 8.5 });
    expect(row('maintenance')).toMatchObject({ unfavourablePaybackYears: 9.9, favourablePaybackYears: 8.4 });
    expect(row('demandChargeSaving')).toMatchObject({ unfavourablePaybackYears: 8.9, favourablePaybackYears: 7.8 });
    expect(row('engineElecEff')).toMatchObject({ unfavourablePaybackYears: 9.6, favourablePaybackYears: 8.5 });
  });

  it('is sorted by impact, engine capex first, and leaves out inputs that do not move payback', () => {
    expect(SENSITIVITY.rows[0]?.id).toBe('engineCapexAt500');
    const impacts = SENSITIVITY.rows.map((r) => r.impactYears);
    expect(impacts).toEqual([...impacts].sort((a, b) => b - a));
    for (const id of ['gridCo2', 'gasCo2', 'boilerEff', 'capexScaleExponent']) expect(row(id), id).toBeUndefined();
  });
});

describe('steps and limits', () => {
  it('6 to 8 method steps, unique ids', () => {
    expect(METHOD_STEPS.length).toBeGreaterThanOrEqual(6);
    expect(METHOD_STEPS.length).toBeLessThanOrEqual(8);
    expect(new Set(METHOD_STEPS.map((s) => s.id)).size).toBe(METHOD_STEPS.length);
  });

  it('limits include blackout cover (never promise island mode)', () => {
    expect(LIMITS.map((l) => l.id)).toContain('island-mode');
    expect(new Set(LIMITS.map((l) => l.id)).size).toBe(LIMITS.length);
  });

  it('demo carries the engine version and all three scenarios', () => {
    expect(DEMO.engineVersion).toBe('2.0.0');
    expect(Object.keys(DEMO.result.scenarios).sort()).toEqual([...SCENARIOS].sort());
  });
});
