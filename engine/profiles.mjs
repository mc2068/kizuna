// Hourly load profiles for a Tunisian 4-star beach hotel. Copied from mc2068/kizuna-trigeneration site/js/profiles.js;
// only OCCUPANCY changed (see docs/engine/spec.md). Index 0 = 00:00-01:00, index 23 = 23:00-24:00. All values in kW.
//
// How these were built
// - Shapes: typical hotel daily patterns (morning and evening hot-water peaks, cooling peak mid-afternoon,
//   evening lighting/restaurant peak), as suggested in docs/research/trigeneration-research.md, which points
//   to US OpenEI hotel load shapes scaled to Tunisian totals.
// - Totals: daily kWh per occupied room tuned so that, over a year (150 summer days at 90% occupancy,
//   215 winter days at 50%), the hotel matches these benchmarks:
//     * cooling = 29.1% of electricity (target 29%, 137 audited Tunisian hotels, ANME via La Presse,
//       https://www.lapresse.tn/2026/11/05/hotellerie-tunisienne-derriere-le-confort-des-touristes-le-defi-de-la-maitrise-energetique/)
//     * ~225 kWh of final energy per m2 per year at ~70 m2 of building per room
//       (Mediterranean hotels: 215 Italy, 273 Greece, 287 Spain kWh/m2,
//       https://www.research.unipd.it/retrieve/46ce16e3-4762-41ff-828e-786aa08b7a61/2023_Bertolazzi_Micocci_SBE_Thessaloniki.pdf)
//     * ~32 kWh per guest-night, above the ~18-24 measured in Balearic hotels
//       (https://accedacris.ulpgc.es/bitstream/10553/111029/1/Energy_use_hotels.pdf) because Tunisia needs
//       far more cooling and a heated pool is included. Flagged as a limit in docs/method.md.
//   Yearly totals per available room: electricity 7,944 kWh (5,632 non-cooling + 2,312 for cooling at COP 3),
//   cooling produced 6,935 kWh_c, hot water + space heating 5,655 kWh_th, pool 1,556 kWh_th.
// - To verify: Mechri & Amara (2021), "Investigation and analysis of energy and water use of hotel buildings
//   in Tunisia", Energy and Buildings 241, has measured Tunisian hotel data we could not access.

/**
 * Per OCCUPIED room, 24 hourly values in kW.
 * elec = electricity excluding space cooling (lighting, pumps, lifts, kitchen, laundry, plug loads).
 * heat = hot water and space heating, kWth (showers, kitchen, laundry; plus heating in winter).
 * cool = space cooling, kW of cooling delivered (kWc), not chiller electricity.
 */
export const PER_ROOM = {
  summer: {
    // ASSUMPTION: 25 kWh/day. Night base ~0.77 kW, breakfast bump 08:00, lunch 13:00,
    // evening peak 20:00-22:00 (lighting, restaurants, entertainment).
    elec: [0.91, 0.81, 0.77, 0.76, 0.77, 0.80, 0.89, 1.01, 1.09, 1.07, 1.03, 1.07, 1.15, 1.20, 1.15, 1.04, 0.95, 0.96, 1.09, 1.28, 1.43, 1.43, 1.28, 1.07],
    // ASSUMPTION: 18 kWh_th/day = 2 guests x 120 L at +45 K (~12.6 kWh) + kitchen and laundry + ~20% distribution
    // losses. Shower peaks at 07:00-09:00 and 19:00-21:00, small kitchen bump at lunch.
    heat: [0.37, 0.32, 0.30, 0.31, 0.38, 0.60, 1.02, 1.43, 1.43, 1.05, 0.70, 0.63, 0.71, 0.70, 0.57, 0.48, 0.53, 0.74, 1.02, 1.22, 1.22, 1.02, 0.73, 0.51],
    // ASSUMPTION: 45 kWh_c/day, tuned to the 29% cooling share above. Never below ~45% of peak (rooms occupied at
    // night, warm nights), peak 2.76 kWc at 15:00. A 300-room hotel at 90% occupancy peaks at ~745 kWc.
    cool: [1.36, 1.31, 1.28, 1.26, 1.28, 1.31, 1.36, 1.45, 1.57, 1.74, 1.94, 2.16, 2.39, 2.58, 2.71, 2.76, 2.71, 2.58, 2.39, 2.16, 1.94, 1.74, 1.57, 1.45],
  },
  winter: {
    // ASSUMPTION: 21 kWh/day. Lower than summer (fewer outdoor activities), evening peak earlier (sunset ~18:00).
    elec: [0.65, 0.61, 0.60, 0.59, 0.60, 0.63, 0.70, 0.81, 0.89, 0.88, 0.85, 0.87, 0.92, 0.93, 0.89, 0.88, 0.96, 1.12, 1.28, 1.35, 1.27, 1.09, 0.89, 0.74],
    // ASSUMPTION: 30 kWh_th/day = hot water with colder mains water (~20 kWh) + space heating morning and evening (~10 kWh).
    heat: [0.79, 0.69, 0.67, 0.70, 0.85, 1.18, 1.64, 2.01, 2.01, 1.67, 1.29, 1.11, 1.11, 1.07, 0.95, 0.89, 1.01, 1.28, 1.60, 1.81, 1.81, 1.60, 1.27, 0.98],
    // ASSUMPTION: 8 kWh_c/day. Not zero: the 215 "winter" days include the shoulder months (April-May, October)
    // that still need some afternoon cooling.
    cool: [0.13, 0.12, 0.12, 0.12, 0.12, 0.13, 0.13, 0.15, 0.18, 0.25, 0.34, 0.47, 0.60, 0.72, 0.79, 0.79, 0.72, 0.60, 0.47, 0.34, 0.25, 0.18, 0.15, 0.13],
  },
};

