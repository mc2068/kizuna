// STAND-IN for #14 (Hamza owns src/content/method.ts). Content from docs/engine/spec.md,
// docs/research/assumptions-audit.md and the old site's sources page, in the shape the pages need.
// Hamza's version should keep these export names (or tell Gaith what changed). Every number the
// marketing pages show that is not computed by sizeHotel() lives here, next to its source.

export type Reference = {
  id: string;
  title: string;
  publisher: string;
  year?: string;
  url?: string;
  note?: string;
};

/** Ordered list of references. A <Footnote id="..."/> anywhere on the site links to /sources#ref-<id>
 *  and shows the 1-based position in this list. */
export const references: Reference[] = [
  { id: 'engine-model', title: 'Sizing engine v2: spec and results', publisher: '[PRODUCT NAME] team', year: '2026', url: 'https://github.com/mc2068/kizuna/blob/HEAD/docs/engine/spec.md', note: 'The model behind every number on this site, with all parameters and their three values.' },
  { id: 'doe-recip', title: 'Combined Heat and Power Technology Fact Sheet: Reciprocating Engines', publisher: 'US Department of Energy', year: '2017', url: 'https://betterbuildingssolutioncenter.energy.gov/sites/default/files/attachments/CHP_Reciprocating_Engines.pdf', note: 'Engine efficiency, installed cost and maintenance cost by size.' },
  { id: 'doe-absorption', title: 'Combined Heat and Power Technology Fact Sheet: Absorption Chillers', publisher: 'US Department of Energy', year: '2017', url: 'https://www.energy.gov/sites/default/files/2017/06/f35/CHP-Absorption%20Chiller-compliant.pdf', note: 'Absorption chiller COP and installed cost.' },
  { id: 'epa-catalog', title: 'Catalog of CHP Technologies', publisher: 'US Environmental Protection Agency', year: '2015', url: 'https://www.epa.gov/sites/default/files/2015-07/documents/catalog_of_chp_technologies.pdf', note: 'Total efficiency of on-site CHP against separate power and heat.' },
  { id: 'fipa-gas', title: 'Coûts des facteurs (STEG MP1 gas tariff)', publisher: 'FIPA Tunisia', year: '2024', url: 'https://investintunisia.tn/wp-content/uploads/2024/01/Couts-des-facteurs-FIPA-Janvier-2024.pdf', note: 'Medium-pressure gas price for businesses, before VAT.' },
  { id: 'steg-mv', title: 'Facture STEG moyenne tension: guide ligne par ligne', publisher: 'WattNow', year: '2025', url: 'https://www.wattnow.io/fr/facture-steg-moyenne-tension-guide-ligne-par-ligne/', note: 'STEG medium-voltage time-of-use prices and the demand charge.' },
  { id: 'mees-gas', title: 'Tunisia gas import bill soars as output slump continues', publisher: 'MEES', year: '2024', url: 'https://mees.com/2024/5/24/economics-finance/tunisia-gas-import-bill-soars-as-output-slump-continues/d4196120-19d8-11ef-a016-efbe1d7335ca', note: 'Gas makes almost all of Tunisia’s electricity, and a growing share is imported.' },
  { id: 'lowcarbon', title: 'Electricity in Tunisia', publisher: 'LowCarbonPower', year: '2025', url: 'https://lowcarbonpower.org/region/Tunisia', note: 'Grid carbon intensity, 467 to 483 g CO₂ per kWh.' },
  { id: 'ipcc-gas', title: '2006 IPCC Guidelines, Volume 2, default emission factors', publisher: 'IPCC', year: '2006', note: 'Natural gas: 56.1 t CO₂ per TJ.' },
  { id: 'ontt-djerba', title: 'Djerba-Zarzis occupancy, January to August 2026', publisher: 'La Presse via AllAfrica', year: '2026', url: 'https://fr.allafrica.com/stories/202610090697.html', note: 'ONTT figures used for summer and winter occupancy.' },
  { id: 'lapresse-hotels', title: 'Hôtellerie tunisienne: le défi de la maîtrise énergétique', publisher: 'La Presse', year: '2026', url: 'https://www.lapresse.tn/2026/11/05/hotellerie-tunisienne-derriere-le-confort-des-touristes-le-defi-de-la-maitrise-energetique/', note: 'Energy use in 137 audited Tunisian hotels.' },
  { id: 'hotel-energy', title: 'Energy use in hotels per guest-night', publisher: 'ULPGC', year: '2021', url: 'https://accedacris.ulpgc.es/bitstream/10553/111029/1/Energy_use_hotels.pdf', note: 'Used to check the per-room demand curves.' },
  { id: 'fte', title: 'Tunisie: 70% de l’énergie industrielle consommée par 400 entreprises', publisher: 'La Presse', year: '2026', url: 'https://www.lapresse.tn/2026/08/11/tunisie-70-de-lenergie-industrielle-consommee-par-400-entreprises/', note: 'The FTE grant. Eligibility for hotels is not confirmed.' },
  { id: 'warda', title: 'Pâtes Warda trigeneration plant, Sousse', publisher: 'Clarke Energy', url: 'https://www.clarke-energy.com/?p=128097' },
  { id: 'medicef', title: 'Medicef Pharma trigeneration, Sidi Thabet', publisher: 'Clarke Energy', url: 'https://www.clarke-energy.com/?p=128465' },
  { id: 'cogen-163', title: '163 mégawatts pour les projets de production d’énergie combinée', publisher: 'L’Economiste Maghrébin', year: '2024', url: 'https://www.leconomistemaghrebin.com/2024/05/04/163-megawatts-pour-les-projets-de-production-denergie-combinee/' },
];

