// [PRODUCT NAME] sizing engine v2: TypeScript port of the reference model engine/model.mjs (ADR 0002).
// Pure: no DOM, no network, no clock, deterministic. The parity test in model.test.ts requires this file to
// return exactly what engine/model.mjs returns, so keep the arithmetic in the same order. If the model has to
// change, change engine/model.mjs and docs/engine/spec.md first, then this port, then bump ENGINE_VERSION.
//
// All power in kW, energy in kWh, money in TND before VAT.

import { FIXED, PARAMS, STEG_TOU, type ParamKey, type ParamSet, type TouSlot } from './params';
import { CITY, PER_ROOM, POOL, POOL_REFERENCE_ROOMS, type CityMultiplier, type Season } from './profiles';
import type { Assumption, HourRow, PlantOption, Scenario, ScenarioResult, SizingInput, SizingResult, Verdict } from './types';
import { SCENARIOS } from './types';

const HOURS = 24;
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const round = (x: number, step: number): number => Math.round(x / step) * step;

/** Slot of hour h (h:00-h+1:00) under STEG's summer (June-Aug) or rest-of-year calendar. Half-hours rounded. */
export function touSlot(h: number, stegSummer: boolean): TouSlot {
  if (stegSummer) {
    if (h >= 22 || h < 6) return 'night'; // 22:00-06:30
    if (h >= 9 && h <= 13) return 'morningPeak'; // 08:30-13:30
    if (h >= 19) return 'eveningPeak'; // 19:00-22:00
    return 'day'; // 06:30-08:30, 13:30-19:00
  }
  if (h >= 21 || h < 7) return 'night'; // 21:00-07:00
  if (h >= 18) return 'eveningPeak'; // 18:00-21:00 peak
  return 'day'; // 07:00-18:00
}

const PARAM_KEYS = Object.keys(PARAMS) as ParamKey[];

/** Parameter set for one scenario, as plain numbers. Throws if the energy balance is broken. */
export function paramsFor(scenario: Scenario): ParamSet {
  const i = SCENARIOS.indexOf(scenario);
  if (i < 0) throw new Error(`unknown scenario ${String(scenario)}`);
  const p = {} as ParamSet;
  for (const k of PARAM_KEYS) p[k] = PARAMS[k].values[i] as number;
  if (p.engineElecEff + p.engineThermalEff > FIXED.maxTotalEff + 1e-9) {
    throw new Error(`${scenario}: total engine efficiency above ${FIXED.maxTotalEff}`);
  }
  return p;
}

type Demand = { elec: number; heat: number; cool: number };

type Operation = { engineElec: number; toHotWater: number; toChiller: number; chillerCool: number; elecNeed: number };

export type SimRow = {
  hour: number;
  d: Demand;
  op: Operation;
  grid: number;
  baseGrid: number;
  engineFuel: number;
  boilerFuel: number;
  baseFuel: number;
};

type NormalisedInput = { rooms: number; cityMult: CityMultiplier; pool: boolean; flatPrice: number | null };

/** Unrounded full-year result of one engine size under one scenario. */
export type Evaluation = {
  kwe: number;
  chillerKwc: number;
  capexTnd: number;
  annualSavingsTnd: number;
  demandChargeSavingTnd: number;
  co2AvoidedTonnes: number;
  paybackYears: number;
  paybackYearsWithFte: number;
  fullLoadHours: number;
  runHours: number;
  primaryEnergySaving: number;
  peakGridReliefKw: number;
  sim: Record<Season, SimRow[]>;
};

function demandFor(season: Season, rooms: number, cityMult: CityMultiplier, pool: boolean, occ: number): Demand[] {
  const occupied = rooms * occ;
  const room = PER_ROOM[season];
  const poolScale = pool ? rooms / POOL_REFERENCE_ROOMS : 0;
  return Array.from({ length: HOURS }, (_, h) => ({
    elec: (room.elec[h] as number) * occupied,
    heat: (room.heat[h] as number) * occupied * cityMult.heat + (POOL[season][h] as number) * poolScale,
    cool: (room.cool[h] as number) * occupied * cityMult.cool,
  }));
}

/** One hour with the engine at `e` kWe. Heat goes to hot water first, the rest to the absorption chiller. */
function operate(d: Demand, e: number, p: ParamSet, chillerCap: number): Operation {
  const recoverable = (e * p.engineThermalEff) / p.engineElecEff;
  const toHotWater = Math.min(recoverable, d.heat);
  const chillerCool = Math.min(d.cool, chillerCap, (recoverable - toHotWater) * p.absorptionCop);
  const toChiller = chillerCool / p.absorptionCop;
  const elecNeed = d.elec + (d.cool - chillerCool) / p.electricChillerCop + chillerCool * p.absorptionParasitic;
  return { engineElec: e, toHotWater, toChiller, chillerCool, elecNeed };
}

