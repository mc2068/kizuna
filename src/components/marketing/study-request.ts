// Study request (#20): the browser-side schema for react-hook-form. The server validates again with
// studyRequestSchema in @/lib/db (Mohamed's #19); bounds come from the engine so both agree.
import { z } from 'zod';
import { CITIES, ELEC_PRICE_RANGE, ROOMS_RANGE, type City, type SizingInput, type SearchParamsLike } from '@/lib/engine';

export const ROOMS = ROOMS_RANGE;
export const PRICE = ELEC_PRICE_RANGE;

/** Error codes; the form translates them with messages/en/forms.json (studyForm.errors.*). */
export const studyRequestSchema = z.object({
  contactName: z.string().trim().min(1, 'required').min(2, 'tooShort').max(120, 'tooLong'),
  email: z.string().trim().min(1, 'required').max(200, 'tooLong').pipe(z.email('email')),
  phone: z.string().trim().max(40, 'tooLong').optional().default(''),
  hotelName: z.string().trim().min(1, 'required').min(2, 'tooShort').max(160, 'tooLong'),
  city: z.enum(CITIES as unknown as [City, ...City[]], { error: 'city' }),
  rooms: z.coerce.number({ error: 'rooms' }).int('rooms').min(ROOMS.min, 'rooms').max(ROOMS.max, 'rooms'),
  pool: z.boolean(),
  elecPrice: z
    .union([z.literal(''), z.coerce.number({ error: 'elecPrice' }).min(PRICE.min, 'elecPrice').max(PRICE.max, 'elecPrice')])
    .optional()
    .default(''),
  message: z.string().trim().max(2000, 'tooLong').optional().default(''),
  consent: z.literal(true, { error: 'consent' }),
  /** Honeypot: people never see it, bots fill it in. */
  website: z.string().optional().default(''),
});

export type StudyRequestInput = z.input<typeof studyRequestSchema>;
export type StudyRequestValues = z.output<typeof studyRequestSchema>;
export type FieldName = keyof StudyRequestInput;

/** Field errors from a failed parse, as { field: code }. */
export function fieldErrorsOf(error: z.ZodError): Partial<Record<FieldName, string>> {
  const out: Partial<Record<FieldName, string>> = {};
  for (const issue of error.issues) {
    const k = issue.path[0] as FieldName | undefined;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

/** What the server action receives: the form's FormData (field names = StudyRequestForm keys). */
export function toFormData(v: StudyRequestInput): FormData {
  const fd = new FormData();
  fd.set('contactName', String(v.contactName ?? ''));
  fd.set('email', String(v.email ?? ''));
  fd.set('phone', String(v.phone ?? ''));
  fd.set('hotelName', String(v.hotelName ?? ''));
  fd.set('city', String(v.city ?? ''));
  fd.set('rooms', String(v.rooms ?? ''));
  fd.set('pool', v.pool ? 'true' : 'false');
  fd.set('elecPrice', String(v.elecPrice ?? ''));
  fd.set('message', String(v.message ?? ''));
  if (v.consent === true) fd.set('consent', 'on');
  fd.set('website', String(v.website ?? ''));
  return fd;
}

/**
 * Prefill from a /tool link (?rooms=300&city=djerba&pool=1&price=): only the values the link carries.
 * parseToolSearchParams from @/lib/engine fills in the demo hotel for missing keys, which a form
 * must not do, so this reads the keys directly with the same bounds.
 */
export function prefillFrom(sp: SearchParamsLike | Record<string, string | string[] | undefined>): Partial<SizingInput> {
  const get = (k: string) => {
    const v = (sp as Record<string, string | string[] | undefined>)[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const out: Partial<SizingInput> = {};
  const rooms = Number(get('rooms'));
  if (Number.isInteger(rooms) && rooms >= ROOMS.min && rooms <= ROOMS.max) out.rooms = rooms;
  const city = get('city');
  if (city && (CITIES as readonly string[]).includes(city)) out.city = city as City;
  const pool = get('pool');
  if (pool === '1' || pool === 'true') out.pool = true;
  if (pool === '0' || pool === 'false') out.pool = false;
  const price = Number(get('price'));
  if (get('price') && Number.isFinite(price) && price >= PRICE.min && price <= PRICE.max) out.elecPrice = price;
  return out;
}

/** A full engine input when the link carries enough to screen the hotel. */
export function screeningInput(p: Partial<SizingInput>): SizingInput | null {
  if (p.rooms == null || p.city == null) return null;
  return { rooms: p.rooms, city: p.city, pool: p.pool ?? true, elecPrice: p.elecPrice ?? null };
}
