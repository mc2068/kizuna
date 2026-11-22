'use client';

// A result range on a rail, after the Keynote prototype's demo section: the span runs from the lower
// to the higher end of the favourable and unfavourable cases and the dot marks the central case, with
// its value above it. The axis runs from 0 to a round maximum, shared by every option on screen.
// Role 3 may ship a shared <RangeRail/>; until then the tool keeps its own here.
// Every label is text from @/lib/present; raw values only place the marks.
import {
  RANGE_KIND,
  formatHours,
  formatKw,
  formatPercent,
  formatTnd,
  formatTonnes,
  formatYears,
  type FormattedRange,
  type RangeKey,
  type RangeKind,
} from '@/lib/present';
import type { Scale } from './results-metrics';

type Tone = 'dark' | 'light';
type Size = 'lg' | 'sm';

const AXIS_FORMAT: Record<RangeKind, (n: number) => string> = {
  tnd: formatTnd,
  years: formatYears,
  kw: (n) => formatKw(n),
  tonnes: formatTonnes,
  percent: formatPercent,
  hours: formatHours,
};

type RangeRailProps = {
  range: FormattedRange;
  /** Engine field the range comes from; picks the axis label format. */
  metric: RangeKey;
  scale: Scale;
  /** Spoken description, e.g. "Payback: favourable 5 years, central 9 years, unfavourable 21.5 years". */
  label: string;
  tone?: Tone;
  size?: Size;
};

// Written out in full so Tailwind's scanner sees every class.
const toneClass = {
  dark: {
    track: 'bg-[#2c2c2e]',
    dot: 'bg-[#f5f5f7] shadow-[0_0_0_4px_#000]',
    central: 'text-[#f5f5f7]',
    tick: 'text-[#6e6e73]',
    spanFrom: '#48484a',
    spanTo: '#f5f5f7',
  },
  light: {
    track: 'bg-[#e3e3e8]',
    dot: 'bg-[var(--ink,#1d1d1f)] shadow-[0_0_0_3px_var(--tile,#f5f5f7)]',
    central: 'text-[var(--ink,#1d1d1f)]',
    tick: 'text-[var(--faint,#86868b)]',
    spanFrom: '#d2d2d7',
    spanTo: '#6e6e73',
  },
} as const;

const sizeClass = {
  lg: { box: 'h-14', label: 'text-xs', tick: 'top-[40px] text-[11px]', track: 'top-[25px]', span: 'top-[22px] h-2', dot: 'top-[18px] -ml-2 size-4' },
  sm: { box: 'h-12', label: 'text-[11px]', tick: 'top-[34px] text-[10px]', track: 'top-[21px]', span: 'top-[18px] h-2', dot: 'top-[15px] -ml-[7px] size-3.5' },
} as const;

/** Keeps a label inside the rail at either end instead of centring it on its position. */
function anchor(pct: number): string {
  if (pct < 12) return 'translateX(-12%)';
  if (pct > 88) return 'translateX(-88%)';
  return 'translateX(-50%)';
}

export function RangeRail({ range, metric, scale, label, tone = 'dark', size = 'lg' }: RangeRailProps) {
  const c = toneClass[tone];
  const s = sizeClass[size];
  const { favourable, central, unfavourable } = range.values;
  const pct = (v: number) => (Math.min(Math.max(v, 0), scale.max) / scale.max) * 100;

  const lo = pct(Math.min(favourable, unfavourable));
  const hi = pct(Math.max(favourable, unfavourable));
  const mid = pct(central);
  const width = Math.max(hi - lo, 0.75);
  const midInSpan = ((mid - lo) / width) * 100;
  const capped = Math.max(favourable, unfavourable) > scale.max;
  const format = AXIS_FORMAT[RANGE_KIND[metric]];
  // Past the cap, the end of the axis reads like the value it stands for ("over 30 years").
  const axisEnd = capped ? format(Math.max(favourable, unfavourable)) : format(scale.max);

  const transition = 'transition-all duration-500 ease-out motion-reduce:transition-none';

  return (
    <div role="img" aria-label={label} className={`relative ${s.box} min-w-0`}>
      <div aria-hidden="true">
        <div className={`absolute inset-x-0 ${s.track} h-0.5 rounded ${c.track}`} />
        <div
          className={`absolute ${s.span} rounded-full ${transition}`}
          style={{
            left: `${lo}%`,
            width: `${width}%`,
            background: `linear-gradient(90deg, ${c.spanFrom}, ${c.spanTo} ${midInSpan}%, ${c.spanFrom})`,
          }}
        />
        <span
          className={`absolute top-0 font-semibold whitespace-nowrap tabular-nums ${s.label} ${c.central} ${transition}`}
          style={{ left: `${mid}%`, transform: anchor(mid) }}
        >
          {range.central}
        </span>
        <div className={`absolute ${s.dot} rounded-full ${c.dot} ${transition}`} style={{ left: `${mid}%` }} />
        <span className={`absolute left-0 whitespace-nowrap tabular-nums ${s.tick} ${c.tick}`}>{format(0)}</span>
        <span className={`absolute right-0 whitespace-nowrap tabular-nums ${s.tick} ${c.tick}`}>{axisEnd}</span>
      </div>
    </div>
  );
}
