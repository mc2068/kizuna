// The Djerba demo hotel and small helpers shared by the marketing pages. Every number comes from
// sizeHotel() or src/content/method.ts, never typed into a page.
import { djerbaCase } from '@/content/method';
import { sizeHotel, type SizingInput, type SizingResult } from '@/lib/engine';

export const DEMO_INPUT: SizingInput = {
  rooms: djerbaCase.hotel.rooms,
  city: djerbaCase.hotel.city,
  pool: djerbaCase.hotel.pool,
  elecPrice: null,
};

export function demoResult(): SizingResult {
  return sizeHotel(DEMO_INPUT);
}

/** Central value of an engine assumption, found by the start of its name. */
export function assumption(result: SizingResult, nameStartsWith: string) {
  const a = result.assumptions.find((x) => x.name.startsWith(nameStartsWith));
  if (!a) throw new Error(`No engine assumption starts with "${nameStartsWith}"`);
  return a;
}

/** Query string the tool and the study form both understand. */
export function inputQuery(input: SizingInput): string {
  const q = new URLSearchParams({ rooms: String(input.rooms), city: input.city, pool: input.pool ? '1' : '0' });
  if (input.elecPrice != null) q.set('price', String(input.elecPrice));
  return q.toString();
}

export const toolHref = (input: SizingInput = DEMO_INPUT) => `/tool?${inputQuery(input)}`;
export const requestStudyHref = (input?: SizingInput) => (input ? `/request-study?${inputQuery(input)}` : '/request-study');
