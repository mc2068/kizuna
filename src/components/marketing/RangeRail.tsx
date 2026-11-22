import { useTranslations } from 'next-intl';
import { formatValue } from '@/lib/present';
import { cn } from '@/lib/utils';

export type RangeRailProps = {
  favourable: number;
  central: number;
  unfavourable: number;
  unit: string;
  /** Axis bounds. Defaults: 0 to 120% of the largest value. */
  min?: number;
  max?: number;
  /** Accessible name, e.g. "Payback". */
  title?: string;
  /** Override the labels (already formatted, e.g. by @/lib/present). */
  labels?: { favourable: string; central: string; unfavourable: string };
  tone?: 'light' | 'dark';
  className?: string;
};

/**
 * A range on a rail: the favourable and unfavourable ends, with the central case marked by a dot.
 * Works whether "favourable" is the low end (payback) or the high end (savings).
 */
export function RangeRail({
  favourable,
  central,
  unfavourable,
  unit,
  min = 0,
  max,
  title,
  labels,
  tone = 'light',
  className,
}: RangeRailProps) {
  const t = useTranslations('common.rangeRail');
  const top = max ?? Math.max(favourable, central, unfavourable) * 1.2;
  const pct = (v: number) => Math.min(100, Math.max(0, ((v - min) / (top - min || 1)) * 100));
  const lo = Math.min(favourable, unfavourable);
  const hi = Math.max(favourable, unfavourable);
  const f = (v: number) => formatValue(v, unit);
  const l = labels ?? { favourable: f(favourable), central: f(central), unfavourable: f(unfavourable) };
  const dark = tone === 'dark';
  const left = pct(lo);
  const width = Math.max(1, pct(hi) - left);
  const ends = favourable <= unfavourable ? [l.favourable, l.unfavourable] : [l.unfavourable, l.favourable];
  const endText = dark ? 'text-dark-muted' : 'text-muted';

  return (
    <div
      role="img"
      aria-label={t('label', { title: title ?? '', favourable: l.favourable, central: l.central, unfavourable: l.unfavourable })}
      className={cn('relative h-14 w-full select-none', className)}
      data-range-rail
    >
      <div className={cn('absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full', dark ? 'bg-white/15' : 'bg-line/70')} />
      <div
        className={cn('absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full', dark ? 'bg-white/55' : 'bg-ink/30')}
        style={{ left: `${left}%`, width: `${width}%` }}
      />
      <div
        className={cn(
          'absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4',
          dark ? 'bg-white ring-dark' : 'bg-ink ring-bg',
        )}
        style={{ left: `${pct(central)}%` }}
      />
      <span
        aria-hidden="true"
        className={cn('tabular absolute top-0 -translate-x-1/2 text-[12px] whitespace-nowrap', endText)}
        style={{ left: `${left}%` }}
      >
        {ends[0]}
      </span>
      <span
        aria-hidden="true"
        className={cn('tabular absolute top-0 -translate-x-1/2 text-[12px] whitespace-nowrap', endText)}
        style={{ left: `${left + width}%` }}
      >
        {ends[1]}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'tabular absolute bottom-0 -translate-x-1/2 text-[13px] font-semibold whitespace-nowrap',
          dark ? 'text-white' : 'text-ink',
        )}
        style={{ left: `${pct(central)}%` }}
      >
        {l.central}
      </span>
    </div>
  );
}
