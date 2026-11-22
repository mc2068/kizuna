'use client';

// The recharts part of the hourly dashboard (#11), split out of HourlyChart so it loads only when it
// comes near the viewport (#27).
import { useTranslations } from 'next-intl';
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis, type TooltipContentProps } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import type { HourRow } from '@/lib/engine';
import { formatKw } from '@/lib/present';
import { HOUR_TICKS, padHour, type HourlyTab, type Series } from './hourly-data';
import { Swatch } from './HourlySwatch';
import { TWEEN_S } from './motion';

/** Curves morph in place over the same time as the numbers tween. */
const ANIMATION_MS = TWEEN_S * 1000;

/** Axis ticks are chart gridlines, not engine numbers: plain en-GB grouping, the unit sits above the axis. */
const axisNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });

function HourlyTooltip({ active, payload, label, series }: TooltipContentProps & { series: Series[] }) {
  const t = useTranslations('tool.hourly');
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Record<string, number>;
  return (
    <div className="min-w-44 rounded-xl border border-[var(--line,#d2d2d7)] bg-white/95 px-3 py-2 text-[13px] shadow-lg backdrop-blur">
      <p className="mb-1 font-semibold tabular-nums">{t('hour', { hour: padHour(Number(label)) })}</p>
      <ul className="space-y-0.5">
        {[...series].reverse().map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <Swatch series={s} />
            <span className="text-[var(--muted,#6e6e73)]">{t(`series.${s.key}`)}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums">{formatKw(row[s.key])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type HourlyPlotProps = {
  rows: HourRow[];
  series: Series[];
  tab: HourlyTab;
  yMax: number;
  yTicks: number[];
  config: ChartConfig;
  animate: boolean;
};

export function HourlyPlot({ rows, series, tab, yMax, yTicks, config, animate }: HourlyPlotProps) {
  const t = useTranslations('tool.hourly');
  const hour = (h: number) => t('hour', { hour: padHour(h) });
  const reducedMotion = !animate;
  const yScale = { max: yMax, ticks: yTicks };
  return (
    <ChartContainer
      config={config}
      initialDimension={{ width: 320, height: 256 }}
      className="aspect-auto h-64 w-full sm:h-80 [&_.recharts-surface:focus-visible]:outline-4 [&_.recharts-surface:focus-visible]:outline-[rgba(0,125,250,.35)]"
    >
      <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--line,#d2d2d7)" strokeDasharray="2 4" />
        <XAxis
          dataKey="hour"
          type="number"
          domain={[0, 23]}
          ticks={HOUR_TICKS}
          tickFormatter={hour}
          tickLine={false}
          axisLine={{ stroke: 'var(--line,#d2d2d7)' }}
          tick={{ fill: 'var(--muted,#6e6e73)', fontSize: 12 }}
          tickMargin={8}
        />
        <YAxis
          domain={[0, yScale.max]}
          ticks={yScale.ticks}
          tickFormatter={(v: number) => axisNumber.format(v)}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted,#6e6e73)', fontSize: 12 }}
          width={44}
        />
        <ChartTooltip
          content={(props) => <HourlyTooltip {...props} series={series} />}
          cursor={{ stroke: 'var(--faint,#86868b)', strokeWidth: 1 }}
          isAnimationActive={false}
        />
        {series.map((s) =>
          s.kind === 'area' ? (
            <Area
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stackId={tab === 'elec' ? 'supply' : undefined}
              stroke={`var(--color-${s.key})`}
              strokeWidth={1.5}
              fill={`var(--color-${s.key})`}
              fillOpacity={s.key === 'gridImport' ? 0.35 : 0.55}
              isAnimationActive={!reducedMotion}
              animationDuration={ANIMATION_MS}
              animationEasing="ease-out"
              activeDot={{ r: 3, strokeWidth: 0, fill: `var(--color-${s.key})` }}
            />
          ) : (
            <Line
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={!reducedMotion}
              animationDuration={ANIMATION_MS}
              animationEasing="ease-out"
              activeDot={{ r: 3, strokeWidth: 0, fill: `var(--color-${s.key})` }}
            />
          ),
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
