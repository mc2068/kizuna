'use client';

// Hourly dashboard (#11): 24 hours of a typical summer and winter day for the headline option,
// central case (Contract 1 result.hourly). Tabs pick the need (electricity, hot water, cooling);
// a segmented control picks the season. The chart stays mounted, so a new season or new inputs
// morph the curves in place. A visually hidden table carries the same numbers for screen readers.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import type { ChartConfig } from '@/components/ui/chart';
import { formatKw, formatPercent } from '@/lib/present';
import { Swatch } from './HourlySwatch';
import { useNoMotion } from './motion';
import { useTool } from './ToolState';
import {
  HOURLY_TABS,
  SEASONS,
  TABLE_COLUMNS,
  TAB_SERIES,
  dayFigures,
  padHour,
  tabScale,
  type HourlyTab,
  type Season,
} from './hourly-data';

// #27: recharts is the biggest script on /tool and the chart sits well below the fold, so the plot
// loads only when it comes near the viewport. Its box keeps the same fixed height meanwhile, so
// nothing jumps; the tabs, captions and the screen-reader table render with the page.
const HourlyPlot = dynamic(() => import('./HourlyPlot').then((m) => m.HourlyPlot), {
  ssr: false,
  loading: () => <PlotBox />,
});

function PlotBox() {
  return <div aria-hidden="true" className="h-64 w-full sm:h-80" />;
}

function LazyPlot(props: React.ComponentProps<typeof HourlyPlot>) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Old browsers and jsdom: load it straight away.
      const id = window.setTimeout(() => setNear(true), 0);
      return () => window.clearTimeout(id);
    }
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return <div ref={ref}>{near ? <HourlyPlot {...props} /> : <PlotBox />}</div>;
}

// Written out in full so Tailwind's scanner sees every class.
const tabClass =
  'rounded-full px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline-4 ' +
  'focus-visible:outline-[rgba(0,125,250,.35)] aria-selected:bg-[var(--ink,#1d1d1f)] aria-selected:text-white ' +
  'not-aria-selected:text-[var(--ink,#1d1d1f)] not-aria-selected:hover:bg-black/5';
const segmentClass =
  'relative flex-1 cursor-pointer rounded-full px-4 py-1.5 text-center text-[15px] font-medium ' +
  'text-[#515154] transition-[background-color,color,box-shadow] has-checked:bg-white ' +
  'has-checked:text-[var(--ink,#1d1d1f)] has-checked:shadow-[0_1px_3px_rgba(0,0,0,.12)] ' +
  'has-focus-visible:outline-4 has-focus-visible:outline-[rgba(0,125,250,.35)]';