/** Electricity-following dispatch, no export, off below minimum load or outside running hours. */
function dispatch(d: Demand, kwe: number, running: boolean, p: ParamSet, chillerCap: number): Operation {
  const off = operate(d, 0, p, chillerCap);
  if (!running || kwe <= 0) return off;
  const full = operate(d, kwe, p, chillerCap);
  let op = full;
  if (full.elecNeed < kwe) {
    let lo = 0;
    let hi = kwe;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (operate(d, mid, p, chillerCap).elecNeed > mid) lo = mid;
      else hi = mid;
    }
    op = operate(d, hi, p, chillerCap);
  }
  return op.engineElec < FIXED.minLoad * kwe ? off : op;
}

/** Simulate one day and return hourly operation plus the baseline (no plant). */
function simulateDay(demand: Demand[], kwe: number, p: ParamSet, chillerCap: number): SimRow[] {
  return demand.map((d, hour) => {
    const op = dispatch(d, kwe, hour >= FIXED.engineStartHour, p, chillerCap);
    const grid = Math.max(0, op.elecNeed - op.engineElec);
    const baseGrid = d.elec + d.cool / p.electricChillerCop;
    return {
      hour,
      d,
      op,
      grid,
      baseGrid,
      engineFuel: op.engineElec / p.engineElecEff,
      boilerFuel: (d.heat - op.toHotWater) / p.boilerEff,
      baseFuel: d.heat / p.boilerEff,
    };
  });
}

function elecPriceAt(h: number, stegSummer: boolean, flatPrice: number | null): number {
  if (flatPrice != null) return flatPrice;
  return STEG_TOU[touSlot(h, stegSummer)] + FIXED.municipalSurtax;
}

type PowerRow = { hour: number; base: number; grid: number };

/** Weighted power Pr used for the STEG demand charge, from the summer (June-Aug) and winter day profiles. */
function weightedPower(summerRows: PowerRow[], winterRows: PowerRow[], key: 'base' | 'grid'): number {
  const max = (rows: PowerRow[], stegSummer: boolean, slot: TouSlot): number =>
    Math.max(0, ...rows.filter((r) => touSlot(r.hour, stegSummer) === slot).map((r) => r[key]));
  return (
    0.4 * max(winterRows, false, 'eveningPeak') +
    0.3 * max(summerRows, true, 'morningPeak') +
    0.2 * Math.max(max(summerRows, true, 'day'), max(winterRows, false, 'day')) +
    0.1 * max(summerRows, true, 'eveningPeak')
  );
}

