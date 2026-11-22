import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, sizeHotel } from '@/lib/engine';
import { SCENARIOS } from '@/lib/engine/types';

const demo = { rooms: 300, city: 'djerba', pool: true, elecPrice: null } as const;

describe('fake sizeHotel (until the TypeScript port lands)', () => {
  it('returns the frozen Djerba headline: 200 kWe + 64 kWc, possible fit', () => {
    const r = sizeHotel(demo);
    expect(r.engineKwe).toBe(200);
    expect(r.chillerKwc).toBe(64);
    expect(r.verdict).toBe('possible fit, needs a study');
  });

  it('returns the frozen payback, savings and CO2 ranges', () => {
    const { favourable: f, central: c, unfavourable: u } = sizeHotel(demo).scenarios;
    expect([f.paybackYears, c.paybackYears, u.paybackYears]).toEqual([5, 9, 21.5]);
    expect([f.paybackYearsWithFte, c.paybackYearsWithFte, u.paybackYearsWithFte]).toEqual([3.5, 6, 15]);
    expect([f.annualSavingsTnd, c.annualSavingsTnd, u.annualSavingsTnd]).toEqual([260_000, 200_000, 110_000]);
    expect([f.co2AvoidedTonnes, c.co2AvoidedTonnes, u.co2AvoidedTonnes]).toEqual([260, 210, 70]);
    expect([f.fullLoadHours, c.fullLoadHours, u.fullLoadHours]).toEqual([6100, 5700, 4900]);
    expect(c.capexTnd).toBe(1_750_000);
    expect(c.peakGridReliefKw).toBe(220);
  });

  it('has both options: trigeneration is the headline, CHP-only is 100 kWe with no chiller', () => {
    const r = sizeHotel(demo);
    expect(r.options.trigeneration?.engineKwe).toBe(200);
    expect(r.options.best).toMatchObject({ engineKwe: 100, chillerKwc: 0 });
    expect(r.options.best?.scenarios.central.paybackYears).toBe(7.5);
  });

  it('every scenario of every option has all nine numeric fields', () => {
    const r = sizeHotel(demo);
    for (const option of [r, r.options.best, r.options.trigeneration]) {
      for (const s of SCENARIOS) {
        const values = Object.values(option!.scenarios[s]);
        expect(values).toHaveLength(9);
        values.forEach((v) => expect(Number.isFinite(v)).toBe(true));
      }
    }
  });

  it('has 24 hourly rows per season, hours 0 to 23', () => {
    const { hourly } = sizeHotel(demo);
    for (const rows of [hourly.summer, hourly.winter]) {
      expect(rows.map((r) => r.hour)).toEqual([...Array(24).keys()]);
    }
  });

  it('lists the assumptions with three values and a source each', () => {
    const { assumptions } = sizeHotel(demo);
    expect(assumptions.length).toBeGreaterThan(10);
    for (const a of assumptions) expect(a.source.length).toBeGreaterThan(10);
  });

  it('returns a fresh copy, so callers cannot corrupt the frozen numbers', () => {
    sizeHotel(demo).scenarios.central.paybackYears = 99;
    expect(sizeHotel(demo).scenarios.central.paybackYears).toBe(9);
  });

  it('is marked as the fake in ENGINE_VERSION', () => {
    expect(ENGINE_VERSION).toBe('0.0.0-fake');
  });
});
