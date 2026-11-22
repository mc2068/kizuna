// Tool inputs <-> URL query (/tool?rooms=300&city=djerba&pool=1&price=), so a result can be linked.
// Invalid or missing values fall back to the defaults (the Djerba demo hotel) or are clamped.
import { CITIES, type City, type SizingInput } from '@/lib/engine';

export const ROOMS = { min: 50, max: 800, step: 10 } as const;
export const PRICE = { min: 0, max: 2, step: 0.005 } as const;

export const DEFAULT_INPUTS: SizingInput = { rooms: 300, city: 'djerba', pool: true, elecPrice: null };

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function read(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

export function clampRooms(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_INPUTS.rooms;
  const stepped = Math.round(value / ROOMS.step) * ROOMS.step;
  return Math.min(ROOMS.max, Math.max(ROOMS.min, stepped));
}

export function clampPrice(value: number): number {
  return Math.min(PRICE.max, Math.max(PRICE.min, Math.round(value * 1000) / 1000));
}

export function isCity(value: unknown): value is City {
  return typeof value === 'string' && (CITIES as readonly string[]).includes(value);
}

export function parseToolInputs(params: RawParams): SizingInput {
  const rooms = read(params, 'rooms');
  const city = read(params, 'city')?.toLowerCase();
  const pool = read(params, 'pool');
  const price = read(params, 'price')?.trim();
  const priceNum = price ? Number(price) : NaN;
  return {
    rooms: rooms ? clampRooms(Number(rooms)) : DEFAULT_INPUTS.rooms,
    city: isCity(city) ? city : DEFAULT_INPUTS.city,
    pool: pool === undefined ? DEFAULT_INPUTS.pool : !['0', 'false', 'no'].includes(pool.toLowerCase()),
    elecPrice: Number.isFinite(priceNum) ? clampPrice(priceNum) : null,
  };
}

export function toSearchString(input: SizingInput): string {
  const params = new URLSearchParams({
    rooms: String(input.rooms),
    city: input.city,
    pool: input.pool ? '1' : '0',
    price: input.elecPrice == null ? '' : String(input.elecPrice),
  });
  return `?${params.toString()}`;
}

export function sameInputs(a: SizingInput, b: SizingInput): boolean {
  return a.rooms === b.rooms && a.city === b.city && a.pool === b.pool && a.elecPrice === b.elecPrice;
}
