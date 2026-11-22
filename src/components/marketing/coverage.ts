import type { SizingResult } from '@/lib/engine';

/** Typical-day weights the engine uses: 150 summer days and 215 winter days. */
export const DAY_WEIGHTS = { summer: 150, winter: 215 } as const;
const ABSORPTION_COP = 0.7;

export type Coverage = { elec: number; heat: number; cool: number };

/** Year-round share (0-1) of the hotel's electricity, hot water and cooling that the plant
 *  supplies, central case. Same formula as the landing prototype. */
export function coverage(r: Pick<SizingResult, 'hourly'>): Coverage {
  let e = 0;
  let eD = 0;
  let h = 0;
  let hD = 0;
  let c = 0;
  let cD = 0;
  for (const season of ['summer', 'winter'] as const) {
    const w = DAY_WEIGHTS[season];
    for (const x of r.hourly[season]) {
      e += w * x.engineElec;
      eD += w * (x.engineElec + x.gridImport);
      h += w * Math.min(x.heatDemand, Math.max(0, x.recoveredHeat - x.chillerCool / ABSORPTION_COP));
      hD += w * x.heatDemand;
      c += w * x.chillerCool;
      cD += w * x.coolDemand;
    }
  }
  const share = (a: number, b: number) => (b > 0 ? Math.min(1, Math.max(0, a / b)) : 0);
  return { elec: share(e, eD), heat: share(h, hD), cool: share(c, cD) };
}

export const percent = (x: number) => Math.round(x * 100);
