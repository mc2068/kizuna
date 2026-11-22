// Server-side snapshots of a sizing run (#13). Saved projects and study requests store what snapshot() returns,
// so a share link, a PDF and a lead page always show the numbers the server computed, with the engine version
// they were computed with. Results sent by a browser are never trusted.
//
// Also home to the one parser of tool inputs in a URL (parseToolSearchParams), shared by /tool and the
// Request a study form.

import { z } from 'zod';
import { ENGINE_VERSION } from './version';
import { sizeHotel } from './model';
import { CITIES, type City, type SizingInput, type SizingResult } from './types';

// ---------------------------------------------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------------------------------------------

export const ROOMS_RANGE = { min: 50, max: 800 } as const;
/** Flat electricity price, TND/kWh before VAT. STEG medium voltage is 0.22-0.42 depending on the hour. */
export const ELEC_PRICE_RANGE = { min: 0.05, max: 1 } as const;
export const DEFAULT_INPUT: SizingInput = { rooms: 300, city: 'djerba', pool: true, elecPrice: null };

/** Checkbox values from a form ("on", "true") or JSON booleans. */
const boolish = z.preprocess(
  (v) => (typeof v === 'string' ? ['on', 'true', '1', 'yes'].includes(v.toLowerCase()) : v),
  z.boolean({ error: 'Pool must be yes or no.' }),
);

/** Empty, missing or null = STEG time-of-use tariff. */
const elecPrice = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : typeof v === 'string' ? Number(v) : v),
  z
    .number({ error: 'Electricity price must be a number in TND/kWh, or empty for the STEG tariff.' })
    .min(ELEC_PRICE_RANGE.min, { error: `Electricity price must be at least ${ELEC_PRICE_RANGE.min} TND/kWh.` })
    .max(ELEC_PRICE_RANGE.max, { error: `Electricity price must be at most ${ELEC_PRICE_RANGE.max} TND/kWh (before VAT).` })
    .nullable(),
);

/** The tool inputs. Accepts JSON or form values (strings); unknown keys are dropped. */
export const sizingInputSchema = z.object({
  rooms: z.coerce
    .number({ error: 'Rooms must be a number.' })
    .int({ error: 'Rooms must be a whole number.' })
    .min(ROOMS_RANGE.min, { error: `Rooms must be at least ${ROOMS_RANGE.min}.` })
    .max(ROOMS_RANGE.max, { error: `Rooms must be at most ${ROOMS_RANGE.max}.` }),
  city: z.enum(CITIES as [City, ...City[]], { error: `City must be one of: ${CITIES.join(', ')}.` }),
  pool: boolish,
  elecPrice,
});

// ---------------------------------------------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------------------------------------------

/** What projects.results/inputs/engine_version and leads.results/inputs/engine_version store. */
export type Snapshot = { inputs: SizingInput; results: SizingResult; engineVersion: string };

export type SnapshotErrors = Partial<Record<keyof SizingInput | 'form', string[]>>;

export type SafeSnapshot = { ok: true; snapshot: Snapshot } | { ok: false; fieldErrors: SnapshotErrors };

function run(inputs: SizingInput): Snapshot {
  return { inputs, results: sizeHotel(inputs), engineVersion: ENGINE_VERSION };
}

/** Validate, then size on the server. Throws a ZodError on invalid input. */
export function snapshot(input: unknown): Snapshot {
  return run(sizingInputSchema.parse(input));
}

/** Like snapshot(), but returns field errors (same shape as submitStudyRequest's) instead of throwing. */
export function safeSnapshot(input: unknown): SafeSnapshot {
  const parsed = sizingInputSchema.safeParse(input);
  if (parsed.success) return { ok: true, snapshot: run(parsed.data) };
  const fieldErrors: SnapshotErrors = {};
  for (const issue of parsed.error.issues) {
    const key = (issue.path[0] ?? 'form') as keyof SnapshotErrors;
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, fieldErrors };
}

/** True when a stored snapshot was computed by another engine version: show "calculated with an older version". */
export function isStale(s: Pick<Snapshot, 'engineVersion'>): boolean {
  return s.engineVersion !== ENGINE_VERSION;
}

/** Recompute a stored snapshot with the current engine, from its stored inputs (validated again). */
export function rerun(s: Pick<Snapshot, 'inputs'>): Snapshot {
  return snapshot(s.inputs);
}

// ---------------------------------------------------------------------------------------------------------------
// URL <-> inputs: /tool?rooms=300&city=djerba&pool=1&price=
// ---------------------------------------------------------------------------------------------------------------

/** Next.js `searchParams` (awaited) or a URLSearchParams. */
export type SearchParamsLike = Record<string, string | string[] | undefined> | URLSearchParams;

function read(params: SearchParamsLike, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

const isCity = (v: unknown): v is City => typeof v === 'string' && (CITIES as readonly string[]).includes(v);

/**
 * Tool inputs from a URL. Never throws: a link is user input, so missing or invalid values fall back to the
 * Djerba demo hotel and numbers are clamped into range. Keys: rooms, city, pool (1/0), price (empty = STEG).
 */
export function parseToolSearchParams(params: SearchParamsLike): SizingInput {
  const rooms = Number(read(params, 'rooms'));
  const city = read(params, 'city')?.trim().toLowerCase();
  const pool = read(params, 'pool')?.trim().toLowerCase();
  const priceRaw = read(params, 'price')?.trim();
  const price = priceRaw ? Number(priceRaw) : NaN;
  return {
    rooms: Number.isFinite(rooms) && read(params, 'rooms')?.trim()
      ? Math.min(ROOMS_RANGE.max, Math.max(ROOMS_RANGE.min, Math.round(rooms)))
      : DEFAULT_INPUT.rooms,
    city: isCity(city) ? city : DEFAULT_INPUT.city,
    pool: pool === undefined || pool === '' ? DEFAULT_INPUT.pool : !['0', 'false', 'no', 'off'].includes(pool),
    elecPrice: Number.isFinite(price)
      ? Math.min(ELEC_PRICE_RANGE.max, Math.max(ELEC_PRICE_RANGE.min, Math.round(price * 1000) / 1000))
      : null,
  };
}

/** The inverse: "?rooms=300&city=djerba&pool=1&price=". parseToolSearchParams(toToolSearchParams(x)) equals x. */
export function toToolSearchParams(input: SizingInput): string {
  const params = new URLSearchParams({
    rooms: String(input.rooms),
    city: input.city,
    pool: input.pool ? '1' : '0',
    price: input.elecPrice == null ? '' : String(input.elecPrice),
  });
  return `?${params.toString()}`;
}
