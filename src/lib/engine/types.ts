// Contract 1: the public types of the sizing engine. See docs/team/README.md.
// Changing anything here changes the contract: agree it with the team and update all four role files.

export type City = 'djerba' | 'sousse' | 'hammamet' | 'tozeur';

export type Scenario = 'unfavourable' | 'central' | 'favourable';

export type Verdict = 'good fit' | 'possible fit, needs a study' | 'weak fit';

export type SizingInput = {
  /** Number of rooms, 50 to 800 (clamped). */
  rooms: number;
  city: City;
  /** Heated outdoor pool. */
  pool: boolean;
  /** Flat electricity price in TND/kWh before VAT; null = STEG medium-voltage time-of-use tariff. */
  elecPrice: number | null;
};

/** One scenario of one plant option, rounded for display. */
export type ScenarioResult = {
  capexTnd: number;
  annualSavingsTnd: number;
  demandChargeSavingTnd: number;
  co2AvoidedTonnes: number;
  paybackYears: number;
  /** Payback with the FTE subsidy. Hotel eligibility is unconfirmed: never the headline. */
  paybackYearsWithFte: number;
  fullLoadHours: number;
  primaryEnergySaving: number;
  peakGridReliefKw: number;
};

/**
 * A sanity check the plant failed. Never shown raw: src/lib/present turns it into the i18n message
 * `engine.warnings.<code>` (messages/en/engine.json) with `params` as ICU values.
 */
export type Warning =
  | { code: 'lowFullLoadHours'; params: { hours: number; threshold: number } }
  | { code: 'lowPrimaryEnergySaving'; params: { pes: number; threshold: number } }
  | { code: 'longPayback'; params: { years: number; threshold: number } };

export type WarningCode = Warning['code'];

export type PlantOption = {
  engineKwe: number;
  chillerKwc: number;
  verdict: Verdict;
  warnings: Warning[];
  scenarios: Record<Scenario, ScenarioResult>;
};

/** One hour of the headline option on a typical day, central case, kW rounded to integers. */
export type HourRow = {
  hour: number;
  elecDemand: number;
  heatDemand: number;
  coolDemand: number;
  engineElec: number;
  recoveredHeat: number;
  chillerCool: number;
  gridImport: number;
};

export type Assumption = {
  name: string;
  unfavourable: number;
  central: number;
  favourable: number;
  unit: string;
  source: string;
};

/** The headline option (trigeneration if any, else the best of any size) plus both options. */
export type SizingResult = PlantOption & {
  options: { best: PlantOption | null; trigeneration: PlantOption | null };
  hourly: { summer: HourRow[]; winter: HourRow[] };
  assumptions: Assumption[];
};

export const CITIES: readonly City[] = ['djerba', 'sousse', 'hammamet', 'tozeur'];
export const SCENARIOS: readonly Scenario[] = ['unfavourable', 'central', 'favourable'];
