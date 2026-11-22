// STAND-IN for #3/#5 (Mohamed's fake, Hamza's port). Instead of returning frozen numbers, it wraps
// the v2 reference model in engine/model.mjs, so every page already shows the real engine output.
// Hamza's TypeScript port replaces this file with the same exports.
import { sizeHotel as referenceSizeHotel } from '../../../engine/model.mjs';
import type { SizingInput, SizingResult } from './types';

export const ENGINE_VERSION = '2.0.0';

export function sizeHotel(input: SizingInput): SizingResult {
  const run = referenceSizeHotel as unknown as (i: SizingInput) => SizingResult;
  return run(input);
}
