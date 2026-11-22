// Role 3 (#24): pipeline filters, KPIs and relative dates.
import { beforeEach, describe, expect, it } from 'vitest';
import { db, resetFakeDb } from '@/lib/db/fake/memory';
import { DEMO_USERS } from '@/lib/db/fake/seed';
import { applyFilters, filtersHref, kpis, leadVerdict, parseFilters, quarterStart, timeAgo, wonDate, withFilter } from './pipeline';

const ME = DEMO_USERS.mohamed.id;

const NOW = new Date('2026-11-22T12:00:00Z');

beforeEach(() => resetFakeDb());

describe('filters in the URL', () => {
  it('parses known values and ignores the rest', () => {
    expect(parseFilters({ status: 'new', city: 'djerba', verdict: 'maybe', mine: '1' })).toEqual({
      status: 'new', city: 'djerba', verdict: 'maybe', mine: true,
    });
    expect(parseFilters({ status: 'nope', city: 'paris', verdict: 'great', mine: 'yes' })).toEqual({});
    expect(parseFilters({ status: ['quoted', 'won'] })).toEqual({ status: 'quoted' });
  });
  it('round-trips through the URL in a stable order', () => {
    const f = { mine: true, verdict: 'weak', city: 'sousse', status: 'lost' } as const;
    expect(filtersHref(f)).toBe('/admin?status=lost&city=sousse&verdict=weak&mine=1');
    expect(parseFilters(Object.fromEntries(new URL(`http://x${filtersHref(f)}`).searchParams))).toEqual(f);
    expect(filtersHref({})).toBe('/admin');
  });
  it('changes or removes one filter at a time', () => {
    expect(withFilter({ status: 'new', city: 'djerba' }, 'status', undefined)).toEqual({ city: 'djerba' });
    expect(withFilter({ mine: true }, 'mine', false)).toEqual({});
    expect(withFilter({}, 'city', 'tozeur')).toEqual({ city: 'tozeur' });
  });
});

describe('applyFilters', () => {
  it('combines status, city, verdict and "assigned to me"', () => {
    const leads = db().leads;
    expect(applyFilters(leads, {}, ME)).toHaveLength(17);
    expect(applyFilters(leads, { status: 'new' }, null)).toHaveLength(5);
    expect(applyFilters(leads, { status: 'new', mine: true }, ME).map((l) => l.id).sort()).toEqual(['L-1048', 'L-1052']);
    const weakDjerba = applyFilters(leads, { city: 'djerba', verdict: 'weak' }, null);
    for (const l of weakDjerba) expect([l.city, leadVerdict(l)]).toEqual(['djerba', 'weak']);
    expect(applyFilters(leads, { city: 'tozeur', status: 'lost' }, null)).toEqual([]);
  });
});

describe('kpis', () => {
  it('counts open leads, new this week, won this quarter and the win rate', () => {
    const wonAt: Record<string, string> = {};
    for (const l of db().leads.filter((x) => x.status === 'won')) {
      const at = wonDate({ events: db().events.filter((e) => e.leadId === l.id) });
      if (at) wonAt[l.id] = at;
    }
    const k = kpis(db().leads, NOW, wonAt);
    expect(k.open).toBe(13);
    expect(k.newLast7).toBe(5);
    expect(k.closed).toBe(4);
    expect(k.winRate).toBe(0.5);
    expect(k.quarterStart.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(k.wonThisQuarter).toBe(2);
  });
  it('has no win rate before any lead closes', () => {
    expect(kpis([], NOW).winRate).toBeNull();
  });
  it('finds the start of the quarter', () => {
    expect(quarterStart(new Date('2026-02-10T00:00:00Z')).toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(quarterStart(new Date('2026-06-30T23:00:00Z')).toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });
});

describe('timeAgo', () => {
  it('reads like a person would say it', () => {
    expect(timeAgo('2026-11-22T08:00:00Z', NOW)).toBe('today');
    expect(timeAgo('2026-11-21T12:00:00Z', NOW)).toBe('yesterday');
    expect(timeAgo('2026-11-19T12:00:00Z', NOW)).toBe('3 days ago');
    expect(timeAgo('2026-10-25T12:00:00Z', NOW)).toBe('4 weeks ago');
    expect(timeAgo('2026-09-10T12:00:00Z', NOW)).toBe('2 months ago');
  });
});
