// [PRODUCT NAME] sizing engine, reference model v2.
// Pure ES module: no DOM, no network, deterministic. The TypeScript port (ADR 0002) must match its tests.
//
// What changed from v1 (mc2068/kizuna-trigeneration site/js/engine.js), see docs/engine/spec.md:
// - Energy balance: explicit electrical and thermal efficiency (LHV), total capped at 0.85 (v1 implied 0.96).
// - Prices: STEG medium-voltage time-of-use tariff applied hour by hour, STEG MP1 gas tariff, all before VAT.
// - Capex: size-dependent installed cost (DOE curve) instead of a flat 2,000 TND/kWe fleet average.
// - Baseline chiller COP 3.5 (was 3.0), absorption parasitics, engine minimum load 50%.
// - Engine size chosen for the shortest central payback, not a fixed percentile rule.
// - Results come as three scenarios (unfavourable, central, favourable) plus sanity checks.
//
// sizeHotel({ rooms, city, pool, elecPrice? }) returns
//   { engineKwe, chillerKwc, verdict, warnings[],          // headline: the trigeneration option if any
//     scenarios: { unfavourable, central, favourable },    // each: capex, savings, CO2, paybacks, sanity checks
//     options: { best, trigeneration },                    // best = shortest payback of any size (may be CHP only)
//     hourly: { summer: [24 rows], winter: [24 rows] },    // headline option, central case
//     assumptions: [{ name, unfavourable, central, favourable, unit, source }] }
// All power in kW, energy in kWh, money in TND before VAT.

import { PER_ROOM, POOL, POOL_REFERENCE_ROOMS, CITY, OCCUPANCY } from './profiles.mjs';

const DOE_ENGINE = 'https://betterbuildingssolutioncenter.energy.gov/sites/default/files/attachments/CHP_Reciprocating_Engines.pdf';
const DOE_CHILLER = 'https://www.energy.gov/sites/default/files/2017/06/f35/CHP-Absorption%20Chiller-compliant.pdf';
const FIPA = 'https://investintunisia.tn/wp-content/uploads/2024/01/Couts-des-facteurs-FIPA-Janvier-2024.pdf';

/**
 * Every scenario-dependent constant: [unfavourable, central, favourable] for the hotel's business case.
 * "Unfavourable" is the combination a sceptical juror would pick, not a worst case.
 */
