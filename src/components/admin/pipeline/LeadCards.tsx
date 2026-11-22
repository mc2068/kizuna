'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { ArrowUpRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LeadStatus } from '@/lib/db/types';
import type { VerdictTone } from '@/lib/present';
import { initials } from '@/components/layout/AdminShell';

/** Everything a card shows, prepared (and formatted with @/lib/present) on the server. */
export type LeadCardData = {
  id: string;
  hotelName: string;
  city: string;
  rooms: number;
  pool: boolean;
  plant: string;
  verdict: VerdictTone;
  verdictLabel: string;
  paybackRange: string;
  paybackCentral: string;
  rail: { low: number; central: number; high: number };
  status: LeadStatus;
  statusLabel: string;
  ownerName: string;
  ownerIsMe: boolean;
  received: string;
};

const RAIL_MAX = 30;

/** Lead cards with a staggered entrance every time the filters change (reduced-motion safe). */
export function LeadCards({ leads, filterKey }: { leads: LeadCardData[]; filterKey: string }) {
  const t = useTranslations('admin.pipeline.card');
  const reduce = useReducedMotion();
  const pct = (v: number) => `${(Math.min(v, RAIL_MAX) / RAIL_MAX) * 100}%`;

  return (
    <ul key={filterKey} className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3" data-lead-cards>
      <AnimatePresence initial={!reduce}>
        {leads.map((l, i) => (
          <motion.li
            key={l.id}
            data-lead={l.id}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.35, delay: Math.min(i, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <article className="flex h-full flex-col rounded-[18px] border border-line/70 bg-white p-5">
              <header className="flex items-start gap-3">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-status-quoted text-[14px] font-semibold text-white">
                  {initials(l.hotelName)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-sans text-[16px] font-semibold">{l.hotelName}</h3>
                  <p className="tabular text-[12px] text-muted">{t('received', { id: l.id, ago: l.received })}</p>
                </div>
                <Badge variant={l.status} dot>
                  {l.statusLabel}
                </Badge>
              </header>

              <dl className="mt-4 grid grid-cols-2 rounded-xl border border-line/70 text-[14px]">
                <div className="p-3">
                  <dt className="text-[12px] text-muted">{t('hotel')}</dt>
                  <dd className="tabular font-semibold">
                    {t('rooms', { rooms: l.rooms })}
                    {l.pool ? ` · ${t('pool')}` : ''}
                  </dd>
                </div>
                <div className="border-l border-line/70 p-3">
                  <dt className="text-[12px] text-muted">{t('city')}</dt>
                  <dd className="font-semibold">{l.city}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="tabular text-[13px] text-muted">{l.plant}</span>
                <Badge variant={l.verdict}>{l.verdictLabel}</Badge>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-[13px] text-muted">{t('payback')}</span>
                <span className="tabular font-display text-[20px] font-semibold tracking-tight">{l.paybackRange}</span>
              </div>
              <div className="relative mt-2 h-3" aria-hidden="true">
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line/60" />
                <div
                  className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink/30"
                  style={{ left: pct(l.rail.low), width: `calc(${pct(l.rail.high)} - ${pct(l.rail.low)})` }}
                />
                <div className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" style={{ left: pct(l.rail.central) }} />
              </div>
              <p className="tabular mt-1 text-right text-[12px] text-muted">{t('central', { value: l.paybackCentral })}</p>

              <footer className="mt-auto flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                <span className="flex min-w-0 items-center gap-2 text-[14px]">
                  <span
                    aria-hidden="true"
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white ${l.ownerIsMe ? 'bg-btn' : 'bg-weak-text'}`}
                  >
                    {initials(l.ownerName)}
                  </span>
                  <span className="truncate">
                    <span className="sr-only">{t('owner')}: </span>
                    {l.ownerName}
                  </span>
                </span>
                <Link
                  href={`/admin/leads/${l.id}`}
                  aria-label={t('openLabel', { hotel: l.hotelName })}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-[14px] font-medium whitespace-nowrap text-white hover:bg-black"
                >
                  {t('open')}
                  <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                </Link>
              </footer>
            </article>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
