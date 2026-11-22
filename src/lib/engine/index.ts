// Contract 1: the [PRODUCT NAME] sizing engine. Import from '@/lib/engine', never from the files inside.
// The scaffold's src/lib/engine/fake.ts is kept for tests only.

export * from './types';
export { sizeHotel, evaluateSize, paramsFor, touSlot, CANDIDATE_SIZES, MIN_TRIGEN_CHILLER_KWC } from './model';
export type { Evaluation } from './model';
export { PARAMS, FIXED, STEG_TOU } from './params';
export type { Param, ParamKey, ParamSet, TouSlot } from './params';

/** Stored with every saved run. Bump on any change to the engine's output (major = numbers change). */
export const ENGINE_VERSION = '2.0.0';
