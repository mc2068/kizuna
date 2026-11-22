// Every constant of the [PRODUCT NAME] sizing engine, with its source. Port of engine/model.mjs (v2).
// ADR 0002: assumptions live here, versioned and tested, not in the database.

import { OCCUPANCY } from './profiles';


const DOE_ENGINE = 'https://betterbuildingssolutioncenter.energy.gov/sites/default/files/attachments/CHP_Reciprocating_Engines.pdf';
const DOE_CHILLER = 'https://www.energy.gov/sites/default/files/2017/06/f35/CHP-Absorption%20Chiller-compliant.pdf';
const FIPA = 'https://investintunisia.tn/wp-content/uploads/2024/01/Couts-des-facteurs-FIPA-Janvier-2024.pdf';

export type Param = {
  label: string;
  /** [unfavourable, central, favourable] for the hotel's business case. */
  values: readonly [number, number, number];
  unit: string;
  source: string;
};

/**
 * Every scenario-dependent constant. "Unfavourable" is the combination a sceptical juror would pick,
 * not a worst case. Key order is the order of `assumptions` in the engine output.
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
} as const satisfies Record<string, Param>;

export type ParamKey = keyof typeof PARAMS;

/** One scenario's parameters as plain numbers. */
export type ParamSet = Record<ParamKey, number>;

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
} as const;

export type TouSlot = 'day' | 'morningPeak' | 'eveningPeak' | 'night';

/** STEG MV time-of-use energy prices, TND/kWh before VAT, since 1 Oct 2022 (FIPA Jan 2024; Wattnow guide). */
export const STEG_TOU: Record<TouSlot, number> & { demandCharge: number } = {
  day: 0.29,
  morningPeak: 0.417,
  eveningPeak: 0.377,
  night: 0.222,
  demandCharge: 11,
};
