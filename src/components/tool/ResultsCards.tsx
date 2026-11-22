'use client';

// The headline option's results, the Keynote way: a dark panel, one range per row, each drawn as a
// <RangeRail/> (favourable / central / unfavourable, central marked) with the three values beside it.
import { useTranslations } from 'next-intl';
import type { PlantOption } from '@/lib/engine';
import { formatKw, formatRange, formatTnd, type FormattedRange } from '@/lib/present';
import { RangeRail } from './RangeRail';
import { METRICS, scalesFor, type MetricId } from './results-metrics';

/** "200 kWe engine + 64 kWc chiller" or "100 kWe engine, no chiller". */
export function usePlantText() {
  const t = useTranslations('tool.results.plant');
  return (option: PlantOption) =>
    option.chillerKwc > 0
      ? t('both', { kwe: formatKw(option.engineKwe, 'kWe'), kwc: formatKw(option.chillerKwc, 'kWc') })
      : t('engineOnly', { kwe: formatKw(option.engineKwe, 'kWe') });
}

/** Spoken text for a rail: "Payback: favourable 5 years, central 9 years, unfavourable 21.5 years". */
export function useRailLabel() {
  const t = useTranslations('tool.results');
  return (title: string, range: FormattedRange) =>
    t('rail', { title, favourable: range.favourable, central: range.central, unfavourable: range.unfavourable });
}

function Extra({ id, option }: { id: MetricId; option: PlantOption }) {
  const t = useTranslations('tool.results.metrics');
  if (id === 'payback') {
    return (
      <>
        {t('payback.fte', { range: formatRange(option, 'paybackYearsWithFte').text })}{' '}
        <span className="mt-1 inline-block rounded-full border border-[#48484a] px-2 py-0.5 text-[11px] whitespace-nowrap text-[#d2d2d7]">
          {t('payback.fteFlag')}
        </span>
      </>
    );
  }
  if (id === 'savings') {
    return t('savings.demandCharge', { value: formatTnd(option.scenarios.favourable.demandChargeSavingTnd) });
  }
  return null;
}

export function ResultsCards({ option }: { option: PlantOption }) {
  const t = useTranslations('tool.results');
  const railLabel = useRailLabel();
  const scales = scalesFor([option]);

  return (
    <div className="mt-12 rounded-[28px] bg-black px-5 pt-8 pb-7 text-[#f5f5f7] sm:px-10 sm:pt-12 sm:pb-10">
      <h3 className="max-w-3xl text-3xl leading-[1.08] font-semibold sm:text-[40px]">{t('cardsHeading')}</h3>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <span className="rounded-full border border-[#424245] px-3 py-1 text-[13px] text-[#d2d2d7] tabular-nums">
          {t('plant.engine', { kwe: formatKw(option.engineKwe, 'kWe') })}
        </span>
        <span className="rounded-full border border-[#424245] px-3 py-1 text-[13px] text-[#d2d2d7] tabular-nums">
          {option.chillerKwc > 0 ? t('plant.chiller', { kwc: formatKw(option.chillerKwc, 'kWc') }) : t('plant.noChiller')}
        </span>
      </div>

      <ul className="mt-8 border-t border-[#333]">
        {METRICS.map((m) => {
          const range = formatRange(option, m.key);
          const title = t(`metrics.${m.id}.title`);
          const single = range.favourable === range.central && range.unfavourable === range.central;
          return (
            <li
              key={m.id}
              className="grid gap-x-8 gap-y-3 border-b border-[#222] py-7 lg:grid-cols-[190px_1fr_250px] lg:items-center"
            >
              <div className="text-[15px] text-[#a1a1a6]">
                <b className="mb-1 block font-display text-[19px] leading-tight font-semibold tracking-[-0.02em] text-[#f5f5f7]">
                  {title}
                </b>
                {t(`metrics.${m.id}.description`)}
              </div>
              <div className="order-last lg:order-none">
                <RangeRail range={range} metric={m.key} scale={scales[m.id]} label={railLabel(title, range)} />
              </div>
              <div className="lg:text-right">
                <p className="font-display text-[34px] leading-none font-semibold tracking-[-0.045em] whitespace-nowrap tabular-nums">
                  {range.central}
                </p>
                <p className="mt-2 text-[13px] leading-snug text-[#86868b] tabular-nums">
                  {single ? (
                    t('sameInAll')
                  ) : (
                    <>
                      <span className="block">{t('favourableValue', { value: range.favourable })}</span>
                      <span className="block">{t('unfavourableValue', { value: range.unfavourable })}</span>
                    </>
                  )}
                </p>
              </div>
              {m.id === 'payback' || m.id === 'savings' ? (
                <p className="order-last text-[13px] leading-relaxed text-[#a1a1a6] tabular-nums lg:col-span-3 lg:col-start-1">
                  <Extra id={m.id} option={option} />
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-[#86868b]">{t('scenarioNote')}</p>
    </div>
  );
}
