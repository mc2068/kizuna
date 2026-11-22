// FAKE engine (Role 4) so every page can be built on day 1. It ignores the input and
// always returns the frozen Djerba demo (300 rooms, Djerba, pool, STEG time-of-use),
// a snapshot of the reference model engine/model.mjs (engine v2). Hamza's TypeScript
// port (#5) replaces it in src/lib/engine/index.ts; after that it is used only by tests.
import djerba from './fake-djerba.json';
import type { SizingInput, SizingResult } from './types';

export const ENGINE_VERSION = '0.0.0-fake';

const DJERBA_DEMO = djerba as SizingResult;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function sizeHotel(_input: SizingInput): SizingResult {
  return structuredClone(DJERBA_DEMO);
}
