// Virtual site ("digital twin") of the hotel energy system: every energy flow, hour by hour, for
//   A = today (grid electricity + electric chillers + gas boiler), and
//   B = with the trigeneration plant (gas engine + absorption chiller, the boiler and chillers as backup).
//
// Data rule: the ONLY inputs are the engine's hourly rows (sizeHotel(...).hourly.summer, central case) and the
// engine's own central constants (paramsFor('central')). Nothing here is measured or invented. The formulas
// mirror operate() and simulateDay() in src/lib/engine/model.ts; flows.test.ts checks them against the
// engine's unrounded internals. Pure: no React, no DOM. All values in kW (fuel and heat kWth, cold kWc).

import type { HourRow, ParamSet } from '@/lib/engine';

/** The constants the twin needs, all taken from the engine's central parameter set. */
export type TwinConstants = Pick<
  ParamSet,
  'engineElecEff' | 'engineThermalEff' | 'absorptionCop' | 'absorptionParasitic' | 'electricChillerCop' | 'boilerEff'
>;

export function twinConstants(p: ParamSet): TwinConstants {
  const { engineElecEff, engineThermalEff, absorptionCop, absorptionParasitic, electricChillerCop, boilerEff } = p;
  return { engineElecEff, engineThermalEff, absorptionCop, absorptionParasitic, electricChillerCop, boilerEff };
}

export type EnergyKind = 'fuel' | 'elec' | 'heat' | 'cool';

/** Boxes on the diagram. Engine and absorption chiller exist only on side B. */
export type NodeId =
  | 'grid'
  | 'gas'
  | 'engine'
  | 'boiler'
  | 'switchboard'
  | 'electricChillers'
  | 'absorptionChiller'
  | 'hotelElec'
  | 'cooling'
  | 'hotWater';

export type FlowId =
  | 'gridToSwitchboard'
  | 'gasToEngine'
  | 'gasToBoiler'
  | 'engineToSwitchboard'
  | 'switchboardToHotel'
  | 'switchboardToElectricChillers'
  | 'switchboardToAbsorption'
  | 'engineToHotWater'
  | 'engineToAbsorption'
  | 'boilerToHotWater'
  | 'electricChillersToCooling'
  | 'absorptionToCooling';

export type Flow = { id: FlowId; from: NodeId; to: NodeId; kind: EnergyKind; kw: number };

/** Every flow drawn on the diagram, in drawing order. `side` says where it can be non-zero. */
export const FLOWS: readonly { id: FlowId; from: NodeId; to: NodeId; kind: EnergyKind; side: 'both' | 'B' }[] = [
  { id: 'gridToSwitchboard', from: 'grid', to: 'switchboard', kind: 'elec', side: 'both' },
  { id: 'gasToEngine', from: 'gas', to: 'engine', kind: 'fuel', side: 'B' },
  { id: 'gasToBoiler', from: 'gas', to: 'boiler', kind: 'fuel', side: 'both' },
  { id: 'engineToSwitchboard', from: 'engine', to: 'switchboard', kind: 'elec', side: 'B' },
  { id: 'switchboardToHotel', from: 'switchboard', to: 'hotelElec', kind: 'elec', side: 'both' },
  { id: 'switchboardToElectricChillers', from: 'switchboard', to: 'electricChillers', kind: 'elec', side: 'both' },
  { id: 'switchboardToAbsorption', from: 'switchboard', to: 'absorptionChiller', kind: 'elec', side: 'B' },
  { id: 'engineToHotWater', from: 'engine', to: 'hotWater', kind: 'heat', side: 'B' },
  { id: 'engineToAbsorption', from: 'engine', to: 'absorptionChiller', kind: 'heat', side: 'B' },
  { id: 'boilerToHotWater', from: 'boiler', to: 'hotWater', kind: 'heat', side: 'both' },
  { id: 'electricChillersToCooling', from: 'electricChillers', to: 'cooling', kind: 'cool', side: 'both' },
  { id: 'absorptionToCooling', from: 'absorptionChiller', to: 'cooling', kind: 'cool', side: 'B' },
];

