// TEMPORARY (until #3/#4 merges): stand-in for Mohamed's src/lib/engine/fake.ts.
// Wraps the engine v2 reference model (engine/model.mjs) with the Contract 1 types, so the tool
// already shows the real numbers. Hamza's TypeScript port replaces src/lib/engine/index.ts.
import * as reference from "../../../engine/model.mjs";
import type { SizingInput, SizingResult } from "./types";

export type * from "./types";

export const ENGINE_VERSION = "2.0.0-reference";

export function sizeHotel(input: SizingInput): SizingResult {
  // The reference model is untyped JavaScript; Contract 1 is the shape it returns.
  const run = reference.sizeHotel as unknown as (input: SizingInput) => SizingResult;
  return run(input);
}
