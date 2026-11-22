// Hourly load profiles for a Tunisian 4-star beach hotel. Port of engine/profiles.mjs (reference model v2):
// keep the two files identical in value. How the profiles were built, with sources, is documented there.
// Index 0 = 00:00-01:00, index 23 = 23:00-24:00. All values in kW.

import type { City } from './types';

export type Season = 'summer' | 'winter';

/** 24 hourly values. */
export type DayProfile = readonly number[];

export type RoomProfile = { elec: DayProfile; heat: DayProfile; cool: DayProfile };

/**
 * Per OCCUPIED room, 24 hourly values in kW.
 * elec = electricity excluding space cooling. heat = hot water and space heating, kWth.
 * cool = space cooling delivered, kWc (not chiller electricity).
 */
export const PER_ROOM: Record<Season, RoomProfile> = {
  summer: {
    // ASSUMPTION: 25 kWh/day.
    elec: [0.91, 0.81, 0.77, 0.76, 0.77, 0.8, 0.89, 1.01, 1.09, 1.07, 1.03, 1.07, 1.15, 1.2, 1.15, 1.04, 0.95, 0.96, 1.09, 1.28, 1.43, 1.43, 1.28, 1.07],
    // ASSUMPTION: 18 kWh_th/day.
    heat: [0.37, 0.32, 0.3, 0.31, 0.38, 0.6, 1.02, 1.43, 1.43, 1.05, 0.7, 0.63, 0.71, 0.7, 0.57, 0.48, 0.53, 0.74, 1.02, 1.22, 1.22, 1.02, 0.73, 0.51],
    // ASSUMPTION: 45 kWh_c/day, peak 2.76 kWc at 15:00.
    cool: [1.36, 1.31, 1.28, 1.26, 1.28, 1.31, 1.36, 1.45, 1.57, 1.74, 1.94, 2.16, 2.39, 2.58, 2.71, 2.76, 2.71, 2.58, 2.39, 2.16, 1.94, 1.74, 1.57, 1.45],
  },
  winter: {
    // ASSUMPTION: 21 kWh/day.
    elec: [0.65, 0.61, 0.6, 0.59, 0.6, 0.63, 0.7, 0.81, 0.89, 0.88, 0.85, 0.87, 0.92, 0.93, 0.89, 0.88, 0.96, 1.12, 1.28, 1.35, 1.27, 1.09, 0.89, 0.74],
    // ASSUMPTION: 30 kWh_th/day (hot water with colder mains water + space heating).
    heat: [0.79, 0.69, 0.67, 0.7, 0.85, 1.18, 1.64, 2.01, 2.01, 1.67, 1.29, 1.11, 1.11, 1.07, 0.95, 0.89, 1.01, 1.28, 1.6, 1.81, 1.81, 1.6, 1.27, 0.98],
    // ASSUMPTION: 8 kWh_c/day (shoulder months still need afternoon cooling).
    cool: [0.13, 0.12, 0.12, 0.12, 0.12, 0.13, 0.13, 0.15, 0.18, 0.25, 0.34, 0.47, 0.6, 0.72, 0.79, 0.79, 0.72, 0.6, 0.47, 0.34, 0.25, 0.18, 0.15, 0.13],
  },
};

/** The pool profile is for a hotel of this many rooms; the engine scales it by rooms / POOL_REFERENCE_ROOMS. */
export const POOL_REFERENCE_ROOMS = 300;

/** Heating for one outdoor pool (~500 m2) at a 300-room hotel, kWth. ASSUMPTION: losses peak before dawn. */
export const POOL: Record<Season, DayProfile> = {
  summer: [16.5, 17.6, 18.6, 19.3, 19.6, 19.3, 18.6, 17.6, 16.5, 15.3, 14.3, 13.4, 12.8, 12.4, 12.1, 11.9, 11.8, 11.9, 12.1, 12.4, 12.8, 13.4, 14.3, 15.3],
  winter: [85.5, 89.8, 93.6, 96.1, 97.0, 96.1, 93.6, 89.8, 85.5, 81.2, 77.3, 74.2, 71.8, 70.2, 69.2, 68.5, 68.2, 68.5, 69.2, 70.2, 71.8, 74.2, 77.3, 81.2],
};

export type CityMultiplier = { cool: number; heat: number };

/** City climate multipliers, Djerba = 1. ASSUMPTION: damped degree-day ratios (see engine/profiles.mjs). */
export const CITY: Record<City, CityMultiplier> = {
  djerba: { cool: 1.0, heat: 1.0 },
  sousse: { cool: 0.93, heat: 1.09 },
  hammamet: { cool: 0.9, heat: 1.15 },
  tozeur: { cool: 1.22, heat: 1.15 },
};

/** Central-case average room occupancy per season (ONTT Djerba-Zarzis, see docs/engine/spec.md). */
export const OCCUPANCY: Record<Season, number> = { summer: 0.85, winter: 0.48 };
