import { describe, expect, it } from 'vitest';
import { ROUTES } from './routes';

describe('ROUTES', () => {
  it('lists the 14 pages once each', () => {
    expect(ROUTES).toHaveLength(14);
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(14);
  });
});
