// Content behind the Sources and method page (/sources) and the Djerba case study (/case-study/djerba).
// Everything numeric is COMPUTED from the engine, never typed, so the pages cannot drift from the tool.
// method.test.ts pins the frozen Djerba numbers in docs/team/README.md: if the engine changes them, the test
// fails and the change becomes a deliberate, reviewed decision (update the README table and tell the team).
//
// Short UI copy (headings, column labels, status names) is in messages/en/method.json.
// Long-form text (method steps, limits) stays here as structured data. English only for now.

import {
  ENGINE_VERSION,
  FIXED,
  PARAMS,
  STEG_TOU,
  evaluateWithParams,
  paramsFor,
  sizeHotel,
  type ParamKey,
  type SizingInput,
  type SizingResult,
} from '@/lib/engine';

// ---------------------------------------------------------------------------------------------------------------
// References: stable ids, used by <Footnote id="..."/> and by the assumptions below
// ---------------------------------------------------------------------------------------------------------------

export type Reference = { id: string; title: string; publisher: string; url: string; accessed: string };

const ACCESSED = '2026-11-22';

export const REFERENCES = [
  {
    id: 'doe-chp-engines',
    title: 'Combined Heat and Power Technology Fact Sheet Series: Reciprocating Engines',
    publisher: 'US Department of Energy',
    url: 'https://betterbuildingssolutioncenter.energy.gov/sites/default/files/attachments/CHP_Reciprocating_Engines.pdf',
  },
  {
    id: 'doe-absorption-chiller',
    title: 'Combined Heat and Power Technology Fact Sheet Series: Absorption Chillers for CHP Systems',
    publisher: 'US Department of Energy',
    url: 'https://www.energy.gov/sites/default/files/2017/06/f35/CHP-Absorption%20Chiller-compliant.pdf',
  },
  {
    id: 'fipa-2024',
    title: 'Coûts des facteurs en Tunisie (STEG electricity and gas tariffs)',
    publisher: 'FIPA-Tunisia, January 2024',
    url: 'https://investintunisia.tn/wp-content/uploads/2024/01/Couts-des-facteurs-FIPA-Janvier-2024.pdf',
  },
  {
    id: 'wattnow-steg-mv',
    title: 'Facture STEG moyenne tension : guide ligne par ligne',
    publisher: 'Wattnow',
    url: 'https://www.wattnow.io/fr/facture-steg-moyenne-tension-guide-ligne-par-ligne/',
  },
  {
    id: 'steg-no-change-2024',
    title: 'Augmentation des tarifs de l’électricité et du gaz : la STEG dément',
    publisher: 'L’Economiste Maghrébin, 5 May 2024',
    url: 'https://www.leconomistemaghrebin.com/2024/05/05/augmentation-des-tarifs-de-electricite-et-du-gaz-steg-dement/',
  },
  {
    id: 'lowcarbonpower-tunisia',
    title: 'Electricity in Tunisia: carbon intensity',
    publisher: 'LowCarbonPower',
    url: 'https://lowcarbonpower.org/region/Tunisia',
  },
  {
    id: 'ipcc-2006-energy',
    title: '2006 IPCC Guidelines for National Greenhouse Gas Inventories, Volume 2 Energy, Chapter 1',
    publisher: 'IPCC',
    url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/2_Volume2/V2_1_Ch1_Introduction.pdf',
  },
  {
    id: 'eu-2015-2402',
    title: 'Commission Delegated Regulation (EU) 2015/2402: harmonised efficiency reference values',
    publisher: 'European Union',
    url: 'https://eur-lex.europa.eu/eli/reg_del/2015/2402/oj',
  },
  {
    id: 'eu-2012-27',
    title: 'Directive 2012/27/EU on energy efficiency, Annex II (high-efficiency cogeneration)',
    publisher: 'European Union',
    url: 'https://eur-lex.europa.eu/eli/dir/2012/27/oj',
  },
  {
    id: 'ontt-djerba-2026',
    title: 'Djerba-Zarzis, first tourist region: 64.4% occupancy, January to August 2026',
    publisher: 'La Presse via AllAfrica, 9 October 2026',
    url: 'https://fr.allafrica.com/stories/202610090697.html',
  },
  {
    id: 'rtci-djerba-2025',
    title: 'Djerba: record 90% occupancy',
    publisher: 'RTCI, July 2025',
    url: 'https://www.rtci.tn/article/687913f743e32bf02c0da1ee/tourisme--l%C3%AEle-de-djerba-affiche-un-taux-doccupation-record-de-90--selon-hichem-mahouachi',
  },
  {
    id: 'anme-hotels-2026',
    title: 'Hôtellerie tunisienne : le défi de la maîtrise énergétique (ANME audit of 137 hotels)',
    publisher: 'La Presse, 5 November 2026',
    url: 'https://www.lapresse.tn/2026/11/05/hotellerie-tunisienne-derriere-le-confort-des-touristes-le-defi-de-la-maitrise-energetique/',
  },
  {
    id: 'bertolazzi-2023',
    title: 'Energy use of Mediterranean hotels (Italy, Greece, Spain)',
    publisher: 'Bertolazzi et al., SBE Thessaloniki 2023',
    url: 'https://www.research.unipd.it/retrieve/46ce16e3-4762-41ff-828e-786aa08b7a61/2023_Bertolazzi_Micocci_SBE_Thessaloniki.pdf',
  },
  {
    id: 'ulpgc-hotels',
    title: 'Energy use in hotels of the Balearic Islands',
    publisher: 'Universidad de Las Palmas de Gran Canaria',
    url: 'https://accedacris.ulpgc.es/bitstream/10553/111029/1/Energy_use_hotels.pdf',
  },
].map((r) => ({ ...r, accessed: ACCESSED })) satisfies Reference[];

