'use client';

// Sticky summary of the current result: verdict, plant size, central payback and its range.
// Desktop: a tile beside the inputs. Below lg: a compact bar fixed to the bottom of the screen.
// Detailed cards (#10) and the hourly dashboard (#11) live under the configurator, in #results.
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MAX_SHOWN_PAYBACK_YEARS, formatRange, verdictTone, type VerdictTone } from '@/lib/present';
import { useTool } from './ToolState';

/** Screen readers hear the result once the visitor stops changing inputs. */
const ANNOUNCE_DELAY_MS = 700;

const badgeTone: Record<VerdictTone, string> = {
  good: 'bg-[var(--good-soft,#eef8f2)] text-[var(--good-text,#1a7a42)]',
  maybe: 'bg-[var(--maybe-soft,#fbf1e2)] text-[var(--maybe-text,#8f5600)]',
  weak: 'bg-[var(--weak-soft,#eeeff0)] text-[var(--weak-text,#5f5f63)]',
};

function useSummary() {
  const { result } = useTool();
  const tone = verdictTone(result.verdict);
  // Text from the presentation helpers; their raw values only place the rail.
  const payback = formatRange(result, 'paybackYears');
  const v = payback.values;
  const rail = {
    low: Math.min(v.favourable, v.unfavourable),
    central: v.central,
    high: Math.max(v.favourable, v.unfavourable),
  };
  return { result, tone, payback, rail };
}

function VerdictBadge({ tone, label, className = '' }: { tone: VerdictTone; label: string; className?: string }) {
  return (
    <span
      title={label}
      className={`rounded-full px-3 py-1.5 text-xs leading-none font-semibold whitespace-nowrap ${badgeTone[tone]} ${className}`}
    >
      {label}
    </span>
  );
}

function PaybackRail({ low, central, high }: { low: number; central: number; high: number }) {
  const pct = (v: number) => (Math.min(v, MAX_SHOWN_PAYBACK_YEARS) / MAX_SHOWN_PAYBACK_YEARS) * 100;
  return (
    <div className="relative mt-3 h-[22px]" aria-hidden="true">
      <div className="absolute inset-x-0 top-[10px] h-0.5 rounded bg-[#dcdce1]" />
      <div
        className="absolute top-[7px] h-2 rounded-full bg-[#c7c7cc] transition-all duration-300 motion-reduce:transition-none"
        style={{ left: `${pct(low)}%`, width: `${Math.max(1, pct(high) - pct(low))}%` }}
      />
      <div
        className="absolute top-1 -ml-[7px] size-3.5 rounded-full bg-[var(--ink,#1d1d1f)] shadow-[0_0_0_3px_var(--tile,#f5f5f7)] transition-all duration-300 motion-reduce:transition-none"
        style={{ left: `${pct(central)}%` }}
      />
    </div>
  );
}

function Announcer() {
  const t = useTranslations('tool');
  const { result, tone, payback } = useSummary();
  const text = t('summary.announce', {
    verdict: t(`verdict.${tone}`),
    kwe: result.engineKwe,
    range: payback.text,
  });
  const [spoken, setSpoken] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setSpoken(text), ANNOUNCE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [text]);
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {spoken}
    </p>
  );
}

export function ToolSummary() {
  const t = useTranslations('tool');
  const { result, tone, payback, rail } = useSummary();

  return (
    <>
      <Announcer />

      {/* Desktop: sticky tile */}
      <aside
        aria-labelledby="tool-summary-heading"
        className="sticky top-[76px] hidden rounded-[28px] bg-[var(--tile,#f5f5f7)] px-8 pt-8 pb-7 lg:block"
      >
        <h2 id="tool-summary-heading" className="sr-only">
          {t('summary.heading')}
        </h2>
        <div className="flex items-start justify-between gap-4">
          <p className="font-display text-[34px] leading-[1.05] font-semibold tracking-[-0.04em] tabular-nums">
            {t('summary.engine', { kwe: result.engineKwe })}
            <small className="mt-1.5 block font-sans text-sm font-normal tracking-[-0.01em] text-[var(--muted,#6e6e73)]">
              {result.chillerKwc > 0 ? t('summary.chiller', { kwc: result.chillerKwc }) : t('summary.noChiller')}
            </small>
          </p>
          <VerdictBadge tone={tone} label={t(`verdict.${tone}`)} />
        </div>

        <div className="mt-6 border-t border-[#e3e3e8] pt-5">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[13px] text-[var(--muted,#6e6e73)]">{t('summary.payback')}</span>
            <span className="font-display text-[40px] leading-none font-semibold tracking-[-0.045em] tabular-nums">
              {payback.central}
            </span>
          </div>
          <PaybackRail low={rail.low} central={rail.central} high={rail.high} />
          <div className="mt-1.5 flex justify-between text-[11px] text-[var(--faint,#86868b)]" aria-hidden="true">
            <span>{t('summary.rangeAxisMin')}</span>
            <span>{t('summary.rangeAxisMax')}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted,#6e6e73)] tabular-nums">{payback.text}</p>
        </div>

        <a
          href="#results"
          className="mt-6 inline-block rounded-full bg-[var(--btn,#0071e3)] px-5 py-3 text-[17px] text-white hover:bg-[#0077ed] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
        >
          {t('summary.seeResults')}
        </a>
        <p className="mt-4 text-xs leading-relaxed text-[var(--faint,#86868b)]">{t('summary.fine')}</p>
      </aside>

      {/* Mobile and tablet: bottom sheet */}
      <aside
        aria-label={t('summary.heading')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-[#f5f5f7]/90 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-[1068px] items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex">
              <VerdictBadge tone={tone} label={t(`verdict.${tone}`)} className="max-w-full truncate" />
            </div>
            <p className="mt-1.5 truncate text-sm text-[var(--muted,#6e6e73)] tabular-nums">
              {t('summary.engine', { kwe: result.engineKwe })}
              {result.chillerKwc > 0 ? ` ${t('summary.chiller', { kwc: result.chillerKwc })}` : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none font-semibold tracking-[-0.04em] tabular-nums">
              {payback.central}
            </p>
            <p className="mt-1 text-xs text-[var(--muted,#6e6e73)] tabular-nums">
              {t('summary.rangeShort', { favourable: payback.favourable, unfavourable: payback.unfavourable })}
            </p>
          </div>
          <a
            href="#results"
            aria-label={t('summary.seeResults')}
            className="shrink-0 rounded-full bg-[var(--btn,#0071e3)] px-4 py-2 text-sm text-white focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
          >
            {t('summary.seeResultsShort')}
          </a>
        </div>
      </aside>
    </>
  );
}
