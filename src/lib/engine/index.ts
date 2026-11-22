// Contract 1: the [PRODUCT NAME] sizing engine. Import from '@/lib/engine', never from the files inside.
// The scaffold's src/lib/engine/fake.ts is kept for tests only.

export * from './types';
export { sizeHotel, evaluateSize, evaluateWithParams, paramsFor, touSlot, CANDIDATE_SIZES, MIN_TRIGEN_CHILLER_KWC, WARN } from './model';
export type { Evaluation } from './model';
export { PARAMS, FIXED, STEG_TOU } from './params';
export type { Param, ParamKey, ParamSet, TouSlot } from './params';

export { ENGINE_VERSION } from './version';
export {
  sizingInputSchema,
  snapshot,
  safeSnapshot,
  isStale,
  rerun,
  parseToolSearchParams,
  toToolSearchParams,
  ROOMS_RANGE,
  ELEC_PRICE_RANGE,
  DEFAULT_INPUT,
} from './snapshot';
export type { Snapshot, SnapshotErrors, SafeSnapshot, SearchParamsLike } from './snapshot';
