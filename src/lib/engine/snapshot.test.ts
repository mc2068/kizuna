import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { ENGINE_VERSION, sizeHotel, type SizingInput } from './index';
import { isStale, parseToolSearchParams, rerun, safeSnapshot, snapshot, toToolSearchParams } from './snapshot';

const demo: SizingInput = { rooms: 300, city: 'djerba', pool: true, elecPrice: null };

describe('snapshot', () => {
  it('sizes the demo input on the server and stamps the engine version', () => {
    const s = snapshot(demo);
    expect(s.inputs).toEqual(demo);
    expect(s.results).toEqual(sizeHotel(demo));
    expect(s.engineVersion).toBe(ENGINE_VERSION);
    expect(s.results.engineKwe).toBe(200);
  });

  it('accepts form values (strings, checkbox "on", empty price)', () => {
    expect(snapshot({ rooms: '300', city: 'djerba', pool: 'on', elecPrice: '' }).inputs).toEqual(demo);
    expect(snapshot({ rooms: '250', city: 'sousse', pool: 'false', elecPrice: '0.296' }).inputs).toEqual({
      rooms: 250,
      city: 'sousse',
      pool: false,
      elecPrice: 0.296,
    });
  });

  it('drops unknown keys, including results sent by a browser', () => {
    const s = snapshot({ ...demo, results: { engineKwe: 9999 }, engineVersion: 'hacked' });
    expect(Object.keys(s.inputs).sort()).toEqual(['city', 'elecPrice', 'pool', 'rooms']);
    expect(s.results.engineKwe).toBe(200);
    expect(s.engineVersion).toBe(ENGINE_VERSION);
  });

  it('throws a ZodError on invalid input', () => {
    expect(() => snapshot({ ...demo, rooms: 10 })).toThrow(ZodError);
  });
});

describe('validation: every invalid field gives a clear message', () => {
  const errorsFor = (input: unknown) => {
    const r = safeSnapshot(input);
    if (r.ok) throw new Error('expected errors');
    return r.fieldErrors;
  };

  it.each([
    [{ ...demo, rooms: 49 }, 'rooms', 'Rooms must be at least 50.'],
    [{ ...demo, rooms: 801 }, 'rooms', 'Rooms must be at most 800.'],
    [{ ...demo, rooms: 300.5 }, 'rooms', 'Rooms must be a whole number.'],
    [{ ...demo, rooms: 'many' }, 'rooms', 'Rooms must be a number.'],
    [{ ...demo, city: 'tunis' }, 'city', 'City must be one of: djerba, sousse, hammamet, tozeur.'],
    [{ ...demo, city: undefined }, 'city', 'City must be one of: djerba, sousse, hammamet, tozeur.'],
    [{ ...demo, pool: 7 }, 'pool', 'Pool must be yes or no.'],
    [{ ...demo, elecPrice: 0.01 }, 'elecPrice', 'Electricity price must be at least 0.05 TND/kWh.'],
    [{ ...demo, elecPrice: 1.5 }, 'elecPrice', 'Electricity price must be at most 1 TND/kWh (before VAT).'],
    [{ ...demo, elecPrice: 'cheap' }, 'elecPrice', 'Electricity price must be a number in TND/kWh, or empty for the STEG tariff.'],
  ] as const)('%o -> %s', (input, field, message) => {
    expect(errorsFor(input)[field]).toEqual([message]);
  });

  it('reports several fields at once', () => {
    expect(Object.keys(errorsFor({ rooms: 5, city: 'x', pool: true, elecPrice: null })).sort()).toEqual(['city', 'rooms']);
  });

  it('returns the snapshot when valid', () => {
    const r = safeSnapshot(demo);
    expect(r.ok && r.snapshot.results.chillerKwc).toBe(64);
  });
});

