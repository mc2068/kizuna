// Role 3: Sources page helpers.
import { describe, expect, it } from 'vitest';
import { demoResult } from './demo';
import { assumptionStatus, assumptionValue, splitSource } from './sources';

describe('assumption status', () => {
  it('reads "Estimated" from the engine note, "Sourced" otherwise', () => {
    expect(assumptionStatus({ source: 'ESTIMATE: typical fan loads' })).toBe('estimated');
    expect(assumptionStatus({ source: 'IPCC default 56.1 t CO2/TJ' })).toBe('sourced');
  });
  it('gives every engine assumption a status', () => {
    const statuses = demoResult().assumptions.map(assumptionStatus);
    expect(statuses.length).toBeGreaterThan(10);
    expect(new Set(statuses)).toEqual(new Set(['sourced', 'estimated']));
  });
});

describe('splitSource', () => {
  it('pulls links out of the note and tidies the text', () => {
    const r = splitSource('DOE fact sheet https://example.org/a.pdf. Second (via https://example.org/b) and more.');
    expect(r.urls).toEqual(['https://example.org/a.pdf', 'https://example.org/b']);
    expect(r.text).not.toMatch(/https?:/);
    expect(r.text).toMatch(/^DOE fact sheet/);
  });
  it('keeps every engine link as https and drops trailing punctuation', () => {
    for (const a of demoResult().assumptions) {
      for (const u of splitSource(a.source).urls) {
        expect(u).toMatch(/^https:\/\//);
        expect(u).not.toMatch(/[.,;]$/);
      }
    }
  });
});

it('shows engine values as written, up to three decimals', () => {
  expect(assumptionValue(0.068)).toBe('0.068');
  expect(assumptionValue(9100)).toBe('9,100');
  expect(assumptionValue(-0.12)).toBe('-0.12');
});
