import { z } from 'zod';
import { sizingInputSchema as engineSizingInputSchema, type SizingInput } from '@/lib/engine';

const checkbox = z.preprocess((v) => v === true || v === 'on' || v === 'true', z.boolean());
const optionalText = z.preprocess((v) => (v === '' || v === null ? undefined : v), z.string().trim().max(2000).optional());

/** The tool inputs: the engine's schema (same bounds and messages as the configurator). */
export const sizingInputSchema = engineSizingInputSchema;

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
