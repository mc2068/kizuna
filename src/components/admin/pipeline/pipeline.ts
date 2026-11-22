// Role 3 (#24): pure helpers for the admin pipeline. Filters live in the URL search params.
import { CITIES, type City } from '@/lib/engine';
import type { Lead, LeadStatus } from '@/lib/db/types';
import { verdictTone, type VerdictTone } from '@/lib/present';

export const STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost'];
export const VERDICTS: VerdictTone[] = ['good', 'maybe', 'weak'];
const OPEN: LeadStatus[] = ['new', 'contacted', 'quoted'];

export type PipelineFilters = { status?: LeadStatus; city?: City; verdict?: VerdictTone; mine?: boolean };
type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Read the filters from the URL; unknown values are ignored. */
export function parseFilters(sp: Params): PipelineFilters {
  const f: PipelineFilters = {};
  const status = first(sp.status);
  if (status && (STATUSES as string[]).includes(status)) f.status = status as LeadStatus;
  const city = first(sp.city);
  if (city && (CITIES as string[]).includes(city)) f.city = city as City;
  const verdict = first(sp.verdict);
  if (verdict && (VERDICTS as string[]).includes(verdict)) f.verdict = verdict as VerdictTone;
  if (first(sp.mine) === '1') f.mine = true;
  return f;
}

/** The URL for a set of filters, in a stable order. */
export function filtersHref(f: PipelineFilters, base = '/admin'): string {
  const q = new URLSearchParams();
  if (f.status) q.set('status', f.status);
  if (f.city) q.set('city', f.city);
  if (f.verdict) q.set('verdict', f.verdict);
  if (f.mine) q.set('mine', '1');
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

/** Same filters with one key changed (undefined removes it). */
export function withFilter<K extends keyof PipelineFilters>(f: PipelineFilters, key: K, value: PipelineFilters[K]): PipelineFilters {
  const next = { ...f };
  if (value === undefined || value === false) delete next[key];
  else next[key] = value;
  return next;
}

export function leadVerdict(l: Pick<Lead, 'results'>): VerdictTone {
  return verdictTone(l.results.verdict);
}

/** Every filter applied in memory: what listLeads does on the server, plus the verdict. */
export function applyFilters(leads: Lead[], f: PipelineFilters, me: string | null): Lead[] {
  return leads
    .filter((l) => !f.status || l.status === f.status)
    .filter((l) => !f.city || l.city === f.city)
    .filter((l) => !f.mine || l.ownerId === me)
    .filter((l) => !f.verdict || leadVerdict(l) === f.verdict);
}

export function quarterStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1));
}

export type Kpis = { open: number; newLast7: number; wonThisQuarter: number; closed: number; winRate: number | null; quarterStart: Date };

/** The KPI strip: open leads, new in the last 7 days, won this quarter, win rate of closed leads. */
export function kpis(leads: Lead[], now = new Date()): Kpis {
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const q = quarterStart(now);
  const won = leads.filter((l) => l.status === 'won');
  const lost = leads.filter((l) => l.status === 'lost');
  const closed = won.length + lost.length;
  return {
    open: leads.filter((l) => OPEN.includes(l.status)).length,
    newLast7: leads.filter((l) => new Date(l.createdAt).getTime() >= weekAgo).length,
    wonThisQuarter: won.filter((l) => new Date(l.statusChangedAt) >= q).length,
    closed,
    winRate: closed ? won.length / closed : null,
    quarterStart: q,
  };
}

/** "today", "yesterday", "3 days ago", "2 weeks ago". */
export function timeAgo(iso: string, now = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const days = Math.round((new Date(iso).getTime() - now.getTime()) / 86_400_000);
  if (Math.abs(days) < 14) return rtf.format(days, 'day');
  if (Math.abs(days) < 60) return rtf.format(Math.round(days / 7), 'week');
  return rtf.format(Math.round(days / 30), 'month');
}
