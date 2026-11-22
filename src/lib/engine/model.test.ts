import { describe, expect, it } from 'vitest';
import {
  ENGINE_VERSION,
  PARAMS,
  SCENARIOS,
  evaluateSize,
  paramsFor,
  sizeHotel,
  touSlot,
  type City,
  type PlantOption,
  type SizingInput,
  type SizingResult,
  type Warning,
} from './index';

// ---------------------------------------------------------------------------------------------------------------
// Ported from engine/model.test.mjs
// ---------------------------------------------------------------------------------------------------------------

describe('reference model tests', () => {
  it('every scenario respects the energy balance (electrical + thermal <= 0.85)', () => {
    for (const s of SCENARIOS) {
      const p = paramsFor(s);
      expect(p.engineElecEff + p.engineThermalEff, s).toBeLessThanOrEqual(0.85 + 1e-9);
    }
  });

  it('every parameter has three values and a source', () => {
    for (const [k, v] of Object.entries(PARAMS)) {
      expect(v.values, k).toHaveLength(3);
      expect(v.source.length, k).toBeGreaterThan(10);
    }
  });

  it('scenarios are ordered: unfavourable payback >= central >= favourable', () => {
    for (const rooms of [100, 300, 500]) {
      const { unfavourable: u, central: c, favourable: f } = sizeHotel({ rooms, city: 'djerba', pool: true }).scenarios;
      expect(u.paybackYears, `${rooms} rooms`).toBeGreaterThanOrEqual(c.paybackYears);
      expect(c.paybackYears, `${rooms} rooms`).toBeGreaterThanOrEqual(f.paybackYears);
    }
  });

  it('the plant never makes more heat than the engine can recover', () => {
    const r = sizeHotel({});
    const p = paramsFor('central');
    for (const row of [...r.hourly.summer, ...r.hourly.winter]) {
      expect(row.recoveredHeat).toBeLessThanOrEqual((row.engineElec * p.engineThermalEff) / p.engineElecEff + 1);
    }
  });

  it('engine is off or at least at 50% load', () => {
    const r = sizeHotel({});
    for (const row of [...r.hourly.summer, ...r.hourly.winter]) {
      expect(row.engineElec === 0 || row.engineElec >= 0.5 * r.engineKwe - 1, `hour ${row.hour}`).toBe(true);
    }
  });

  it('a summer-sized 450 kWe engine is a poor investment for the 300-room Djerba demo', () => {
    const e = evaluateSize({ rooms: 300, city: 'djerba', pool: true }, 450, 'central');
    expect(e.paybackYears).toBeGreaterThan(15);
    expect(e.fullLoadHours).toBeLessThan(3000);
  });

  it('Djerba demo: headline is a trigeneration option with a range, not a point', () => {
    const r = sizeHotel({ rooms: 300, city: 'djerba', pool: true });
    expect(r.chillerKwc).toBeGreaterThanOrEqual(50);
    expect(r.options.best).not.toBeNull();
    expect(r.options.trigeneration).not.toBeNull();
    expect(r.scenarios.favourable.paybackYears).toBeLessThan(r.scenarios.unfavourable.paybackYears);
  });

  it('STEG time-of-use slots', () => {
    expect(touSlot(10, true)).toBe('morningPeak');
    expect(touSlot(20, true)).toBe('eveningPeak');
    expect(touSlot(3, true)).toBe('night');
    expect(touSlot(19, false)).toBe('eveningPeak');
    expect(touSlot(10, false)).toBe('day');
  });

  it('deterministic', () => {
    expect(sizeHotel({ rooms: 250, city: 'sousse' })).toEqual(sizeHotel({ rooms: 250, city: 'sousse' }));
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Golden tests: docs/engine/spec.md. Read as [favourable, central, unfavourable].
// ---------------------------------------------------------------------------------------------------------------

const paybacks = (o: PlantOption | null) => {
  if (!o) throw new Error('missing option');
  return [o.scenarios.favourable.paybackYears, o.scenarios.central.paybackYears, o.scenarios.unfavourable.paybackYears];
};

describe('golden: Djerba demo, 300 rooms, pool, STEG time-of-use', () => {
  const r = sizeHotel({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });
  const fcu = <K extends keyof PlantOption['scenarios']['central']>(o: PlantOption, k: K) => [
    o.scenarios.favourable[k],
    o.scenarios.central[k],
    o.scenarios.unfavourable[k],
  ];

  it('headline is the trigeneration option, 200 kWe + 64 kWc, possible fit', () => {
    expect(r.engineKwe).toBe(200);
    expect(r.chillerKwc).toBe(64);
    expect(r.verdict).toBe('possible fit, needs a study');
    expect(r.warnings).toEqual([]);
    expect(r.options.trigeneration).toEqual({
      engineKwe: r.engineKwe,
      chillerKwc: r.chillerKwc,
      verdict: r.verdict,
      warnings: r.warnings,
      scenarios: r.scenarios,
    });
  });

  it('trigeneration ranges', () => {
    expect(fcu(r, 'capexTnd')).toEqual([1_240_000, 1_750_000, 2_360_000]);
    expect(fcu(r, 'annualSavingsTnd')).toEqual([260_000, 200_000, 110_000]);
    expect(fcu(r, 'paybackYears')).toEqual([5, 9, 21.5]);
    expect(fcu(r, 'paybackYearsWithFte')).toEqual([3.5, 6, 15]);
    expect(fcu(r, 'co2AvoidedTonnes')).toEqual([260, 210, 70]);
    expect(fcu(r, 'fullLoadHours')).toEqual([6100, 5700, 4900]);
    expect(r.scenarios.central.peakGridReliefKw).toBe(220);
  });

  it('best option is CHP only, 100 kWe, no chiller', () => {
    const best = r.options.best as PlantOption;
    expect(best.engineKwe).toBe(100);
    expect(best.chillerKwc).toBe(0);
    expect(fcu(best, 'capexTnd')).toEqual([610_000, 850_000, 1_100_000]);
    expect(fcu(best, 'annualSavingsTnd')).toEqual([135_000, 110_000, 70_000]);
    expect(fcu(best, 'paybackYears')).toEqual([4.5, 7.5, 15.5]);
    expect(fcu(best, 'paybackYearsWithFte')).toEqual([3, 5.5, 11]);
    expect(fcu(best, 'co2AvoidedTonnes')).toEqual([150, 130, 60]);
    expect(fcu(best, 'fullLoadHours')).toEqual([6600, 6600, 6500]);
  });

  it('hourly rows cover 24 hours of each season', () => {
    expect(r.hourly.summer.map((h) => h.hour)).toEqual([...Array(24).keys()]);
    expect(r.hourly.winter.map((h) => h.hour)).toEqual([...Array(24).keys()]);
  });

  it('assumptions list every parameter with three values and a source', () => {
    expect(r.assumptions).toHaveLength(Object.keys(PARAMS).length);
    expect(r.assumptions[0]).toMatchObject({ unfavourable: 0.09, central: 0.068, favourable: 0.068, unit: 'TND/kWh' });
  });
});

describe('golden: other hotels (spec, headline option)', () => {
  const cases: [SizingInput, number, number, number[], string][] = [
    [{ rooms: 100, city: 'djerba', pool: true, elecPrice: null }, 150, 77, [10.5, 22.5, 64.5], 'weak fit'],
    [{ rooms: 300, city: 'tozeur', pool: true, elecPrice: null }, 200, 52, [4.5, 8.5, 20.5], 'possible fit, needs a study'],
    [{ rooms: 500, city: 'djerba', pool: true, elecPrice: null }, 300, 81, [4.5, 8, 19], 'possible fit, needs a study'],
  ];
  it.each(cases)('%o -> %i kWe + %i kWc', (input, kwe, kwc, pb, verdict) => {
    const r = sizeHotel(input);
    expect(r.engineKwe).toBe(kwe);
    expect(r.chillerKwc).toBe(kwc);
    expect(paybacks(r)).toEqual(pb);
    expect(r.verdict).toBe(verdict);
  });

  it('100 rooms Djerba warns about low full-load hours and long payback', () => {
    expect(sizeHotel({ rooms: 100, city: 'djerba', pool: true, elecPrice: null }).warnings).toEqual([
      { code: 'lowFullLoadHours', params: { hours: 2400, threshold: 4000 } },
      { code: 'longPayback', params: { years: 22.5, threshold: 10 } },
    ]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Parity: the port must return exactly what the reference model returns.
// ---------------------------------------------------------------------------------------------------------------

describe('parity with engine/model.mjs', async () => {
  // A variable specifier keeps the untyped reference module out of the type check.
  const refPath = '../../../engine/model.mjs';
  const ref = (await import(/* @vite-ignore */ refPath)) as { sizeHotel: (i: SizingInput) => unknown };
  const grid: SizingInput[] = [];
  for (const rooms of [50, 100, 300, 500, 800])
    for (const city of ['djerba', 'sousse', 'hammamet', 'tozeur'] as City[])
      for (const pool of [true, false])
        for (const elecPrice of [null, 0.296]) grid.push({ rooms, city, pool, elecPrice });
  // Very cheap electricity: nothing pays back, and the only input family that fails the EU primary-energy test.
  grid.push({ rooms: 310, city: 'djerba', pool: false, elecPrice: 0.05 });

  // The only deliberate difference: the port emits { code, params } warnings, the reference English sentences.
  const sentence = (w: Warning): string => {
    switch (w.code) {
      case 'lowFullLoadHours':
        return `Only ${w.params.hours} full-load hours a year (below 4,000).`;
      case 'lowPrimaryEnergySaving':
        return 'Primary energy saving below 10%: not high-efficiency cogeneration under the EU test.';
      case 'longPayback':
        return 'Central payback above 10 years.';
    }
  };
  const asReference = (o: PlantOption | null) => o && { ...o, warnings: o.warnings.map(sentence) };
  const toReference = (r: SizingResult) => ({
    ...r,
    warnings: r.warnings.map(sentence),
    options: { best: asReference(r.options.best), trigeneration: asReference(r.options.trigeneration) },
  });

  it.each(grid)('%o', (input) => {
    expect(toReference(sizeHotel(input))).toStrictEqual(ref.sizeHotel(input));
  });

  it('the grid exercises every warning code', () => {
    const codes = new Set(
      grid.flatMap((i) => {
        const r = sizeHotel(i);
        return [r, r.options.best, r.options.trigeneration].flatMap((o) => o?.warnings.map((w) => w.code) ?? []);
      }),
    );
    expect([...codes].sort()).toEqual(['longPayback', 'lowFullLoadHours', 'lowPrimaryEnergySaving']);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------------------------------------------

describe('contract', () => {
  it('ENGINE_VERSION is 2.0.0', () => {
    expect(ENGINE_VERSION).toBe('2.0.0');
  });

  it('sizeHotel runs in under 20 ms (largest input, median of 15 runs)', () => {
    const input: SizingInput = { rooms: 800, city: 'tozeur', pool: true, elecPrice: null };
    sizeHotel(input); // warm up
    const times: number[] = [];
    for (let i = 0; i < 15; i++) {
      const t = performance.now();
      sizeHotel(input);
      times.push(performance.now() - t);
    }
    times.sort((a, b) => a - b);
    expect(times[7]).toBeLessThan(20);
  });
});