export const PARAMS = {
  gasPrice: {
    label: 'Natural gas price (per kWh LHV, before VAT)',
    values: [0.09, 0.068, 0.068],
    unit: 'TND/kWh',
    source: `STEG MP1 71.1 + 0.25 FTE mill/thermie (in force since 1 May 2022, via FIPA Jan 2024 ${FIPA}) = 0.061 TND/kWh HHV = 0.068 LHV. Unfavourable: +32% for a subsidy reform (ESTIMATE)`,
  },
  engineElecEff: {
    label: 'Engine electrical efficiency (LHV)',
    values: [0.35, 0.38, 0.4],
    unit: 'fraction',
    source: `DOE CHP reciprocating engines fact sheet: 27.7% (35 kW) to 40.6% (4.5 MW) HHV; 400-600 kWe class ~35-40% LHV ${DOE_ENGINE} (ESTIMATE within range)`,
  },
  engineThermalEff: {
    label: 'Engine useful heat recovery efficiency (LHV, hot water ~90 °C)',
    values: [0.42, 0.43, 0.45],
    unit: 'fraction',
    source: `Chosen so total efficiency is 0.77-0.85, the 75-85% range in DOE ${DOE_ENGINE} and docs research §1. v1 used 1.67 kWth/kWe (total 0.96), physically too high`,
  },
  engineCapexAt500: {
    label: 'Installed engine plant cost at 500 kWe (incl. balance of plant, gas and grid connection)',
    values: [9100, 7000, 5000],
    unit: 'TND/kWe',
    source: `DOE installed cost $3,150/kW at 500 kW (2020 USD) x 2.89 TND/USD = 9,100 (unfavourable, US labour). Central and favourable assume lower Tunisian installation cost: ESTIMATE until an installer quote. v1 used 2,000 (fleet average of mostly multi-MW plants)`,
  },
  capexScaleExponent: {
    label: 'Engine cost scaling with size, (kWe / 500) ^ exponent',
    values: [-0.12, -0.12, -0.12],
    unit: '-',
    source: `Fitted to the DOE curve: $3,700/kW at 100 kW, $3,150 at 500 kW, $2,800 at 1 MW ${DOE_ENGINE}`,
  },
  chillerCapex: {
    label: 'Absorption chiller installed cost, with cooling tower',
    values: [4500, 3000, 2000],
    unit: 'TND/kWc',
    source: `DOE single-effect $1,800-6,000 per RT = 1,480-4,930 TND/kWc, higher for small units ${DOE_CHILLER}. ESTIMATE within range`,
  },
  maintenance: {
    label: 'Engine maintenance including overhauls',
    values: [0.058, 0.04, 0.03],
    unit: 'TND/kWh produced',
    source: `DOE non-fuel O&M 2.0 US cents/kWh at 500 kW = 0.058 TND (unfavourable) ${DOE_ENGINE}; lower Tunisian labour cost for central/favourable is an ESTIMATE`,
  },
  absorptionCop: {
    label: 'Absorption chiller COP (single-effect)',
    values: [0.65, 0.7, 0.75],
    unit: 'kWc/kWth',
    source: `DOE 0.70-0.79 at rating; 0.65 allows for 40 °C+ heat rejection in Djerba summers ${DOE_CHILLER}`,
  },
  absorptionParasitic: {
    label: 'Absorption chiller parasitic electricity (pumps, cooling tower fans)',
    values: [0.04, 0.03, 0.02],
    unit: 'kWe per kWc',
    source: 'ESTIMATE: typical cooling-tower fan and pump loads; a single-effect chiller rejects ~2.4 kW of heat per kWc',
  },
  electricChillerCop: {
    label: 'Existing electric chiller seasonal COP (baseline)',
    values: [4.5, 3.5, 3.0],
    unit: 'kWc/kWe',
    source: 'ESTIMATE: older air-cooled chillers and splits ~3, newer units 3.5-4.5, efficient water-cooled 5-6. v1 used 3.0 (flattering)',
  },
  boilerEff: {
    label: 'Gas boiler efficiency (baseline, LHV)',
    values: [0.92, 0.92, 0.92],
    unit: 'fraction',
    source: 'EU reference efficiency for hot water, Ref_Hη = 92%',
  },
  gridCo2: {
    label: 'Grid CO2 intensity',
    values: [0.4, 0.48, 0.48],
    unit: 'kg CO2/kWh',
    source: 'LowCarbonPower, Tunisia 467 g (2024) to 483 g (2025) https://lowcarbonpower.org/region/Tunisia. Unfavourable 0.40: grid getting cleaner over plant life (ESTIMATE)',
  },
  gasCo2: {
    label: 'Natural gas CO2 factor',
    values: [0.202, 0.202, 0.202],
    unit: 'kg CO2/kWh LHV',
    source: 'IPCC default 56.1 t CO2/TJ',
  },
  occupancySummer: {
    label: 'Summer occupancy (150 days, mid-May to mid-October)',
    values: [0.8, OCCUPANCY.summer, 0.9],
    unit: 'fraction',
    source: 'ONTT: Djerba-Zarzis 64.4% Jan-Aug 2026 (La Presse, 9 Oct 2026); 80% late June 2024, 90% one day in July 2025 (regional tourism delegate). ESTIMATE for the season average',
  },
  occupancyWinter: {
    label: 'Winter and shoulder occupancy (215 days)',
    values: [0.4, OCCUPANCY.winter, 0.55],
    unit: 'fraction',
    source: 'Chosen so the year averages ~63% at central, consistent with ONTT 64.4% Jan-Aug 2026. ESTIMATE',
  },
  demandChargeSaving: {
    label: 'Count the STEG demand-charge saving (11 TND/kW/month)',
    values: [0, 0, 1],
    unit: 'yes=1',
    source: `STEG MV time-of-use redevance de puissance 11,000 mill/kW/month on Pr = 0.4 P winter peak + 0.3 P summer peak + 0.2 P day + 0.1 P evening (FIPA ${FIPA}; Wattnow guide). Only favourable: one engine trip at peak loses it`,
  },
};

export const SCENARIOS = ['unfavourable', 'central', 'favourable'];

