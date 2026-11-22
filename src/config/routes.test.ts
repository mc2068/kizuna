import { describe, expect, it } from 'vitest';
import { ROUTES } from './routes';

describe('ROUTES', () => {
  it('lists the 15 pages once each', () => {
    expect(ROUTES).toHaveLength(15);
    expect(new Set(ROUTES.map((r) => r.path)).size).toBe(15);
  });
});