/** One side of the site in one hour: every flow plus the totals the page shows. */
export type SiteHour = {
  flows: Record<FlowId, number>;
  gridKw: number;
  gasKw: number;
  /** Fuel energy not turned into useful electricity, heat or cold: engine exhaust/radiator and boiler flue. */
  lossesKw: number;
  /** Engine heat recovered but not used (no hot-water or chiller demand for it). Zero on side A. */
  unusedHeatKw: number;
};

export type TwinHour = {
  hour: number;
  demand: { elec: number; heat: number; cool: number };
  engineOn: boolean;
  a: SiteHour;
  b: SiteHour;
};

const zeroFlows = (): Record<FlowId, number> =>
  Object.fromEntries(FLOWS.map((f) => [f.id, 0])) as Record<FlowId, number>;

/** Side A, today: no engine. Same as the engine's baseGrid / baseFuel. */
function baseline(r: HourRow, c: TwinConstants): SiteHour {
  const flows = zeroFlows();
  const chillerElec = r.coolDemand / c.electricChillerCop;
  const boilerGas = r.heatDemand / c.boilerEff;
  flows.gridToSwitchboard = r.elecDemand + chillerElec;
  flows.switchboardToHotel = r.elecDemand;
  flows.switchboardToElectricChillers = chillerElec;
  flows.electricChillersToCooling = r.coolDemand;
  flows.gasToBoiler = boilerGas;
  flows.boilerToHotWater = r.heatDemand;
  return {
    flows,
    gridKw: flows.gridToSwitchboard,
    gasKw: boilerGas,
    lossesKw: boilerGas - r.heatDemand,
    unusedHeatKw: 0,
  };
}

/** Side B, with the plant. Heat goes to hot water first, the rest to the absorption chiller (model.ts operate()). */
function withPlant(r: HourRow, c: TwinConstants): SiteHour {
  const flows = zeroFlows();
  const engineGas = r.engineElec / c.engineElecEff;
  const engineHeat = (r.engineElec * c.engineThermalEff) / c.engineElecEff; // heat the engine can give
  const toChiller = r.chillerCool / c.absorptionCop;
  // recoveredHeat = toHotWater + toChiller in the engine; clamp keeps rounding noise from going negative.
  const toHotWater = Math.max(0, r.recoveredHeat - toChiller);
  const boilerHeat = Math.max(0, r.heatDemand - toHotWater);
  const boilerGas = boilerHeat / c.boilerEff;
  const electricCool = Math.max(0, r.coolDemand - r.chillerCool);
  const chillerElec = electricCool / c.electricChillerCop;
  const parasitic = r.chillerCool * c.absorptionParasitic;

  flows.gasToEngine = engineGas;
  flows.engineToSwitchboard = r.engineElec;
  flows.engineToHotWater = toHotWater;
  flows.engineToAbsorption = toChiller;
  // Grid draw from the switchboard balance, as the engine does (grid = elecNeed - engineElec), rather than the
  // rounded gridImport field: A and B then share one arithmetic, so B equals A exactly when the engine is off
  // and B <= A always. flows.test.ts checks it stays within rounding of the engine's own grid figure.
  flows.gridToSwitchboard = Math.max(0, r.elecDemand + chillerElec + parasitic - r.engineElec);
  flows.switchboardToHotel = r.elecDemand;
  flows.switchboardToElectricChillers = chillerElec;
  flows.switchboardToAbsorption = parasitic;
  flows.absorptionToCooling = r.chillerCool;
  flows.electricChillersToCooling = electricCool;
  flows.gasToBoiler = boilerGas;
  flows.boilerToHotWater = boilerHeat;

  const unusedHeatKw = Math.max(0, engineHeat - toHotWater - toChiller);
  return {
    flows,
    gridKw: flows.gridToSwitchboard,
    gasKw: engineGas + boilerGas,
    lossesKw: engineGas - r.engineElec - engineHeat + (boilerGas - boilerHeat),
    unusedHeatKw,
  };
}