/** Fixed constants, not scenario-dependent. */
export const FIXED = {
  summerDays: 150, // mid-May to mid-October (ASSUMPTION)
  steTouSummerDays: 92, // STEG "summer" time slots apply June to August only
  winterDays: 215,
  engineStartHour: 6, // runs 06:00 to 24:00 (design choice)
  minLoad: 0.5, // engine switches off below 50% of rating (rule of thumb for gas engines)
  maxTotalEff: 0.85,
  fteShare: 0.3, // UNCONFIRMED: hotel eligibility not confirmed by ANME
  municipalSurtax: 0.005, // TND/kWh, added to STEG MV energy prices
  peAuxRefElec: 0.525, // EU harmonised reference efficiency, natural gas electricity (Reg. 2015/2402)
  peAuxRefHeat: 0.92,
  maxPaybackYears: 99,
};

/** STEG MV time-of-use energy prices, TND/kWh before VAT, since 1 Oct 2022 (FIPA Jan 2024; Wattnow guide). */
export const STEG_TOU = { day: 0.29, morningPeak: 0.417, eveningPeak: 0.377, night: 0.222, demandCharge: 11 };

/** Slot of hour h (h:00-h+1:00) under STEG's summer (June-Aug) or rest-of-year calendar. Half-hours rounded. */
export function touSlot(h, stegSummer) {
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

const HOURS = 24;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const round = (x, step) => Math.round(x / step) * step;

/** Parameter set for one scenario, as plain numbers. */
export function paramsFor(scenario) {
  const i = SCENARIOS.indexOf(scenario);
  if (i < 0) throw new Error(`unknown scenario ${scenario}`);
  const p = Object.fromEntries(Object.entries(PARAMS).map(([k, v]) => [k, v.values[i]]));
  if (p.engineElecEff + p.engineThermalEff > FIXED.maxTotalEff + 1e-9) {
    throw new Error(`${scenario}: total engine efficiency above ${FIXED.maxTotalEff}`);
  }
  return p;
}

function demandFor(season, rooms, cityMult, pool, occ) {
  const occupied = rooms * occ;
  const room = PER_ROOM[season];
  const poolScale = pool ? rooms / POOL_REFERENCE_ROOMS : 0;
  return Array.from({ length: HOURS }, (_, h) => ({
    elec: room.elec[h] * occupied,
    heat: room.heat[h] * occupied * cityMult.heat + POOL[season][h] * poolScale,
    cool: room.cool[h] * occupied * cityMult.cool,
  }));
}

/** One hour with the engine at `e` kWe. Heat goes to hot water first, the rest to the absorption chiller. */
function operate(d, e, p, chillerCap) {
  const recoverable = (e * p.engineThermalEff) / p.engineElecEff;
  const toHotWater = Math.min(recoverable, d.heat);
  const chillerCool = Math.min(d.cool, chillerCap, (recoverable - toHotWater) * p.absorptionCop);
  const toChiller = chillerCool / p.absorptionCop;
  const elecNeed = d.elec + (d.cool - chillerCool) / p.electricChillerCop + chillerCool * p.absorptionParasitic;
  return { engineElec: e, toHotWater, toChiller, chillerCool, elecNeed };
}

/** Electricity-following dispatch, no export, off below minimum load or outside running hours. */
function dispatch(d, kwe, running, p, chillerCap) {
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
function simulateDay(demand, kwe, p, chillerCap) {
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

function elecPriceAt(h, stegSummer, flatPrice) {
  if (flatPrice != null) return flatPrice;
  return STEG_TOU[touSlot(h, stegSummer)] + FIXED.municipalSurtax;
}

/** Weighted power Pr used for the STEG demand charge, from the summer (June-Aug) and winter day profiles. */
function weightedPower(summerRows, winterRows, key) {
  const max = (rows, stegSummer, slot) =>
    Math.max(0, ...rows.filter((r) => touSlot(r.hour, stegSummer) === slot).map((r) => r[key]));
  return (
    0.4 * max(winterRows, false, 'eveningPeak') +
    0.3 * max(summerRows, true, 'morningPeak') +
    0.2 * Math.max(max(summerRows, true, 'day'), max(winterRows, false, 'day')) +
    0.1 * max(summerRows, true, 'eveningPeak')
  );
}

/** Full-year evaluation of one engine size under one scenario. */
function evaluate({ rooms, cityMult, pool, flatPrice }, kwe, p) {
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
  const base = (rows) => rows.map((r) => ({ hour: r.hour, base: r.baseGrid, grid: r.grid }));
  const demandSaving =
    flatPrice == null
      ? 12 * STEG_TOU.demandCharge *
        (weightedPower(base(sim.summer), base(sim.winter), 'base') - weightedPower(base(sim.summer), base(sim.winter), 'grid'))
      : 0;
  const savings = y.baseCost - y.cost + (p.demandChargeSaving ? demandSaving : 0);
  const capex =
    kwe * p.engineCapexAt500 * Math.pow(kwe / 500, p.capexScaleExponent) + chillerKwc * p.chillerCapex;
  const payback = (invest) => (savings > 0 ? Math.min(FIXED.maxPaybackYears, invest / savings) : FIXED.maxPaybackYears);
  const pes =
    y.fuel > 0 ? 1 - 1 / (y.usefulHeat / y.fuel / FIXED.peAuxRefHeat + y.engineKwh / y.fuel / FIXED.peAuxRefElec) : 0;
  // Peak relief at the hottest summer hour, if the engine is running.
  const hot = demand.summer.reduce((b, d, h) => (d.cool > demand.summer[b].cool ? h : b), 0);
  const peakGridReliefKw = sim.summer[hot].baseGrid - sim.summer[hot].grid;
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

const MIN_TRIGEN_CHILLER_KWC = 50; // below this the absorption chiller is not worth installing (ESTIMATE)
const verdictFor = (y) => (y <= 6 ? 'good fit' : y <= 10 ? 'possible fit, needs a study' : 'weak fit');
const CANDIDATE_SIZES = Array.from({ length: 19 }, (_, i) => 100 + 50 * i); // 100 to 1,000 kWe

/** Rounded, presentable version of evaluate()'s result. */
function present(r) {
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

export function sizeHotel({ rooms = 300, city = 'djerba', pool = true, elecPrice = null } = {}) {
  const input = {
    rooms: clamp(Number(rooms) || 300, 50, 800),
    cityMult: CITY[city] ?? CITY.djerba,
    pool: Boolean(pool),
    flatPrice: elecPrice == null ? null : Math.max(0, Number(elecPrice) || 0),
  };
  const central = paramsFor('central');
  const runs = CANDIDATE_SIZES.map((kwe) => evaluate(input, kwe, central));
  // Among runs, the shortest central payback; within 0.2 years of it, the larger size (more CO2 and peak relief).
  const pick = (list) => {
    if (list.length === 0) return null;
    const best = Math.min(...list.map((r) => r.paybackYears));
    return list.filter((r) => r.paybackYears <= best + 0.2).at(-1);
  };
  const bestRun = pick(runs);
  const trigenRun = pick(runs.filter((r) => r.chillerKwc >= MIN_TRIGEN_CHILLER_KWC));

  const option = (chosen) => {
    if (!chosen) return null;
    const raw = Object.fromEntries(
      SCENARIOS.map((s) => [s, s === 'central' ? chosen : evaluate(input, chosen.kwe, paramsFor(s))]),
    );
    const warnings = [];
    if (chosen.fullLoadHours < 4000) warnings.push(`Only ${round(chosen.fullLoadHours, 100)} full-load hours a year (below 4,000).`);
    if (chosen.primaryEnergySaving < 0.1) warnings.push('Primary energy saving below 10%: not high-efficiency cogeneration under the EU test.');
    if (chosen.paybackYears > 10) warnings.push('Central payback above 10 years.');
    return {
      engineKwe: chosen.kwe,
      chillerKwc: chosen.chillerKwc,
      verdict: verdictFor(chosen.paybackYears),
      warnings,
      scenarios: Object.fromEntries(SCENARIOS.map((s) => [s, present(raw[s])])),
      sim: chosen.sim,
    };
  };
  const best = option(bestRun);
  const trigeneration = option(trigenRun);
  const headline = trigeneration ?? best;

  const hourlyRows = (rows) =>
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

  const strip = (o) => (o ? (({ sim, ...rest }) => rest)(o) : null);
  return {
    ...strip(headline),
    options: { best: strip(best), trigeneration: strip(trigeneration) },
    hourly: { summer: hourlyRows(headline.sim.summer), winter: hourlyRows(headline.sim.winter) },
    assumptions: Object.values(PARAMS).map(({ label, values, unit, source }) => ({
      name: label,
      unfavourable: values[0],
      central: values[1],
      favourable: values[2],
      unit,
      source,
    })),
  };
}

/** Exposed for tests: evaluate a given engine size under a given scenario. */
export function evaluateSize(opts, kwe, scenario) {
  const input = {
    rooms: opts.rooms ?? 300,
    cityMult: CITY[opts.city ?? 'djerba'],
    pool: opts.pool ?? true,
    flatPrice: opts.elecPrice ?? null,
  };
  return evaluate(input, kwe, paramsFor(scenario));
}

