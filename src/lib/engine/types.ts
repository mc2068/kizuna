// Contract 1 types (Role 1, Hamza). STAND-IN until #5 lands; same names and shapes as the contract.
export type City = 'djerba' | 'sousse' | 'hammamet' | 'tozeur';
export type Scenario = 'unfavourable' | 'central' | 'favourable';
export type Verdict = 'good fit' | 'possible fit, needs a study' | 'weak fit';
export type SizingInput = { rooms: number; city: City; pool: boolean; elecPrice: number | null };
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
export type SizingResult = PlantOption & {
  options: { best: PlantOption | null; trigeneration: PlantOption | null };
  hourly: { summer: HourRow[]; winter: HourRow[] };
  assumptions: Assumption[];
};
export const CITIES: City[] = ['djerba', 'sousse', 'hammamet', 'tozeur'];
export const SCENARIOS: Scenario[] = ['unfavourable', 'central', 'favourable'];
