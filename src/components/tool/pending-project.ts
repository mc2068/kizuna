// A project the visitor asked to save before signing in (#21). It waits in localStorage while they
// sign in by magic link, and /tool?resume=1 saves it once on return. If storage is unavailable the
// hotel name rides in the return URL instead (the inputs are always in it), so nothing is lost.
// Only the inputs and the name are kept: the server computes the results when it saves.
import type { SizingInput } from '@/lib/engine';
import { parseToolInputs, toSearchString } from './url-state';

export const PENDING_KEY = 'pending-project';
/** A pending project older than this is dropped instead of saved. */
export const PENDING_TTL_MS = 24 * 60 * 60 * 1000;
export const HOTEL_NAME = { min: 2, max: 80 } as const;

export type PendingProject = { hotelName: string; inputs: SizingInput; savedAt: number };

/** The trimmed hotel name, or null when it is too short or too long. */
export function cleanHotelName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  return name.length >= HOTEL_NAME.min && name.length <= HOTEL_NAME.max ? name : null;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Keeps the project for after sign-in. False when storage is unavailable (private mode, blocked). */
export function storePending(project: PendingProject, s: StorageLike | null = storage()): boolean {
  if (!s) return false;
  try {
    s.setItem(PENDING_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

function isPending(v: unknown): v is PendingProject {
  if (!v || typeof v !== 'object') return false;
  const p = v as Record<string, unknown>;
  return typeof p.hotelName === 'string' && typeof p.savedAt === 'number' && typeof p.inputs === 'object' && p.inputs !== null;
}

/**
 * Reads and removes the pending project, so a second call (a re-render, a reload, a second tab)
 * finds nothing and the project is saved once. Null when there is none, it is malformed or older
 * than 24 hours. Inputs go through the same parser as the URL.
 */
export function takePending(nowMs = Date.now(), s: StorageLike | null = storage()): PendingProject | null {
  if (!s) return null;
  let raw: string | null;
  try {
    raw = s.getItem(PENDING_KEY);
    s.removeItem(PENDING_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isPending(value) || nowMs - value.savedAt > PENDING_TTL_MS || value.savedAt > nowMs + 60_000) return null;
  const hotelName = cleanHotelName(value.hotelName);
  if (!hotelName) return null;
  const inputs = parseToolInputs(toQuery(value.inputs));
  return { hotelName, inputs, savedAt: value.savedAt };
}

function toQuery(inputs: unknown): Record<string, string> {
  const i = (inputs ?? {}) as Partial<SizingInput>;
  return {
    rooms: String(i.rooms ?? ''),
    city: String(i.city ?? ''),
    pool: i.pool === false ? '0' : '1',
    price: i.elecPrice == null ? '' : String(i.elecPrice),
  };
}

/**
 * Where sign-in sends the visitor back: /tool with the inputs and resume=1. When the project could
 * not be stored, the hotel name goes in the URL too.
 */
export function resumePath(inputs: SizingInput, hotelNameInUrl?: string): string {
  const params = new URLSearchParams(toSearchString(inputs));
  params.set('resume', '1');
  if (hotelNameInUrl) params.set('hotel', hotelNameInUrl);
  return `/tool?${params.toString()}`;
}

/** The project to save on /tool?resume=1: from storage, else from the URL (the fallback above). */
export function pendingFromResume(search: URLSearchParams, nowMs = Date.now(), s: StorageLike | null = storage()): PendingProject | null {
  if (search.get('resume') !== '1') return null;
  const stored = takePending(nowMs, s);
  if (stored) return stored;
  const hotelName = cleanHotelName(search.get('hotel') ?? '');
  return hotelName ? { hotelName, inputs: parseToolInputs(search), savedAt: nowMs } : null;
}

/** The current URL without resume and hotel, for history.replaceState after the save. */
export function withoutResume(pathname: string, search: string, hash = ''): string {
  const params = new URLSearchParams(search);
  params.delete('resume');
  params.delete('hotel');
  const rest = params.toString();
  return `${pathname}${rest ? `?${rest}` : ''}${hash}`;
}
