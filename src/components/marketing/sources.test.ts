// Role 3: Sources page helpers.
import { describe, expect, it } from 'vitest';
import { ASSUMPTIONS } from '@/content/method';
import { assumptionValue, splitSource, STATUS_BADGE } from './sources';

describe('assumption status badges', () => {
  it('has a badge colour for every status the method uses', () => {
    for (const a of ASSUMPTIONS) expect(STATUS_BADGE[a.status], a.id).toBeDefined();
    expect(STATUS_BADGE).toEqual({ sourced: 'good', estimated: 'maybe', unconfirmed: 'weak' });
  });
});

describe('splitSource', () => {
  it('pulls links out of the note and tidies the text', () => {
    const r = splitSource('DOE fact sheet https://example.org/a.pdf. Second (via https://example.org/b) and more.');
    expect(r.urls).toEqual(['https://example.org/a.pdf', 'https://example.org/b']);
    expect(r.text).not.toMatch(/https?:/);
    expect(r.text).toMatch(/^DOE fact sheet/);
  });
  it('leaves no raw URL in any assumption text', () => {
    for (const a of ASSUMPTIONS) expect(splitSource(a.source).text, a.id).not.toMatch(/https?:\/\//);
  });
});

it('shows engine values as written, up to three decimals', () => {
  expect(assumptionValue(0.068)).toBe('0.068');
  expect(assumptionValue(9100)).toBe('9,100');
  expect(assumptionValue(-0.12)).toBe('-0.12');
});