/** Five steps, in plain words, from docs/engine/spec.md. */
export const steps: { title: string; body: string }[] = [
  { title: 'Build the hotel’s hourly demand', body: 'Two typical days, summer and winter: electricity, hot water and cooling for every hour, scaled by rooms, occupancy, city climate and the pool.' },
  { title: 'Try every engine size', body: 'From 100 to 1,000 kWe. For each size, the engine follows the hotel’s electricity need and switches off below half load. Its heat goes to hot water first, then to the absorption chiller.' },
  { title: 'Price both worlds', body: 'Today: STEG electricity hour by hour at time-of-use prices, plus a gas boiler. With the plant: engine gas, maintenance, and whatever the hotel still buys. All prices before VAT.' },
  { title: 'Keep the size that pays back fastest', body: 'The tool reports the best trigeneration plant and, when it pays back faster, a smaller engine for hot water and pool heat only.' },
  { title: 'Run it three times', body: 'With sceptical, central and enthusiastic values for every assumption. You see a range, not a promise, and a verdict on the central case.' },
];

/** One input at a time, from the central 9-year payback of the Djerba demo (spec.md). */
export const sensitivity = {
  baselineYears: 9,
  rows: [
    { input: 'Engine capex', values: '9,100 / 5,000 TND per kWe', unfavourableYears: 11.3, favourableYears: 6.6 },
    { input: 'Gas price', values: '0.09 / 0.068 TND per kWh', unfavourableYears: 10.9, favourableYears: 8.9 },
    { input: 'Winter occupancy', values: '40% / 55%', unfavourableYears: 9.9, favourableYears: 8.5 },
    { input: 'Maintenance', values: '0.058 / 0.03 TND per kWh', unfavourableYears: 9.9, favourableYears: 8.4 },
    { input: 'Engine efficiency', values: '35% / 40% electrical', unfavourableYears: 9.6, favourableYears: 8.5 },
    { input: 'Demand-charge saving', values: 'not counted / counted', unfavourableYears: 8.9, favourableYears: 7.8 },
  ],
  note: 'Chiller capex, chiller efficiency and summer occupancy each move it by half a year or less.',
};

/** Not modelled yet (spec.md). */
export const limits: string[] = [
  'Island mode during blackouts: the plant is modelled grid-connected only.',
  'A chilled-water retrofit for hotels cooled by split units.',
  'The gas connection itself: sites without gas are not screened out yet.',
  'Water use of the cooling tower.',
  'Engine derating above 40 °C.',
  'Part-load efficiency curves.',
  'A full 8,760-hour year (we use two typical days).',
  'NPV and IRR with price escalation.',
  'A comparison with solar PV and an efficient electric chiller.',
];

/** Djerba case study facts that the engine does not return directly (spec.md). */
export const djerbaCase = {
  hotel: { rooms: 300, city: 'djerba' as const, pool: true, stars: 4 },
  winterLoadKw: { low: 90, high: 190 },
  winterOccupancy: 0.48,
  winterDays: 215,
  summerDays: 150,
  minLoad: 0.5,
  v1: { engineKwe: 450, fullLoadHours: 2400, paybackYears: 20 },
};

/** Proof that trigeneration runs in Tunisia (factories, not hotels). */
export const proof = [
  { id: 'warda', figure: '−32%', name: 'Pâtes Warda, Sousse', body: 'Energy bill after a 4.4 MWe plant, with over 8,000 t of CO₂ avoided a year.' },
  { id: 'medicef', figure: '800 kWe', name: 'Medicef Pharma', body: 'With 724 kW of absorption cooling: trigeneration at a large hotel’s scale.' },
  { id: 'cogen-163', figure: '163 MW', name: '52 Tunisian companies', body: 'Installed cogeneration across industry.' },
];

/** Context for "why Tunisian hotels" (How it works). */
export const tunisiaFacts = [
  { id: 'steg-mv', figure: '0.417 TND', label: 'per kWh at the STEG summer morning peak, before VAT, against 0.222 at night.' },
  { id: 'mees-gas', figure: '>96%', label: 'of Tunisia’s electricity is made from gas, much of it imported.' },
  { id: 'lapresse-hotels', figure: '137', label: 'Tunisian hotels audited for energy: cooling and hot water dominate the bill.' },
];

/** Verdict rules the engine applies to the central payback (spec.md, role guides). */
export const verdictRules = {
  goodMaxYears: 6,
  possibleMaxYears: 10,
  minFullLoadHours: 4000,
};
