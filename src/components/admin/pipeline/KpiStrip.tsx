import { getTranslations } from 'next-intl/server';
import type { Kpis } from './pipeline';

/** Small KPI strip above the status tiles. */
export async function KpiStrip({ k }: { k: Kpis }) {
  const t = await getTranslations('admin.pipeline.kpis');
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(k.quarterStart);
  const items = [
    { key: 'open', value: String(k.open), note: t('openNote') },
    { key: 'new7', value: String(k.newLast7), note: t('new7Note') },
    { key: 'won', value: String(k.wonThisQuarter), note: t('wonNote', { date }) },
    { key: 'winRate', value: k.winRate == null ? t('noRate') : `${Math.round(k.winRate * 100)}%`, note: t('winRateNote', { closed: k.closed }) },
  ] as const;
  return (
    <section aria-label={t('label')} className="grid grid-cols-2 overflow-hidden rounded-[18px] border border-line/70 bg-white lg:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={it.key}
          data-kpi={it.key}
          className={`p-5 ${i % 2 ? 'border-l border-line/70' : ''} ${i >= 2 ? 'border-t border-line/70 lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l' : ''}`}
        >
          <p className="text-[13px] text-muted">{t(it.key)}</p>
          <p className="tabular mt-1 font-display text-[30px] leading-none font-semibold tracking-tight">{it.value}</p>
          <p className="mt-2 text-[12px] text-muted">{it.note}</p>
        </div>
      ))}
    </section>
  );
}
