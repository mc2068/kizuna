// Contract 1: the sizing engine. Owned by Role 1 (Hamza). Change only by agreement,
// and update the contract in all four role files in docs/team/ in the same PR.

export type City = 'djerba' | 'sousse' | 'hammamet' | 'tozeur';

export type Scenario = 'unfavourable' | 'central' | 'favourable';

export type SizingInput = {
  rooms: number;
  city: City;
  pool: boolean;
  /** Flat TND/kWh before VAT; null = STEG medium-voltage time-of-use tariff. */
  elecPrice: number | null;
};

/** All numbers, rounded by the engine. */
export type ScenarioResult = {
  capexTnd: number;
  annualSavingsTnd: number;
  demandChargeSavingTnd: number;
  co2AvoidedTonnes: number;
  paybackYears: number;
  paybackYearsWithFte: number;
  fullLoadHours: number;
  primaryEnergySaving: number;
  peakGridReliefKw: number;
};

export type Verdict = 'good fit' | 'possible fit, needs a study' | 'weak fit';

export type PlantOption = {
  engineKwe: number;
  chillerKwc: number;
  verdict: Verdict;
  warnings: string[];
  scenarios: Record<Scenario, ScenarioResult>;
};

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

/** Headline = the trigeneration option if any, else the best option. */
export type SizingResult = PlantOption & {
  options: { best: PlantOption | null; trigeneration: PlantOption | null };
  /** 24 rows each, headline option, central case. */
  hourly: { summer: HourRow[]; winter: HourRow[] };
  assumptions: Assumption[];
};

export const CITIES: readonly City[] = ['djerba', 'sousse', 'hammamet', 'tozeur'];
export const SCENARIOS: readonly Scenario[] = ['unfavourable', 'central', 'favourable'];