/** Full-year evaluation of one engine size under one scenario. */
function evaluate({ rooms, cityMult, pool, flatPrice }: NormalisedInput, kwe: number, p: ParamSet): Evaluation {
  const demand = {
    summer: demandFor('summer', rooms, cityMult, pool, p.occupancySummer),
    winter: demandFor('winter', rooms, cityMult, pool, p.occupancyWinter),
  };
  // Absorption chiller sized to what the engine's heat can drive at full load in the summer peak cooling hour.
  const firstPass = simulateDay(demand.summer, kwe, p, Infinity);
  const chillerKwc = Math.round(Math.max(0, ...firstPass.map((r) => r.op.chillerCool)));
  const sim = {
    summer: simulateDay(demand.summer, kwe, p, chillerKwc),
    winter: simulateDay(demand.winter, kwe, p, chillerKwc),
  };
  // Day types: summer demand with STEG summer slots (92 d), summer demand with year slots (58 d), winter (215 d).
  const dayTypes = [
    { rows: sim.summer, days: FIXED.steTouSummerDays, stegSummer: true },
    { rows: sim.summer, days: FIXED.summerDays - FIXED.steTouSummerDays, stegSummer: false },
    { rows: sim.winter, days: FIXED.winterDays, stegSummer: false },
  ];
  const y = { baseCost: 0, cost: 0, baseCo2: 0, co2: 0, engineKwh: 0, fuel: 0, usefulHeat: 0, runHours: 0 };
  for (const { rows, days, stegSummer } of dayTypes) {
    for (const r of rows) {
      const price = elecPriceAt(r.hour, stegSummer, flatPrice);
      y.baseCost += days * (r.baseGrid * price + r.baseFuel * p.gasPrice);
      y.cost += days * (r.grid * price + (r.engineFuel + r.boilerFuel) * p.gasPrice + r.op.engineElec * p.maintenance);
      y.baseCo2 += days * (r.baseGrid * p.gridCo2 + r.baseFuel * p.gasCo2);
      y.co2 += days * (r.grid * p.gridCo2 + (r.engineFuel + r.boilerFuel) * p.gasCo2);
      y.engineKwh += days * r.op.engineElec;
      y.fuel += days * r.engineFuel;
      y.usefulHeat += days * (r.op.toHotWater + r.op.toChiller);
      y.runHours += days * (r.op.engineElec > 0 ? 1 : 0);
    }
  }
  const base = (rows: SimRow[]): PowerRow[] => rows.map((r) => ({ hour: r.hour, base: r.baseGrid, grid: r.grid }));
  const demandSaving =
    flatPrice == null
      ? 12 *
        STEG_TOU.demandCharge *
        (weightedPower(base(sim.summer), base(sim.winter), 'base') - weightedPower(base(sim.summer), base(sim.winter), 'grid'))
      : 0;
  const savings = y.baseCost - y.cost + (p.demandChargeSaving ? demandSaving : 0);
  const capex = kwe * p.engineCapexAt500 * Math.pow(kwe / 500, p.capexScaleExponent) + chillerKwc * p.chillerCapex;
  const payback = (invest: number): number =>
    savings > 0 ? Math.min(FIXED.maxPaybackYears, invest / savings) : FIXED.maxPaybackYears;
  const pes =
    y.fuel > 0 ? 1 - 1 / (y.usefulHeat / y.fuel / FIXED.peAuxRefHeat + y.engineKwh / y.fuel / FIXED.peAuxRefElec) : 0;
  // Peak relief at the hottest summer hour, if the engine is running.
  const hot = demand.summer.reduce((b, d, h) => (d.cool > (demand.summer[b] as Demand).cool ? h : b), 0);
  const hotRow = sim.summer[hot] as SimRow;
  const peakGridReliefKw = hotRow.baseGrid - hotRow.grid;
  return {
    kwe,
    chillerKwc,
    capexTnd: capex,
    annualSavingsTnd: savings,
    demandChargeSavingTnd: demandSaving,
    co2AvoidedTonnes: (y.baseCo2 - y.co2) / 1000,
    paybackYears: payback(capex),
    paybackYearsWithFte: payback(capex * (1 - FIXED.fteShare)),
    fullLoadHours: kwe > 0 ? y.engineKwh / kwe : 0,
    runHours: y.runHours,
    primaryEnergySaving: pes,
    peakGridReliefKw,
    sim,
  };
}

/** Below this the absorption chiller is not worth installing (ESTIMATE). */
export const MIN_TRIGEN_CHILLER_KWC = 50;
const verdictFor = (y: number): Verdict => (y <= 6 ? 'good fit' : y <= 10 ? 'possible fit, needs a study' : 'weak fit');
/** Engine sizes swept by sizeHotel: 100 to 1,000 kWe in steps of 50. */
export const CANDIDATE_SIZES: readonly number[] = Array.from({ length: 19 }, (_, i) => 100 + 50 * i);

/** Rounded, presentable version of evaluate()'s result. */
function present(r: Evaluation): ScenarioResult {
  return {
    capexTnd: round(r.capexTnd, 10000),
    annualSavingsTnd: round(r.annualSavingsTnd, 5000),
    demandChargeSavingTnd: round(r.demandChargeSavingTnd, 1000),
    co2AvoidedTonnes: round(r.co2AvoidedTonnes, 10),
    paybackYears: Math.round(r.paybackYears * 2) / 2,
    paybackYearsWithFte: Math.round(r.paybackYearsWithFte * 2) / 2,
    fullLoadHours: round(r.fullLoadHours, 100),
    primaryEnergySaving: Math.round(r.primaryEnergySaving * 100) / 100,
    peakGridReliefKw: round(r.peakGridReliefKw, 10),
  };
}

type OptionWithSim = PlantOption & { sim: Record<Season, SimRow[]> };

function normalise({ rooms = 300, city = 'djerba', pool = true, elecPrice = null }: Partial<SizingInput>): NormalisedInput {
  return {
    rooms: clamp(Number(rooms) || 300, 50, 800),
    cityMult: (CITY as Partial<Record<string, CityMultiplier>>)[city] ?? CITY.djerba,
    pool: Boolean(pool),
    flatPrice: elecPrice == null ? null : Math.max(0, Number(elecPrice) || 0),
  };
}

