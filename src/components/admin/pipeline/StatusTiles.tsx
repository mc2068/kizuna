import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { LeadStatus } from '@/lib/db/types';
import { cn } from '@/lib/utils';
import { STATUSES, filtersHref, withFilter, type PipelineFilters } from './pipeline';

const DOT: Record<LeadStatus, string> = {
  new: 'bg-status-new',
  contacted: 'bg-status-contacted',
  quoted: 'bg-status-quoted',
  won: 'bg-status-won',
  lost: 'bg-status-lost',
};

/** Integrate-style status tiles on a dark band. Clicking a tile filters by it; again clears it. */
export async function StatusTiles({ counts, filters }: { counts: Record<LeadStatus, number>; filters: PipelineFilters }) {
  const t = await getTranslations('admin.pipeline.tiles');
  const ts = await getTranslations('common.status');
  return (
    <nav aria-label={t('label')} className="rounded-[22px] bg-dark-tile p-3">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {STATUSES.map((s) => {
          const active = filters.status === s;
          const href = filtersHref(withFilter(filters, 'status', active ? undefined : s));
          return (
            <li key={s} className={s === 'new' ? 'col-span-2 sm:col-span-1' : undefined}>
              <Link
                href={href}
                aria-current={active ? 'true' : undefined}
                data-tile={s}
                className={cn(
                  'flex h-full flex-col rounded-[14px] p-4 text-white transition-colors',
                  active ? 'bg-white text-ink' : 'bg-white/[0.06] hover:bg-white/[0.12]',
                )}
              >
                <span className="flex items-center justify-between gap-2 text-[14px]">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <i aria-hidden="true" className={cn('size-2 rounded-full', DOT[s])} />
                    {ts(s)}
                  </span>
                  <span className={cn('text-[12px]', active ? 'text-muted' : 'text-dark-muted')}>{t(`notes.${s}`)}</span>
                </span>
                <span className="tabular mt-3 font-display text-[34px] leading-none font-semibold">{counts[s]}</span>
                <span className="sr-only">{t('leads', { count: counts[s] })}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
