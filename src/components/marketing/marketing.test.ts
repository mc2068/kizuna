// Role 3: marketing pages get their numbers from the engine or method.ts, never from the copy.
import { describe, expect, it } from 'vitest';
import marketing from '../../../messages/en/marketing.json';
import { DEMO_INPUT, assumption, demoResult, inputQuery, requestStudyHref, toolHref } from './demo';

/** Every string in a message tree, with its path. */
function strings(o: unknown, at = ''): [string, string][] {
  if (typeof o === 'string') return [[at, o]];
  return Object.entries(o as object).flatMap(([k, v]) => strings(v, at ? `${at}.${k}` : k));
}

/** Digits allowed in copy: ICU placeholders, step labels and the CO₂ subscript. */
const typedNumber = (s: string) =>
  s.replace(/\{[^}]*\}/g, '').replace(/Step \d/g, '').replace(/[₂]/g, '').match(/\d/);

describe('demo helpers', () => {
  it('uses the frozen demo hotel: 300 rooms, Djerba, pool, STEG time-of-use', () => {
    expect(DEMO_INPUT).toEqual({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });
  });
  it('matches the frozen Djerba numbers (docs/team/README.md)', () => {
    const r = demoResult();
    expect([r.engineKwe, r.chillerKwc]).toEqual([200, 64]);
    expect([r.scenarios.favourable.paybackYears, r.scenarios.central.paybackYears, r.scenarios.unfavourable.paybackYears]).toEqual([5, 9, 21.5]);
    expect(r.verdict).toBe('possible fit, needs a study');
  });
  it('reads efficiencies from the engine assumptions', () => {
    const r = demoResult();
    expect(assumption(r, 'Engine electrical efficiency').central).toBe(0.38);
    expect(() => assumption(r, 'No such thing')).toThrow();
  });
  it('builds tool and study links the form can prefill from', () => {
    expect(inputQuery(DEMO_INPUT)).toBe('rooms=300&city=djerba&pool=1');
    expect(toolHref()).toBe('/tool?rooms=300&city=djerba&pool=1');
    expect(requestStudyHref({ rooms: 120, city: 'sousse', pool: false, elecPrice: 0.3 })).toBe(
      '/request-study?rooms=120&city=sousse&pool=0&price=0.3',
    );
    expect(requestStudyHref()).toBe('/request-study');
  });
});

describe('copy rules (messages/en/marketing.json)', () => {
  it('has no numbers typed into the copy: they come from the engine or method.ts', () => {
    const offenders = strings(marketing).filter(([, s]) => typedNumber(s));
    expect(offenders).toEqual([]);
  });
  it('never promises blackout cover (island mode is not modelled)', () => {
    for (const [at, s] of strings(marketing)) expect(s, at).not.toMatch(/blackout|power cut|stays on/i);
  });
  it('says "price on request" and "coming soon" where the offer is not priced or live', () => {
    const all = strings(marketing).map(([, s]) => s).join('\n');
    expect(all).toMatch(/Price on request/);
    expect(all).toMatch(/Coming soon/);
  });
});