/** The pool profile below is for a hotel of this many rooms; the engine scales it by rooms / POOL_REFERENCE_ROOMS. */
export const POOL_REFERENCE_ROOMS = 300;

/**
 * Heating for one outdoor pool (~500 m2) at a 300-room hotel, kWth, 24 hourly values.
 * ASSUMPTION: losses (evaporation, radiation to the night sky) peak before dawn.
 * Summer average 15 kW (sun covers most losses); winter average 80 kW (~160 W/m2, partly heated, no cover).
 */
export const POOL = {
  summer: [16.5, 17.6, 18.6, 19.3, 19.6, 19.3, 18.6, 17.6, 16.5, 15.3, 14.3, 13.4, 12.8, 12.4, 12.1, 11.9, 11.8, 11.9, 12.1, 12.4, 12.8, 13.4, 14.3, 15.3],
  winter: [85.5, 89.8, 93.6, 96.1, 97.0, 96.1, 93.6, 89.8, 85.5, 81.2, 77.3, 74.2, 71.8, 70.2, 69.2, 68.5, 68.2, 68.5, 69.2, 70.2, 71.8, 74.2, 77.3, 81.2],
};

/**
 * City climate multipliers, Djerba = 1. `cool` scales PER_ROOM cooling, `heat` scales PER_ROOM heat.
 * ASSUMPTION: from approximate annual degree-days (base 18 °C), to verify on degreedays.net:
 *   cooling degree-days  Djerba ~1,450  Sousse ~1,250  Hammamet ~1,150  Tozeur ~2,100
 *   heating degree-days  Djerba ~500    Sousse ~650    Hammamet ~750    Tozeur ~750
 * Damped, because a hotel's load is not purely weather-driven:
 *   cool = 0.5 + 0.5 x (CDD / CDD Djerba)   (internal gains, occupied rooms)
 *   heat = 0.7 + 0.3 x (HDD / HDD Djerba)   (most hotel heat is hot water, not space heating)
 * Tozeur (Saharan) is the hottest in summer and has cold desert nights in winter.
 */
export const CITY = {
  djerba: { cool: 1.0, heat: 1.0 },
  sousse: { cool: 0.93, heat: 1.09 },
  hammamet: { cool: 0.9, heat: 1.15 },
  tozeur: { cool: 1.22, heat: 1.15 },
};

/**
 * Average room occupancy for each season.
 * Central case, estimated from ONTT: Djerba-Zarzis averaged 64.4% over Jan-Aug 2026 (La Presse, 9 Oct 2026,
 * https://fr.allafrica.com/stories/202610090697.html); 90% was a one-day July 2025 peak. See docs/engine/spec.md.
 */
export const OCCUPANCY = { summer: 0.85, winter: 0.48 };
