import { describe, expect, it } from 'vitest';
import { CITIES, DEFAULT_INPUT, evaluateSize, paramsFor, sizeHotel, type SizingInput } from '@/lib/engine';
import { BALANCE_TOLERANCE_KW, checkDay, gridSaving, maxFlowKw, twinConstants, twinDay } from './flows';

const c = twinConstants(paramsFor('central'));

const inputs: SizingInput[] = [];
for (const rooms of [50, 100, 300, 500, 800])
  for (const city of CITIES)
    for (const pool of [true, false])
      for (const elecPrice of [null, 0.296]) inputs.push({ rooms, city, pool, elecPrice });

describe('twin flows', () => {
  it('balances every box at every hour and B never draws more grid than A, for every hotel', () => {
    for (const input of inputs) {
      const day = twinDay(sizeHotel(input).hourly.summer, c);
      expect(day).toHaveLength(24);
      expect(checkDay(day, c), JSON.stringify(input)).toEqual([]);
      for (const t of day) expect(t.b.gridKw).toBeLessThanOrEqual(t.a.gridKw); // exact, no tolerance
    }
  });

  it('matches the engine’s own unrounded flows within rounding, for every hotel', () => {
    for (const input of inputs) {
      const r = sizeHotel(input);
      const sim = evaluateSize(input, r.engineKwe, 'central').sim.summer;
      twinDay(r.hourly.summer, c).forEach((t, h) => {
        const e = sim[h]!;
        const near = (got: number, want: number, what: string) =>
          expect(Math.abs(got - want), `${what} at ${h}:00 ${JSON.stringify(input)}`).toBeLessThanOrEqual(BALANCE_TOLERANCE_KW);
        near(t.a.gridKw, e.baseGrid, 'A grid');
        near(t.a.flows.gasToBoiler, e.baseFuel, 'A boiler gas');
        near(t.b.gridKw, e.grid, 'B grid');
        near(t.b.flows.gasToEngine, e.engineFuel, 'B engine gas');
        near(t.b.flows.gasToBoiler, e.boilerFuel, 'B boiler gas');
        near(t.b.flows.engineToHotWater, e.op.toHotWater, 'B heat to hot water');
        near(t.b.flows.engineToAbsorption, e.op.toChiller, 'B heat to chiller');
      });
    }
  });

  it('shows the Djerba demo day as the engine computes it', () => {
    const day = twinDay(sizeHotel(DEFAULT_INPUT).hourly.summer, c);
    // Engine runs 06:00-24:00 only (FIXED.engineStartHour): at night B is exactly A.
    for (const t of day.slice(0, 6)) {
      expect(t.engineOn).toBe(false);
      expect(t.b.gridKw).toBe(t.a.gridKw);
      expect(gridSaving(t)).toBe(0);
    }
    const six = day[6]!;
    expect(six.engineOn).toBe(true);
    expect(six.b.flows.engineToSwitchboard).toBe(200);
    expect(Math.round(six.b.gridKw)).toBe(126); // the engine's gridImport at 06:00
    expect(six.a.gridKw).toBeCloseTo(227 + 347 / 3.5, 6);
    expect(maxFlowKw(day)).toBeGreaterThan(0);
  });
});
