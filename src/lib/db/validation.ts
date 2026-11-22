import { z } from 'zod';
import { CITIES, type City, type SizingInput } from '@/lib/engine';

const checkbox = z.preprocess((v) => v === true || v === 'on' || v === 'true', z.boolean());
const optionalText = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().trim().max(2000).optional());
const elecPrice = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
  z.number().positive().max(5).nullable(),
);

/** The tool inputs, the same bounds as the configurator. Unknown keys are dropped. */
export const sizingInputSchema = z.object({
  rooms: z.coerce.number().int().min(50).max(800),
  city: z.enum(CITIES as [City, ...City[]]),
  pool: checkbox,
  elecPrice,
});

export function parseSizingInput(input: unknown): SizingInput {
  return sizingInputSchema.parse(input);
}

export const studyRequestSchema = sizingInputSchema.extend({
  contactName: z.string().trim().min(2).max(120),
  email: z.email(),
  phone: optionalText,
  hotelName: z.string().trim().min(2).max(160),
  message: optionalText,
  consent: checkbox.refine((v) => v, 'Consent is required.'),
  projectId: optionalText,
  website: optionalText,
});

/** Storage-safe object name: letters, digits, dot, dash and underscore. */
export function safeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
