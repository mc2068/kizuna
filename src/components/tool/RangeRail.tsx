'use client';

// A result range on a rail, after the Keynote prototype's demo section: the span runs from the lower
// to the higher end of the favourable and unfavourable cases and the dot marks the central case, with
// its value above it. The axis runs from 0 to a round maximum, shared by every option on screen.
// Role 3 may ship a shared <RangeRail/>; until then the tool keeps its own here.
// Every label is text from @/lib/present; raw values only place the marks.
// #27: the span and the dot glide to new values and the central label tweens; instant under reduced motion.
import { motion } from 'framer-motion';
import type { FormattedRange, RangeKey } from '@/lib/present';
import { Tween, useGlide } from './motion';
import { formatterFor, type Scale } from './results-metrics';

type Tone = 'dark' | 'light';
type Size = 'lg' | 'sm';

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
    tick: 'text-[#8e8e93]',
    spanFrom: '#48484a',
    spanTo: '#f5f5f7',
  },
  light: {
    track: 'bg-[#e3e3e8]',
    dot: 'bg-[var(--ink,#1d1d1f)] shadow-[0_0_0_3px_var(--tile,#f5f5f7)]',
    central: 'text-[var(--ink,#1d1d1f)]',
    tick: 'text-[var(--muted,#6e6e73)]',
    spanFrom: '#d2d2d7',
    spanTo: '#6e6e73',
  },
} as const;

const sizeClass = {
  lg: { box: 'h-14', label: 'text-xs', tick: 'top-[40px] text-[11px]', track: 'top-[25px]', span: 'top-[22px] h-2', dot: 'top-[18px] -ml-2 size-4' },
  sm: { box: 'h-12', label: 'text-[11px]', tick: 'top-[34px] text-[10px]', track: 'top-[21px]', span: 'top-[18px] h-2', dot: 'top-[15px] -ml-[7px] size-3.5' },
} as const;

export function RangeRail({ range, metric, scale, label, tone = 'dark', size = 'lg' }: RangeRailProps) {
  const c = toneClass[tone];
  const s = sizeClass[size];
  const glide = useGlide();
  const { favourable, central, unfavourable } = range.values;
  const pct = (v: number) => (Math.min(Math.max(v, 0), scale.max) / scale.max) * 100;

  const lo = pct(Math.min(favourable, unfavourable));
  const hi = pct(Math.max(favourable, unfavourable));
  const mid = pct(central);
  const width = Math.max(hi - lo, 0.75);
  const midInSpan = Math.min(Math.max(((mid - lo) / width) * 100, 0), 100);
  const capped = Math.max(favourable, unfavourable) > scale.max;
  const format = formatterFor(metric);
  // Past the cap, the end of the axis reads like the value it stands for ("over 30 years").
  const axisEnd = capped ? format(Math.max(favourable, unfavourable)) : format(scale.max);

  return (
    <div role="img" aria-label={label} className={`relative ${s.box} min-w-0`}>
      <div aria-hidden="true">
        <div className={`absolute inset-x-0 ${s.track} h-0.5 rounded ${c.track}`} />
        <motion.div
          className={`absolute ${s.span} rounded-full`}
          style={{ background: `linear-gradient(90deg, ${c.spanFrom}, ${c.spanTo} var(--mid), ${c.spanFrom})` }}
          initial={false}
          animate={{ left: `${lo}%`, width: `${width}%`, '--mid': `${midInSpan}%` } as Record<string, string>}
          transition={glide}
        />
        {/* Shifted by its own position, so the label stays inside the rail at both ends and glides smoothly. */}
        <motion.span
          className={`absolute top-0 font-semibold whitespace-nowrap tabular-nums ${s.label} ${c.central}`}
          initial={false}
          animate={{ left: `${mid}%`, x: `-${mid}%` }}
          transition={glide}
        >
          <Tween value={central} format={format} />
        </motion.span>
        <motion.div
          className={`absolute ${s.dot} rounded-full ${c.dot}`}
          initial={false}
          animate={{ left: `${mid}%` }}
          transition={glide}
        />
        <span className={`absolute left-0 whitespace-nowrap tabular-nums ${s.tick} ${c.tick}`}>{format(0)}</span>
        <span className={`absolute right-0 whitespace-nowrap tabular-nums ${s.tick} ${c.tick}`}>{axisEnd}</span>
      </div>
    </div>
  );
}