describe('staleness', () => {
  it('a fresh snapshot is not stale', () => {
    expect(isStale(snapshot(demo))).toBe(false);
  });

  it('a snapshot from another engine version is stale, and rerun refreshes it', () => {
    const old = { ...snapshot(demo), engineVersion: '0.0.0-fake' };
    expect(isStale(old)).toBe(true);
    const fresh = rerun(old);
    expect(isStale(fresh)).toBe(false);
    expect(fresh.results).toEqual(sizeHotel(demo));
  });
});

describe('stored size', () => {
  it.each([
    demo,
    { rooms: 800, city: 'tozeur', pool: true, elecPrice: 0.296 },
    { rooms: 50, city: 'hammamet', pool: false, elecPrice: null },
  ] as SizingInput[])('JSON of %o stays under 20 KB, hourly rows are integers', (input) => {
    const s = snapshot(input);
    expect(new TextEncoder().encode(JSON.stringify(s)).length).toBeLessThan(20 * 1024);
    for (const row of [...s.results.hourly.summer, ...s.results.hourly.winter]) {
      for (const v of Object.values(row)) expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('survives a JSON round trip unchanged (jsonb)', () => {
    const s = snapshot(demo);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('parseToolSearchParams', () => {
  it('empty URL -> the Djerba demo hotel', () => {
    expect(parseToolSearchParams({})).toEqual(demo);
    expect(parseToolSearchParams(new URLSearchParams(''))).toEqual(demo);
  });

  it('reads every field, from Next searchParams or URLSearchParams', () => {
    const want = { rooms: 450, city: 'tozeur', pool: false, elecPrice: 0.296 };
    expect(parseToolSearchParams({ rooms: '450', city: 'Tozeur', pool: '0', price: '0.296' })).toEqual(want);
    expect(parseToolSearchParams(new URLSearchParams('rooms=450&city=tozeur&pool=0&price=0.296'))).toEqual(want);
  });

  it('never throws: invalid values fall back, numbers are clamped', () => {
    expect(parseToolSearchParams({ rooms: 'abc', city: 'paris', pool: '', price: 'x' })).toEqual(demo);
    expect(parseToolSearchParams({ rooms: '5' }).rooms).toBe(50);
    expect(parseToolSearchParams({ rooms: '99999' }).rooms).toBe(800);
    expect(parseToolSearchParams({ rooms: '301.6' }).rooms).toBe(302);
    expect(parseToolSearchParams({ price: '9' }).elecPrice).toBe(1);
    expect(parseToolSearchParams({ price: '0' }).elecPrice).toBe(0.05);
    expect(parseToolSearchParams({ price: '' }).elecPrice).toBeNull();
  });

  it('takes the first of repeated keys', () => {
    expect(parseToolSearchParams({ rooms: ['120', '600'] }).rooms).toBe(120);
  });

  it('pool: anything but 0/false/no/off is yes', () => {
    for (const v of ['1', 'true', 'yes', 'on']) expect(parseToolSearchParams({ pool: v }).pool).toBe(true);
    for (const v of ['0', 'false', 'no', 'off', 'FALSE']) expect(parseToolSearchParams({ pool: v }).pool).toBe(false);
  });

  it('round-trips with toToolSearchParams, and its output always passes validation', () => {
    for (const input of [demo, { rooms: 120, city: 'sousse', pool: false, elecPrice: 0.296 }] as SizingInput[]) {
      const qs = toToolSearchParams(input);
      expect(parseToolSearchParams(new URLSearchParams(qs))).toEqual(input);
      expect(safeSnapshot(parseToolSearchParams(new URLSearchParams(qs))).ok).toBe(true);
    }
    expect(toToolSearchParams(demo)).toBe('?rooms=300&city=djerba&pool=1&price=');
  });

  it('whatever the URL, the parsed input is valid for snapshot()', () => {
    for (const q of ['rooms=-4&price=-1', 'rooms=1e9&price=1e9', 'city=&pool=maybe', 'rooms=NaN']) {
      expect(safeSnapshot(parseToolSearchParams(new URLSearchParams(q))).ok, q).toBe(true);
    }
  });
});
