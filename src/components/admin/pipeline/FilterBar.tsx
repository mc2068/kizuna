'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CITIES } from '@/lib/engine';
import { STATUSES, VERDICTS, filtersHref, withFilter, type PipelineFilters } from './pipeline';

const ANY = 'any';

/** Status, city, verdict and "assigned to me". Every change rewrites the URL, so filters combine,
 *  survive a reload and can be shared. */
export function FilterBar({ filters }: { filters: PipelineFilters }) {
  const t = useTranslations('admin.pipeline.filters');
  const ts = useTranslations('common.status');
  const tc = useTranslations('common.cities');
  const tv = useTranslations('common.verdict');
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (f: PipelineFilters) => start(() => router.push(filtersHref(f), { scroll: false }));
  const active = Object.keys(filters).length > 0;

  return (
    <section
      aria-label={t('label')}
      aria-busy={pending}
      data-filter-bar
      className="grid gap-3 rounded-[18px] border border-line/70 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto_auto] lg:items-end"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="f-status" className="text-[13px] text-muted">
          {t('status')}
        </Label>
        <Select value={filters.status ?? ANY} onValueChange={(v) => go(withFilter(filters, 'status', v === ANY ? undefined : (v as PipelineFilters['status'])))}>
          <SelectTrigger id="f-status" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('anyStatus')}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ts(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="f-city" className="text-[13px] text-muted">
          {t('city')}
        </Label>
        <Select value={filters.city ?? ANY} onValueChange={(v) => go(withFilter(filters, 'city', v === ANY ? undefined : (v as PipelineFilters['city'])))}>
          <SelectTrigger id="f-city" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('anyCity')}</SelectItem>
            {CITIES.map((c) => (
              <SelectItem key={c} value={c}>
                {tc(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="f-verdict" className="text-[13px] text-muted">
          {t('verdict')}
        </Label>
        <Select value={filters.verdict ?? ANY} onValueChange={(v) => go(withFilter(filters, 'verdict', v === ANY ? undefined : (v as PipelineFilters['verdict'])))}>
          <SelectTrigger id="f-verdict" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('anyVerdict')}</SelectItem>
            {VERDICTS.map((v) => (
              <SelectItem key={v} value={v}>
                {tv(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex h-9 items-center gap-3 rounded-xl bg-tile px-3">
        <Switch id="f-mine" checked={!!filters.mine} onCheckedChange={(on) => go(withFilter(filters, 'mine', on || undefined))} />
        <Label htmlFor="f-mine" className="text-[15px] whitespace-nowrap">
          {t('mine')}
        </Label>
      </div>
      <Link
        href="/admin"
        aria-disabled={!active}
        className={`inline-flex h-9 items-center justify-center rounded-full px-3 text-[14px] text-link hover:underline ${active ? '' : 'pointer-events-none opacity-40'}`}
        tabIndex={active ? undefined : -1}
      >
        {t('clear')}
      </Link>
    </section>
  );
}