export type ReferenceId = (typeof REFERENCES)[number]['id'];

// ---------------------------------------------------------------------------------------------------------------
// Assumptions: every engine constant with its three values, source and status
// ---------------------------------------------------------------------------------------------------------------

/** sourced = a published figure used as is; estimated = derived from a source with our reasoning; unconfirmed = team assumption or not yet confirmed. */
export type AssumptionStatus = 'sourced' | 'estimated' | 'unconfirmed';

export type MethodAssumption = {
  id: string;
  label: string;
  unfavourable: number;
  central: number;
  favourable: number;
  unit: string;
  /** Full source text from the engine. */
  source: string;
  /** URLs found in the source text. */
  urls: string[];
  refs: ReferenceId[];
  status: AssumptionStatus;
  /** False for fixed constants (same value in every scenario). */
  variesByScenario: boolean;
};

/** Status and references of each scenario parameter, from docs/research/assumptions-audit.md. */
const PARAM_META: Record<ParamKey, { status: AssumptionStatus; refs: ReferenceId[] }> = {
  gasPrice: { status: 'sourced', refs: ['fipa-2024', 'steg-no-change-2024'] },
  engineElecEff: { status: 'estimated', refs: ['doe-chp-engines'] },
  engineThermalEff: { status: 'estimated', refs: ['doe-chp-engines'] },
  engineCapexAt500: { status: 'estimated', refs: ['doe-chp-engines'] },
  capexScaleExponent: { status: 'estimated', refs: ['doe-chp-engines'] },
  chillerCapex: { status: 'estimated', refs: ['doe-absorption-chiller'] },
  maintenance: { status: 'estimated', refs: ['doe-chp-engines'] },
  absorptionCop: { status: 'sourced', refs: ['doe-absorption-chiller'] },
  absorptionParasitic: { status: 'estimated', refs: [] },
  electricChillerCop: { status: 'estimated', refs: [] },
  boilerEff: { status: 'sourced', refs: ['eu-2015-2402'] },
  gridCo2: { status: 'sourced', refs: ['lowcarbonpower-tunisia'] },
  gasCo2: { status: 'sourced', refs: ['ipcc-2006-energy'] },
  occupancySummer: { status: 'estimated', refs: ['ontt-djerba-2026', 'rtci-djerba-2025'] },
  occupancyWinter: { status: 'estimated', refs: ['ontt-djerba-2026'] },
  demandChargeSaving: { status: 'sourced', refs: ['fipa-2024', 'wattnow-steg-mv'] },
};

