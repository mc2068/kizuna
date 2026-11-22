'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { percent, type Coverage } from './coverage';

const RINGS = [
  { key: 'elec', color: 'var(--elec)' },
  { key: 'heat', color: 'var(--heat)' },
  { key: 'cool', color: 'var(--cool)' },
] as const;

/**
 * Three concentric rings: share of electricity, hot water and cooling the plant covers (0-1).
 * Server-rendered fully drawn, so the figure is complete without JavaScript. When it scrolls into
 * view the rings redraw from empty, unless the visitor prefers reduced motion.
 */
export function Rings({
  elec,
  heat,
  cool,
  size = 320,
  stroke = 32,
  legend = 'side',
  tone = 'light',
  className,
}: Coverage & {
  size?: number;
  stroke?: number;
  legend?: 'side' | 'below' | 'none';
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const t = useTranslations('common.rings');
  const ref = useRef<SVGSVGElement>(null);
  const values: Coverage = { elec, heat, cool };
  const c = size / 2;
  const gap = stroke * 0.3;
  const rings = RINGS.map((ring, i) => {
    const r = c - stroke / 2 - i * (stroke + gap);
    const len = 2 * Math.PI * r;
    // A small visible stub even at 0-3%, so the ring reads as "almost nothing", not "missing".
    return { ...ring, r, len, target: len * (1 - Math.max(0.02, values[ring.key])) };
  });

  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const arcs = Array.from(svg.querySelectorAll<SVGCircleElement>('[data-ring]'));
    arcs.forEach((a) => {
      a.style.transition = 'none';
      a.style.strokeDashoffset = a.dataset.len ?? '0';
    });
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        requestAnimationFrame(() =>
          arcs.forEach((a, i) => {
            a.style.transition = `stroke-dashoffset 1.4s cubic-bezier(.16,1,.3,1) ${150 * i}ms`;
            a.style.strokeDashoffset = a.dataset.target ?? '0';
          }),
        );
      },
      { threshold: 0.3 },
    );
    io.observe(svg);
    return () => {
      io.disconnect();
      arcs.forEach((a) => {
        a.style.transition = 'none';
        a.style.strokeDashoffset = a.dataset.target ?? '0';
      });
    };
  }, [elec, heat, cool]);

  return (
    <figure
      data-rings
      className={cn('flex items-center gap-8', legend === 'below' ? 'flex-col' : 'flex-col sm:flex-row', className)}
    >
      <svg
        ref={ref}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={t('label', { elec: percent(elec), heat: percent(heat), cool: percent(cool) })}
        className="h-auto max-w-full"
      >
        {rings.map((ring) => (
          <g key={ring.key} transform={`rotate(-90 ${c} ${c})`}>
            <circle cx={c} cy={c} r={ring.r} fill="none" stroke={ring.color} strokeOpacity={0.15} strokeWidth={stroke} />
            <circle
              data-ring={ring.key}
              data-len={ring.len}
              data-target={ring.target}
              cx={c}
              cy={c}
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={ring.len}
              strokeDashoffset={ring.target}
            />
          </g>
        ))}
      </svg>
      {legend !== 'none' && (
        <figcaption>
          <ul className={cn('grid grid-cols-3 gap-4', legend === 'below' ? 'text-center' : 'sm:grid-cols-1')}>
            {rings.map((ring) => (
              <li key={ring.key} className="flex flex-col">
                <span className="tabular font-display text-[34px] leading-none font-semibold tracking-tight md:text-[44px]">
                  {percent(values[ring.key])}%
                </span>
                <span
                  className={cn(
                    'mt-1.5 inline-flex items-center gap-1.5 text-[15px]',
                    tone === 'dark' ? 'text-dark-muted' : 'text-muted',
                    legend === 'below' && 'justify-center',
                  )}
                >
                  <i aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: ring.color }} />
                  {t(ring.key)}
                </span>
              </li>
            ))}
          </ul>
        </figcaption>
      )}
    </figure>
  );
}
