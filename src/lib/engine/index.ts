// Public entry point of the sizing engine (Contract 1). Import from '@/lib/engine' only.
// Until Hamza's TypeScript port lands (#5), this re-exports the fake.
export { sizeHotel, ENGINE_VERSION } from './fake';
export * from './types';
