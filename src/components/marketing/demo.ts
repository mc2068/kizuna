// The Djerba demo hotel and small helpers shared by the marketing pages. Every number comes from
// the engine or src/content/method.ts (Hamza), never typed into a page.
import { DEMO, DEMO_INPUT as METHOD_DEMO_INPUT } from '@/content/method';
import { PARAMS, toToolSearchParams, type ParamKey, type SizingInput, type SizingResult } from '@/lib/engine';

export const DEMO_INPUT: SizingInput = { ...METHOD_DEMO_INPUT };

export function demoResult(): SizingResult {
  return DEMO.result;
}

/** Central value of an engine parameter (PARAMS in @/lib/engine). */
export function centralParam(key: ParamKey): number {
  return PARAMS[key].values[1];
}

/** Query string the tool and the study form both understand (the engine's own URL format). */
export function inputQuery(input: SizingInput): string {
  const q = new URLSearchParams(toToolSearchParams(input));
  if (input.elecPrice == null) q.delete('price');
  return q.toString();
}

export const toolHref = (input: SizingInput = DEMO_INPUT) => `/tool?${inputQuery(input)}`;
export const requestStudyHref = (input?: SizingInput) => (input ? `/request-study?${inputQuery(input)}` : '/request-study');
