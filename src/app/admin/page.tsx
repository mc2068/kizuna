// Admin leads pipeline (Role 3, #24; data: Contract 3, Mohamed). Only admins reach it: src/proxy.ts and
// the admin layout answer 404 for everyone else (#7).
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, getLead, getLeadCounts, listAdmins, listLeads } from '@/lib/db';
import { KpiStrip } from '@/components/admin/pipeline/KpiStrip';
import { StatusTiles } from '@/components/admin/pipeline/StatusTiles';
import { FilterBar } from '@/components/admin/pipeline/FilterBar';
import { LeadCards, type LeadCardData } from '@/components/admin/pipeline/LeadCards';
import { filtersHref, kpis, leadVerdict, parseFilters, timeAgo, wonDate } from '@/components/admin/pipeline/pipeline';
import { rangeText, rangeOf, num } from '@/components/marketing/format';
import { verdictTone } from '@/lib/present';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.pipeline.meta');
  return { title: t('title'), robots: { index: false, follow: false } };
}

export default async function AdminPipelinePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Layouts and pages render in parallel, so the page checks too before it asks for admin data.
  await connection();
  const me = await getCurrentUser().catch(() => null);
  if (!me || me.role !== 'admin') notFound();
  const t = await getTranslations('admin.pipeline');
  const tv = await getTranslations('common.verdict');
  const ts = await getTranslations('common.status');
  const tc = await getTranslations('common.cities');
  const filters = parseFilters(await searchParams);
  const [all, counts, admins] = await Promise.all([listLeads(), getLeadCounts(), listAdmins()]);
  // Status, city and "mine" go to the data layer; the verdict is read from the stored results.
  const filtered = (await listLeads({ status: filters.status, city: filters.city, mine: filters.mine })).filter(
    (l) => !filters.verdict || leadVerdict(l) === filters.verdict,
  );
  const now = new Date();
  // "Won this quarter" needs the date each lead was won, from its history.
  const wonAt: Record<string, string> = {};
  for (const d of await Promise.all(all.filter((l) => l.status === 'won').map((l) => getLead(l.id)))) {
    const at = d && wonDate(d);
    if (d && at) wonAt[d.id] = at;
  }
  const ownerName = (id: string | null) => (id ? (admins.find((a) => a.id === id)?.fullName ?? id) : t('card.unassigned'));

  const cards: LeadCardData[] = filtered.map((l) => {
    const s = l.results.scenarios;
    const r = rangeOf(s, 'paybackYears');
    return {
      id: l.id,
      hotelName: l.hotelName,
      city: tc(l.city),
      rooms: l.rooms,
      pool: l.inputs.pool,
      plant: l.results.chillerKwc ? `${l.results.engineKwe} kWe + ${l.results.chillerKwc} kWc` : `${l.results.engineKwe} kWe`,
      verdict: leadVerdict(l),
      verdictLabel: tv(verdictTone(l.results.verdict)),
      paybackRange: rangeText(s, 'paybackYears'),
      paybackCentral: num(r.central),
      rail: r,
      status: l.status,
      statusLabel: ts(l.status),
      ownerName: ownerName(l.ownerId),
      ownerIsMe: l.ownerId === me.id,
      received: timeAgo(l.createdAt, now),
    };
  });

  return (
    <main id="main" className="mx-auto grid max-w-[1320px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[13px] text-muted">{t('breadcrumb')}</p>
        <h1 className="mt-1 text-[34px] leading-tight font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-muted">{t('lede')}</p>
      </header>

      <KpiStrip k={kpis(all, now, wonAt)} />
      <StatusTiles counts={counts} filters={filters} />
      <FilterBar filters={filters} />

      <p className="tabular text-[14px] text-muted" aria-live="polite" data-results-count>
        {t('results', { shown: cards.length, total: all.length })}
      </p>

      {cards.length ? (
        <LeadCards leads={cards} filterKey={filtersHref(filters)} />
      ) : (
        <div data-empty className="rounded-[18px] border border-dashed border-line bg-white p-10 text-center">
          <p className="text-[19px] font-semibold">{t('empty.title')}</p>
          <p className="mt-1 text-muted">{filters.mine ? t('empty.mine') : t('empty.body')}</p>
          <Link href="/admin" className="mt-4 inline-block text-link hover:underline">
            {t('empty.clear')}
          </Link>
        </div>
      )}
    </main>
  );
}
