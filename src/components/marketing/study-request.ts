// Study request: one schema for the browser (react-hook-form) and the server action.
import { z } from 'zod';
import { CITIES, type City, type SizingInput } from '@/lib/engine';

export const ROOMS = { min: 50, max: 800 } as const;
export const PRICE = { min: 0.05, max: 2 } as const;

/** Error codes; the form translates them with messages/en/forms.json (studyForm.errors.*). */
export const studyRequestSchema = z.object({
  contactName: z.string().trim().min(1, 'required').min(2, 'tooShort').max(120, 'tooLong'),
  email: z.string().trim().min(1, 'required').max(200, 'tooLong').pipe(z.email('email')),
  phone: z.string().trim().max(40, 'tooLong').optional().default(''),
  hotelName: z.string().trim().min(1, 'required').min(2, 'tooShort').max(160, 'tooLong'),
  city: z.enum(CITIES as [City, ...City[]], { error: 'city' }),
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

export type StudyRequestState =
  | { status: 'idle' }
  | { status: 'success'; leadId: string; contactName: string; hotelName: string }
  | { status: 'error'; fieldErrors: Partial<Record<FieldName, string>>; formError?: 'server' };

/** Field errors from a failed parse, as { field: code }. */
export function fieldErrorsOf(error: z.ZodError): Partial<Record<FieldName, string>> {
  const out: Partial<Record<FieldName, string>> = {};
  for (const issue of error.issues) {
    const k = issue.path[0] as FieldName | undefined;
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}

/**
 * Prefill from a /tool link: ?rooms=300&city=djerba&pool=1&price=0.3. Invalid values are dropped.
 * Local parser until parseToolSearchParams from @/lib/engine/snapshot (Hamza, #13) lands.
 */
export function parseToolSearchParams(sp: Record<string, string | string[] | undefined>): Partial<SizingInput> {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const out: Partial<SizingInput> = {};
  const rooms = Number(one('rooms'));
  if (Number.isInteger(rooms) && rooms >= ROOMS.min && rooms <= ROOMS.max) out.rooms = rooms;
  const city = one('city');
  if (city && (CITIES as string[]).includes(city)) out.city = city as City;
  const pool = one('pool');
  if (pool === '1' || pool === 'true') out.pool = true;
  if (pool === '0' || pool === 'false') out.pool = false;
  const price = Number(one('price'));
  if (one('price') && Number.isFinite(price) && price >= PRICE.min && price <= PRICE.max) out.elecPrice = price;
  return out;
}

/** A full engine input when the link carries enough to screen the hotel. */
export function screeningInput(p: Partial<SizingInput>): SizingInput | null {
  if (p.rooms == null || p.city == null) return null;
  return { rooms: p.rooms, city: p.city, pool: p.pool ?? true, elecPrice: p.elecPrice ?? null };
}