export function HourlyChart() {
  const t = useTranslations('tool.hourly');
  const { result, resultInputs } = useTool();
  const uid = useId();
  const reducedMotion = useNoMotion();
  const [season, setSeason] = useState<Season>('summer');
  const [tab, setTab] = useState<HourlyTab>('elec');
  const tabRefs = useRef<Record<HourlyTab, HTMLButtonElement | null>>({ elec: null, heat: null, cool: null });

  const rows = result.hourly[season];
  const series = TAB_SERIES[tab];
  const yScale = tabScale(result.hourly, tab);
  const figures = dayFigures(rows);
  const hasChiller = result.chillerKwc > 0;
  const pool = String(resultInputs.pool);
  const hour = (h: number) => t('hour', { hour: padHour(h) });

  // shadcn chart config: series labels and their Contract 2 colours, one entry per HourRow field.
  const config = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        Object.values(TAB_SERIES)
          .flat()
          .map((s) => [s.key, { label: t(`series.${s.key}`), color: s.color }]),
      ),
    [t],
  );

  const seasonCaption =
    season === 'winter'
      ? t('season.winter', { pool })
      : hasChiller
        ? t('season.summer')
        : t('season.summerNoChiller', { pool });
  const tabCaption =
    tab === 'elec'
      ? t('caption.elec', {
          share: formatPercent(figures.engineShare),
          start: figures.engineStart == null ? 'none' : padHour(figures.engineStart),
        })
      : tab === 'heat'
        ? t('caption.heat', { share: formatPercent(figures.heatShare), pool, season })
        : hasChiller
          ? t('caption.cool', { share: formatPercent(figures.coolShare) })
          : t('caption.coolNoChiller');

  function onTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const i = HOURLY_TABS.indexOf(tab);
    const next =
      e.key === 'ArrowRight'
        ? HOURLY_TABS[(i + 1) % HOURLY_TABS.length]
        : e.key === 'ArrowLeft'
          ? HOURLY_TABS[(i - 1 + HOURLY_TABS.length) % HOURLY_TABS.length]
          : e.key === 'Home'
            ? HOURLY_TABS[0]
            : e.key === 'End'
              ? HOURLY_TABS[HOURLY_TABS.length - 1]
              : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  const ids = { heading: `${uid}-heading`, caption: `${uid}-caption`, panel: `${uid}-panel` };

  return (
    <section aria-labelledby={ids.heading} className="mt-20">
      <h3 id={ids.heading} className="text-3xl font-semibold sm:text-4xl">
        {t('heading')}
      </h3>
      <p className="mt-3 max-w-2xl text-lg text-[var(--muted,#6e6e73)]">{t('intro')}</p>

      <div className="mt-8 rounded-3xl bg-[var(--tile,#f5f5f7)] p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label={t('tabsLabel')} className="flex flex-wrap gap-1">
            {HOURLY_TABS.map((key) => (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[key] = el;
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${key}`}
                aria-selected={tab === key}
                aria-controls={ids.panel}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={onTabKeyDown}
                className={tabClass}
              >
                {t(`tabs.${key}`)}
              </button>
            ))}
          </div>

          <fieldset className="w-full sm:w-auto">
            <legend className="sr-only">{t('seasonLabel')}</legend>
            <div className="flex rounded-full bg-black/[.06] p-0.5 sm:min-w-56">
              {SEASONS.map((key) => (
                <label key={key} className={segmentClass}>
                  <input
                    type="radio"
                    name={`${uid}-season`}
                    value={key}
                    checked={season === key}
                    onChange={() => setSeason(key)}
                    className="sr-only"
                  />
                  {t(`seasons.${key}`)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div role="tabpanel" id={ids.panel} aria-labelledby={`${uid}-tab-${tab}`} className="mt-6">
          <p className="max-w-3xl text-[15px] leading-relaxed">{seasonCaption}</p>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-[var(--muted,#6e6e73)]" aria-hidden="true">
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <Swatch series={s} />
                {t(`series.${s.key}`)}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[12px] text-[var(--muted,#6e6e73)]" aria-hidden="true">
            {t('unit')}
          </p>
          {/* Fixed height so the page never jumps while the chart measures itself. */}
          <div
            role="group"
            aria-label={t('chartLabel', { tab: t(`tabs.${tab}`), season: t(`seasonName.${season}`) })}
            aria-describedby={ids.caption}
            className="mt-1 -ml-2"
          >
            <LazyPlot rows={rows} series={series} tab={tab} yMax={yScale.max} yTicks={yScale.ticks} config={config} animate={!reducedMotion} />
          </div>

          <p id={ids.caption} className="mt-4 max-w-3xl text-[13px] leading-relaxed text-[var(--muted,#6e6e73)]">
            {tabCaption}
          </p>
        </div>

        {/* Tables ignore sr-only's 1px width, so the clipping box is a wrapper. */}
        <div className="sr-only">
          <table>
            <caption>{t('table.caption', { season: t(`seasonName.${season}`) })}</caption>
            <thead>
              <tr>
                <th scope="col">{t('table.hour')}</th>
                {TABLE_COLUMNS.map((key) => (
                  <th key={key} scope="col">
                    {t(`series.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.hour}>
                  <th scope="row">{hour(r.hour)}</th>
                  {TABLE_COLUMNS.map((key) => (
                    <td key={key}>{formatKw(r[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
