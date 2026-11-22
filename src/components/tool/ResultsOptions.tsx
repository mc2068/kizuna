'use client';

// Trigeneration beside the faster, smaller option (usually CHP only: hot water and pool heat, no
// chiller), shown only when the engine found one that pays back sooner. Both columns share axes.
import { useTranslations } from 'next-intl';
import type { PlantOption } from '@/lib/engine';
import { formatRange, verdictTone, type VerdictTone } from '@/lib/present';
import { RangeRail } from './RangeRail';
import { usePlantText, useRailLabel } from './ResultsCards';
import { COMPARE_RAILS, METRICS, metric, scalesFor, type MetricId } from './results-metrics';

// Same pills as the summary (ToolSummary), Contract 2 token names with fallbacks.
export const badgeTone: Record<VerdictTone, string> = {
  good: 'bg-[var(--good-soft,#eef8f2)] text-[var(--good-text,#1a7a42)]',
  maybe: 'bg-[var(--maybe-soft,#fbf1e2)] text-[var(--maybe-text,#8f5600)]',
  weak: 'bg-[var(--weak-soft,#eeeff0)] text-[var(--weak-text,#5f5f63)]',
};

const TEXT_ROWS: readonly MetricId[] = METRICS.map((m) => m.id).filter((id) => !COMPARE_RAILS.includes(id));

function OptionColumn({
  option,
  kind,
  scales,
}: {
  option: PlantOption;
  kind: 'trigeneration' | 'chpOnly' | 'bestAny';
  scales: ReturnType<typeof scalesFor>;
}) {
  const t = useTranslations('tool');
  const plantText = usePlantText();
  const railLabel = useRailLabel();
  const tone = verdictTone(option.verdict);
  const headline = kind === 'trigeneration';

  return (
    <article
      aria-labelledby={`option-${kind}`}
      className={`rounded-[28px] bg-[var(--tile,#f5f5f7)] px-6 pt-7 pb-6 sm:px-8 ${headline ? '' : 'ring-2 ring-[var(--btn,#0071e3)]'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold ${headline ? 'bg-[#e3e3e8] text-[var(--muted,#6e6e73)]' : 'bg-[var(--btn,#0071e3)] text-white'}`}
        >
          {headline ? t('results.options.headline') : t('results.options.faster')}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold ${badgeTone[tone]}`}>
          {t(`verdict.${tone}`)}
        </span>
      </div>
      <h4 id={`option-${kind}`} className="mt-4 font-display text-[28px] leading-tight font-semibold tracking-[-0.035em]">
        {t(`results.options.${kind}`)}
      </h4>
      <p className="mt-1 text-sm text-[var(--muted,#6e6e73)]">{t(`results.options.${kind}Note`)}</p>
      <p className="mt-3 text-[15px] font-medium tabular-nums">{plantText(option)}</p>

      <dl className="mt-5">
        {COMPARE_RAILS.map((id) => {
          const m = metric(id);
          const range = formatRange(option, m.key);
          const title = t(`results.metrics.${id}.title`);
          return (
            <div key={id} className="border-t border-[#e3e3e8] pt-4 pb-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <dt className="text-[13px] text-[var(--muted,#6e6e73)]">{title}</dt>
                <dd className="text-[15px] font-medium tabular-nums">{range.text}</dd>
              </div>
              <div className="mt-1">
                <RangeRail
                  range={range}
                  metric={m.key}
                  scale={scales[id]}
                  label={railLabel(title, range)}
                  tone="light"
                  size="sm"
                />
              </div>
            </div>
          );
        })}
        {TEXT_ROWS.map((id) => (
          <div key={id} className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-[#e3e3e8] py-2.5">
            <dt className="text-[13px] text-[var(--muted,#6e6e73)]">{t(`results.metrics.${id}.title`)}</dt>
            <dd className="text-[15px] font-medium tabular-nums">{formatRange(option, metric(id).key).text}</dd>
          </div>
        ))}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-[#e3e3e8] py-2.5">
          <dt className="text-[13px] text-[var(--muted,#6e6e73)]">
            {t('results.options.fte')}
            <span className="block text-xs text-[var(--faint,#86868b)]">{t('results.metrics.payback.fteFlag')}</span>
          </dt>
          <dd className="text-[15px] font-medium tabular-nums">{formatRange(option, 'paybackYearsWithFte').text}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ResultsOptions({ trigeneration, faster }: { trigeneration: PlantOption; faster: PlantOption }) {
  const t = useTranslations('tool.results.options');
  const scales = scalesFor([trigeneration, faster]);
  return (
    <section aria-labelledby="options-heading" className="mt-16">
      <h3 id="options-heading" className="text-3xl font-semibold sm:text-[40px]">
        {t('heading')}
      </h3>
      <p className="mt-3 max-w-2xl text-lg text-[var(--muted,#6e6e73)]">{t('intro')}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <OptionColumn option={trigeneration} kind="trigeneration" scales={scales} />
        <OptionColumn option={faster} kind={faster.chillerKwc > 0 ? 'bestAny' : 'chpOnly'} scales={scales} />
      </div>
    </section>
  );
}