type FixedEntry = { id: string; label: string; value: number; unit: string; source: string; status: AssumptionStatus; refs: ReferenceId[] };

/** The fixed constants (FIXED, STEG_TOU) worth showing on the Sources page. */
const FIXED_ENTRIES: FixedEntry[] = [
  { id: 'summerDays', label: 'Summer season (mid-May to mid-October)', value: FIXED.summerDays, unit: 'days', source: 'Team assumption', status: 'unconfirmed', refs: [] },
  { id: 'winterDays', label: 'Winter and shoulder season', value: FIXED.winterDays, unit: 'days', source: 'Rest of the year', status: 'unconfirmed', refs: [] },
  { id: 'steTouSummerDays', label: 'Days on STEG summer time slots (June to August)', value: FIXED.steTouSummerDays, unit: 'days', source: 'STEG time-of-use calendar via the Wattnow guide', status: 'sourced', refs: ['wattnow-steg-mv'] },
  { id: 'engineStartHour', label: 'Engine running hours start (runs to midnight)', value: FIXED.engineStartHour, unit: 'hour', source: 'Design choice', status: 'unconfirmed', refs: [] },
  { id: 'minLoad', label: 'Engine minimum load (switches off below)', value: FIXED.minLoad, unit: 'fraction', source: 'Rule of thumb for gas engines', status: 'estimated', refs: [] },
  { id: 'maxTotalEff', label: 'Highest allowed total engine efficiency (electrical + heat)', value: FIXED.maxTotalEff, unit: 'fraction', source: 'DOE: 75-85% for reciprocating-engine CHP', status: 'sourced', refs: ['doe-chp-engines'] },
  { id: 'fteShare', label: 'FTE subsidy share of the investment', value: FIXED.fteShare, unit: 'fraction', source: 'FTE covers up to 60% of the owner’s contribution; 30% chosen to be conservative. Hotel eligibility not confirmed by ANME', status: 'unconfirmed', refs: [] },
  { id: 'municipalSurtax', label: 'Municipal surtax on STEG electricity', value: FIXED.municipalSurtax, unit: 'TND/kWh', source: 'STEG via FIPA', status: 'sourced', refs: ['fipa-2024'] },
  { id: 'peAuxRefElec', label: 'EU reference efficiency, electricity from natural gas', value: FIXED.peAuxRefElec, unit: 'fraction', source: 'Commission Delegated Regulation (EU) 2015/2402', status: 'sourced', refs: ['eu-2015-2402'] },
  { id: 'peAuxRefHeat', label: 'EU reference efficiency, heat from natural gas', value: FIXED.peAuxRefHeat, unit: 'fraction', source: 'Commission Delegated Regulation (EU) 2015/2402', status: 'sourced', refs: ['eu-2015-2402'] },
  { id: 'stegDay', label: 'STEG medium-voltage price, day', value: STEG_TOU.day, unit: 'TND/kWh', source: 'STEG MV time-of-use tariff since 1 Oct 2022, before VAT', status: 'sourced', refs: ['fipa-2024', 'wattnow-steg-mv'] },
  { id: 'stegMorningPeak', label: 'STEG medium-voltage price, summer morning peak', value: STEG_TOU.morningPeak, unit: 'TND/kWh', source: 'STEG MV time-of-use tariff since 1 Oct 2022, before VAT', status: 'sourced', refs: ['fipa-2024', 'wattnow-steg-mv'] },
  { id: 'stegEveningPeak', label: 'STEG medium-voltage price, evening peak', value: STEG_TOU.eveningPeak, unit: 'TND/kWh', source: 'STEG MV time-of-use tariff since 1 Oct 2022, before VAT', status: 'sourced', refs: ['fipa-2024', 'wattnow-steg-mv'] },
  { id: 'stegNight', label: 'STEG medium-voltage price, night', value: STEG_TOU.night, unit: 'TND/kWh', source: 'STEG MV time-of-use tariff since 1 Oct 2022, before VAT', status: 'sourced', refs: ['fipa-2024', 'wattnow-steg-mv'] },
  { id: 'stegDemandCharge', label: 'STEG demand charge (time-of-use)', value: STEG_TOU.demandCharge, unit: 'TND/kW/month', source: 'STEG MV time-of-use tariff, redevance de puissance', status: 'sourced', refs: ['fipa-2024', 'wattnow-steg-mv'] },
];