export function twinHour(r: HourRow, c: TwinConstants): TwinHour {
  return {
    hour: r.hour,
    demand: { elec: r.elecDemand, heat: r.heatDemand, cool: r.coolDemand },
    engineOn: r.engineElec > 0,
    a: baseline(r, c),
    b: withPlant(r, c),
  };
}

export function twinDay(rows: readonly HourRow[], c: TwinConstants): TwinHour[] {
  return rows.map((r) => twinHour(r, c));
}

// ---------------------------------------------------------------------------------------------------------------
// Sanity checks: energy in = energy out at every box, and B never draws more from the grid than A.
// ---------------------------------------------------------------------------------------------------------------

/**
 * The engine rounds every hourly field to whole kW, and some flows divide a rounded value by a COP or an
 * efficiency, so a balance can be off by up to about 2 kW without anything being wrong.
 */
export const BALANCE_TOLERANCE_KW = 2;

export type BalanceIssue = { hour: number; side: 'A' | 'B'; check: string; gapKw: number };

/** Every box where energy in and energy out differ by more than the tolerance, for one hour. Empty = all good. */
export function checkHour(t: TwinHour, c: TwinConstants, tol = BALANCE_TOLERANCE_KW): BalanceIssue[] {
  const issues: BalanceIssue[] = [];
  const add = (side: 'A' | 'B', check: string, gapKw: number) => {
    if (Math.abs(gapKw) > tol) issues.push({ hour: t.hour, side, check, gapKw });
  };
  for (const [side, s] of [['A', t.a], ['B', t.b]] as const) {
    const f = s.flows;
    // Switchboard: electricity in = electricity out.
    add(side, 'switchboard', f.gridToSwitchboard + f.engineToSwitchboard -
      (f.switchboardToHotel + f.switchboardToElectricChillers + f.switchboardToAbsorption));
    // Hotel demand is met exactly.
    add(side, 'hotel electricity', f.switchboardToHotel - t.demand.elec);
    add(side, 'hot water', f.engineToHotWater + f.boilerToHotWater - t.demand.heat);
    add(side, 'cooling', f.electricChillersToCooling + f.absorptionToCooling - t.demand.cool);
    // Machines: out = in x efficiency or COP.
    add(side, 'electric chillers', f.switchboardToElectricChillers * c.electricChillerCop - f.electricChillersToCooling);
    add(side, 'absorption chiller', f.engineToAbsorption * c.absorptionCop - f.absorptionToCooling);
    add(side, 'boiler', f.gasToBoiler * c.boilerEff - f.boilerToHotWater);
    // Engine: gas in = electricity + heat used + heat unused + losses.
    const engineHeat = (f.engineToSwitchboard * c.engineThermalEff) / c.engineElecEff;
    add(side, 'engine heat', engineHeat - (f.engineToHotWater + f.engineToAbsorption + s.unusedHeatKw));
    add(side, 'engine electricity', f.gasToEngine * c.engineElecEff - f.engineToSwitchboard);
  }
  if (t.b.gridKw > t.a.gridKw + tol) {
    issues.push({ hour: t.hour, side: 'B', check: 'grid draw above today', gapKw: t.b.gridKw - t.a.gridKw });
  }
  return issues;
}

export function checkDay(day: readonly TwinHour[], c: TwinConstants): BalanceIssue[] {
  return day.flatMap((t) => checkHour(t, c));
}

/** Grid saving of B against A this hour, as a fraction of A (0.62 = 62% less). 0 when A draws nothing. */
export function gridSaving(t: TwinHour): number {
  return t.a.gridKw > 0 ? (t.a.gridKw - t.b.gridKw) / t.a.gridKw : 0;
}

/** Largest flow of the whole day on either side, so arrow thickness means the same kW at every hour. */
export function maxFlowKw(day: readonly TwinHour[]): number {
  let max = 0;
  for (const t of day) for (const s of [t.a, t.b]) for (const v of Object.values(s.flows)) max = Math.max(max, v);
  return max;
}
