// Role 3: marketing content that is not part of the method (src/content/method.ts, Hamza). Facts about
// the demo hotel are computed with the engine; the rest carries a reference id from REFERENCES or
// MARKETING_REFERENCES, so every claim has a footnote.
import { siteConfig } from '@/config/site';
import { DEMO, DEMO_INPUT } from '@/content/method';
import { FIXED, PARAMS, STEG_TOU, WARN, evaluateSize } from '@/lib/engine';

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@example.com';

/** References for marketing claims (proof, context). Shown after the method references on /sources. */
export const MARKETING_REFERENCES = [
  { id: 'engine-model', title: 'Sizing engine v2: spec and results', publisher: `${siteConfig.name} team`, url: 'https://github.com/mc2068/kizuna/blob/HEAD/docs/engine/spec.md', accessed: '2026-11-22' },
  { id: 'epa-catalog', title: 'Catalog of CHP Technologies', publisher: 'US Environmental Protection Agency', url: 'https://www.epa.gov/sites/default/files/2015-07/documents/catalog_of_chp_technologies.pdf', accessed: '2026-11-22' },
  { id: 'mees-gas', title: 'Tunisia gas import bill soars as output slump continues', publisher: 'MEES', url: 'https://mees.com/2024/5/24/economics-finance/tunisia-gas-import-bill-soars-as-output-slump-continues/d4196120-19d8-11ef-a016-efbe1d7335ca', accessed: '2026-11-22' },
  { id: 'fte', title: 'Tunisie: 70% de l’énergie industrielle consommée par 400 entreprises (FTE grant)', publisher: 'La Presse', url: 'https://www.lapresse.tn/2026/08/11/tunisie-70-de-lenergie-industrielle-consommee-par-400-entreprises/', accessed: '2026-11-22' },
  { id: 'warda', title: 'Pâtes Warda trigeneration plant, Sousse', publisher: 'Clarke Energy', url: 'https://www.clarke-energy.com/?p=128097', accessed: '2026-11-22' },
  { id: 'medicef', title: 'Medicef Pharma trigeneration, Sidi Thabet', publisher: 'Clarke Energy', url: 'https://www.clarke-energy.com/?p=128465', accessed: '2026-11-22' },
  { id: 'cogen-163', title: '163 mégawatts pour les projets de production d’énergie combinée', publisher: 'L’Economiste Maghrébin', url: 'https://www.leconomistemaghrebin.com/2024/05/04/163-megawatts-pour-les-projets-de-production-denergie-combinee/', accessed: '2026-11-22' },
] as const;

/** Proof that trigeneration runs in Tunisia (factories, not hotels). */
export const PROOF = [
  { id: 'warda', figure: '−32%', name: 'Pâtes Warda, Sousse', body: 'Energy bill after a 4.4 MWe plant, with over 8,000 t of CO₂ avoided a year.' },
  { id: 'medicef', figure: '800 kWe', name: 'Medicef Pharma', body: 'With 724 kW of absorption cooling: trigeneration at a large hotel’s scale.' },
  { id: 'cogen-163', figure: '163 MW', name: '52 Tunisian companies', body: 'Installed cogeneration across industry.' },
] as const;

const tnd = (n: number) => `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 }).format(n)} TND`;

/** Context for "why Tunisian hotels" (How it works). Tariffs come from the engine's STEG_TOU. */
export const TUNISIA_FACTS = [
  { id: 'wattnow-steg-mv', figure: tnd(STEG_TOU.morningPeak), label: `per kWh at the STEG summer morning peak, before VAT, against ${tnd(STEG_TOU.night)} at night.` },
  { id: 'mees-gas', figure: '>96%', label: 'of Tunisia’s electricity is made from gas, much of it imported.' },
  { id: 'anme-hotels-2026', figure: '137', label: 'Tunisian hotels audited for energy: cooling and hot water dominate the bill.' },
] as const;

/** Verdict rules, as the engine applies them to the central payback (docs/engine/spec.md). */
export const VERDICT_RULES = {
  goodMaxYears: 6,
  possibleMaxYears: WARN.maxCentralPaybackYears,
  minFullLoadHours: WARN.minFullLoadHours,
} as const;

/** The demo hotel is a 4-star beach hotel (DEMO.label in method.ts). */
export const DEMO_STARS = 4;

/** The first (v1) design for the demo hotel, re-run with today's engine: sized for summer. */
export const OLD_DESIGN_KWE = 450;

/** Facts for the Djerba case study, all from the engine. */
export function djerbaFacts() {
  const old = evaluateSize(DEMO_INPUT, OLD_DESIGN_KWE, 'central');
  return {
    stars: DEMO_STARS,
    winterOccupancy: PARAMS.occupancyWinter.values[1],
    winterDays: FIXED.winterDays,
    minLoad: FIXED.minLoad,
    old: { engineKwe: OLD_DESIGN_KWE, fullLoadHours: old.fullLoadHours, paybackYears: old.paybackYears },
    result: DEMO.result,
  };
}