/** URLs in a source text, without a trailing full stop or bracket. */
const URL_RE = /https?:\/\/[^\s)]*[^\s).,;:]/g;

export const ASSUMPTIONS: MethodAssumption[] = [
  ...(Object.keys(PARAMS) as ParamKey[]).map((id) => {
    const { label, values, unit, source } = PARAMS[id];
    return {
      id,
      label,
      unfavourable: values[0],
      central: values[1],
      favourable: values[2],
      unit,
      source,
      urls: source.match(URL_RE) ?? [],
      refs: PARAM_META[id].refs,
      status: PARAM_META[id].status,
      variesByScenario: values[0] !== values[1] || values[1] !== values[2],
    };
  }),
  ...FIXED_ENTRIES.map(({ value, ...e }) => ({
    ...e,
    unfavourable: value,
    central: value,
    favourable: value,
    urls: e.source.match(URL_RE) ?? [],
    variesByScenario: false,
  })),
];

// ---------------------------------------------------------------------------------------------------------------
// The Djerba demo, computed
// ---------------------------------------------------------------------------------------------------------------

export const DEMO_INPUT = { rooms: 300, city: 'djerba', pool: true, elecPrice: null } as const satisfies SizingInput;

export const DEMO: { label: string; input: SizingInput; result: SizingResult; engineVersion: string } = {
  label: '300-room, 4-star beach hotel in Djerba with a pool (STEG time-of-use prices, before VAT)',
  input: DEMO_INPUT,
  result: sizeHotel(DEMO_INPUT),
  engineVersion: ENGINE_VERSION,
};

// ---------------------------------------------------------------------------------------------------------------
// Sensitivity: what moves the central payback, one input at a time
// ---------------------------------------------------------------------------------------------------------------

export type SensitivityRow = {
  id: ParamKey;
  label: string;
  /** Central payback (years, 1 decimal) with this input at its unfavourable / favourable value, rest central. */
  unfavourablePaybackYears: number;
  favourablePaybackYears: number;
  /** Spread between the two, years: the table is sorted by it. */
  impactYears: number;
};

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

function sensitivity(): { centralPaybackYears: number; plant: { engineKwe: number; chillerKwc: number }; rows: SensitivityRow[] } {
  const kwe = DEMO.result.engineKwe;
  const central = paramsFor('central');
  const payback = (over: Partial<Record<ParamKey, number>>) =>
    evaluateWithParams(DEMO_INPUT, kwe, { ...central, ...over }).paybackYears;
  const rows = (Object.keys(PARAMS) as ParamKey[])
    .map((id) => {
      const [u, , f] = PARAMS[id].values;
      const unfavourablePaybackYears = oneDecimal(payback({ [id]: u }));
      const favourablePaybackYears = oneDecimal(payback({ [id]: f }));
      return {
        id,
        label: PARAMS[id].label,
        unfavourablePaybackYears,
        favourablePaybackYears,
        impactYears: oneDecimal(Math.abs(unfavourablePaybackYears - favourablePaybackYears)),
      };
    })
    .filter((r) => r.impactYears > 0)
    .sort((a, b) => b.impactYears - a.impactYears || a.id.localeCompare(b.id));
  return {
    centralPaybackYears: oneDecimal(payback({})),
    plant: { engineKwe: kwe, chillerKwc: DEMO.result.chillerKwc },
    rows,
  };
}

/**
 * "What moves the central 9-year payback": the demo's headline plant (engine size held fixed; the chiller is
 * re-sized by the engine as usual), central case, one input moved to its unfavourable or favourable value.
 * Inputs that do not move the payback (CO2 factors, fixed values) are left out.
 */
export const SENSITIVITY = sensitivity();

// ---------------------------------------------------------------------------------------------------------------
// How the tool calculates (for a hotel manager) and what it does not model
// ---------------------------------------------------------------------------------------------------------------

export type MethodStep = { id: string; title: string; body: string };