/**
 * Size a trigeneration plant for one hotel. Pure and deterministic.
 * Sweeps CANDIDATE_SIZES and keeps the shortest central payback, for any plant (`options.best`) and for plants
 * with an absorption chiller of at least MIN_TRIGEN_CHILLER_KWC (`options.trigeneration`). The headline is the
 * trigeneration option if there is one.
 */
export function sizeHotel(input: Partial<SizingInput> = {}): SizingResult {
  const norm = normalise(input);
  const central = paramsFor('central');
  const runs = CANDIDATE_SIZES.map((kwe) => evaluate(norm, kwe, central));
  // Among runs, the shortest central payback; within 0.2 years of it, the larger size (more CO2 and peak relief).
  const pick = (list: Evaluation[]): Evaluation | null => {
    if (list.length === 0) return null;
    const best = Math.min(...list.map((r) => r.paybackYears));
    return list.filter((r) => r.paybackYears <= best + 0.2).at(-1) ?? null;
  };
  const bestRun = pick(runs);
  const trigenRun = pick(runs.filter((r) => r.chillerKwc >= MIN_TRIGEN_CHILLER_KWC));

  const option = (chosen: Evaluation | null): OptionWithSim | null => {
    if (!chosen) return null;
    const raw = {} as Record<Scenario, Evaluation>;
    for (const s of SCENARIOS) raw[s] = s === 'central' ? chosen : evaluate(norm, chosen.kwe, paramsFor(s));
    const warnings: string[] = [];
    if (chosen.fullLoadHours < 4000) warnings.push(`Only ${round(chosen.fullLoadHours, 100)} full-load hours a year (below 4,000).`);
    if (chosen.primaryEnergySaving < 0.1) warnings.push('Primary energy saving below 10%: not high-efficiency cogeneration under the EU test.');
    if (chosen.paybackYears > 10) warnings.push('Central payback above 10 years.');
    const scenarios = {} as Record<Scenario, ScenarioResult>;
    for (const s of SCENARIOS) scenarios[s] = present(raw[s]);
    return {
      engineKwe: chosen.kwe,
      chillerKwc: chosen.chillerKwc,
      verdict: verdictFor(chosen.paybackYears),
      warnings,
      scenarios,
      sim: chosen.sim,
    };
  };
  const best = option(bestRun);
  const trigeneration = option(trigenRun);
  const headline = trigeneration ?? best;
  // CANDIDATE_SIZES is never empty, so `best` always exists.
  if (!headline) throw new Error('no candidate engine size');

  const hourlyRows = (rows: SimRow[]): HourRow[] =>
    rows.map((r) => ({
      hour: r.hour,
      elecDemand: Math.round(r.d.elec),
      heatDemand: Math.round(r.d.heat),
      coolDemand: Math.round(r.d.cool),
      engineElec: Math.round(r.op.engineElec),
      recoveredHeat: Math.round(r.op.toHotWater + r.op.toChiller),
      chillerCool: Math.round(r.op.chillerCool),
      gridImport: Math.round(r.grid),
    }));

  const strip = (o: OptionWithSim | null): PlantOption | null => {
    if (!o) return null;
    const { engineKwe, chillerKwc, verdict, warnings, scenarios } = o;
    return { engineKwe, chillerKwc, verdict, warnings, scenarios };
  };
  const assumptions: Assumption[] = PARAM_KEYS.map((k) => {
    const { label, values, unit, source } = PARAMS[k];
    return { name: label, unfavourable: values[0], central: values[1], favourable: values[2], unit, source };
  });
  return {
    ...(strip(headline) as PlantOption),
    options: { best: strip(best), trigeneration: strip(trigeneration) },
    hourly: { summer: hourlyRows(headline.sim.summer), winter: hourlyRows(headline.sim.winter) },
    assumptions,
  };
}

/** Exposed for tests and the method content: evaluate a given engine size under a given scenario. */
export function evaluateSize(opts: Partial<SizingInput>, kwe: number, scenario: Scenario): Evaluation {
  const input: NormalisedInput = {
    rooms: opts.rooms ?? 300,
    cityMult: CITY[opts.city ?? 'djerba'],
    pool: opts.pool ?? true,
    flatPrice: opts.elecPrice ?? null,
  };
  return evaluate(input, kwe, paramsFor(scenario));
}