export const METHOD_STEPS: MethodStep[] = [
  {
    id: 'demand',
    title: 'We build your hotel’s energy use, hour by hour',
    body: 'We start from a typical Tunisian 4-star room: how much electricity, hot water and cooling it uses in each hour of a summer day and a winter day. We multiply by your occupied rooms (85% in summer, 48% the rest of the year in the central case), adjust for your city’s climate and add pool heating if you have a pool.',
  },
  {
    id: 'plant',
    title: 'We try 19 plant sizes, from 100 to 1,000 kWe',
    body: 'For each size the gas engine follows your electricity use without selling to the grid. It switches off below half load and between midnight and 06:00. Its waste heat goes to hot water and the pool first; what is left drives an absorption chiller for air conditioning.',
  },
  {
    id: 'year',
    title: 'We turn the two days into a year',
    body: '150 summer days and 215 winter and shoulder days. Each hour of electricity you no longer buy is priced at the real STEG medium-voltage time-of-use tariff for that hour, before VAT. Gas is priced at the STEG medium-pressure tariff.',
  },
  {
    id: 'savings',
    title: 'We compare with what you pay today',
    body: 'Today: all electricity from STEG, cooling from your electric chillers, hot water from a gas boiler. With the plant: less electricity from STEG, more gas for the engine, less for the boiler, plus engine maintenance. The difference is your yearly saving. CO2 avoided is worked out the same way.',
  },
  {
    id: 'size',
    title: 'We keep the size that pays back fastest',
    body: 'Payback is the installed cost divided by the yearly saving. We show the fastest trigeneration plant (with an absorption chiller of at least 50 kWc) and, when it pays back faster, a smaller plant that only makes electricity and hot water.',
  },
  {
    id: 'ranges',
    title: 'We give a range, not a single number',
    body: 'Every result is worked out three times: a favourable case, a central case and an unfavourable case a sceptical reviewer would pick, with different prices, efficiencies, costs and occupancy. The FTE subsidy payback is shown separately because hotel eligibility is not confirmed.',
  },
  {
    id: 'checks',
    title: 'We check the plant makes sense',
    body: 'We warn you if the engine would run fewer than 4,000 full-load hours a year, if it fails the EU high-efficiency test (primary energy saving below 10%), or if the central payback is over 10 years. Then the verdict: good fit (6 years or less), possible fit that needs a study (10 years or less), or weak fit.',
  },
  {
    id: 'study',
    title: 'A feasibility study replaces our estimates with your data',
    body: 'Two 300-room Djerba hotels with a pool get the same result from this tool, even if one has a spa. A study uses your own STEG and gas bills, meter data and an installer quote. One installer quote matters more than every other input combined.',
  },
];

export type Limit = { id: string; title: string; detail: string };

/** "Not modelled yet" in docs/engine/spec.md, in plain words. */
export const LIMITS: Limit[] = [
  { id: 'island-mode', title: 'Blackout cover', detail: 'The plant is not modelled running on its own during a STEG outage (island mode). Do not count on it for blackouts.' },
  { id: 'chilled-water', title: 'Hotels on split units', detail: 'An absorption chiller needs a chilled-water network. The cost of adding one to a hotel cooled by split units is not included.' },
  { id: 'gas-connection', title: 'Gas connection', detail: 'We assume the hotel is on the STEG gas network. Sites without gas are not modelled.' },
  { id: 'tower-water', title: 'Cooling tower water', detail: 'The water used by the absorption chiller’s cooling tower is not counted.' },
  { id: 'heat-derating', title: 'Very hot days', detail: 'Engines and chillers lose output above 40 °C. This derating is not modelled.' },
  { id: 'part-load', title: 'Part-load efficiency', detail: 'The engine keeps the same efficiency at every load above 50%. Real engines are less efficient at part load.' },
  { id: 'typical-days', title: 'Two typical days, not 8,760 hours', detail: 'The year is built from one typical summer day and one typical winter day, not a full hourly year with weather data.' },
  { id: 'finance', title: 'Financing and price changes', detail: 'Simple payback only: no NPV or IRR, no loan, no change in gas or electricity prices over the plant’s life.' },
  { id: 'alternatives', title: 'Other options', detail: 'The tool does not compare trigeneration with solar PV plus efficient electric chillers, which can be the better choice.' },
];
