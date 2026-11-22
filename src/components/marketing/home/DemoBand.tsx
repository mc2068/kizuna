import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { ScenarioResult, SizingResult, Scenario } from '@/lib/engine';
import { formatRange, formatValue, rangeOf } from '@/lib/present';
import { Footnote } from '../Footnote';
import { RangeRail } from '../RangeRail';
import { Reveal } from '../Reveal';
import { DEMO_INPUT } from '../demo';
import { djerbaCase } from '@/content/method';

type Row = { key: 'payback' | 'savings' | 'capex' | 'co2'; field: keyof ScenarioResult; unit: string; max: number };
const ROWS: Row[] = [
  { key: 'payback', field: 'paybackYears', unit: 'years', max: 25 },
  { key: 'savings', field: 'annualSavingsTnd', unit: 'TND', max: 300_000 },
  { key: 'capex', field: 'capexTnd', unit: 'TND', max: 3_000_000 },
  { key: 'co2', field: 'co2AvoidedTonnes', unit: 't', max: 300 },
];

export function scenarioValues(s: Record<Scenario, ScenarioResult>, field: keyof ScenarioResult) {
  return { favourable: s.favourable[field], central: s.central[field], unfavourable: s.unfavourable[field] };
}

/** The Djerba demo as ranges on a dark band. */
export async function DemoBand({ demo, id = 'demo' }: { demo: SizingResult; id?: string }) {
  const t = await getTranslations('marketing.home.demo');
  const s = demo.scenarios;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-dark px-4 py-20 text-white sm:px-6 md:py-28">
      <div className="mx-auto max-w-[1100px]">
        <h2 id={`${id}-title`} className="text-display font-semibold">
          {t('title', { rooms: DEMO_INPUT.rooms })}
          <span className="block text-dark-muted">{t('titleSub')}</span>
        </h2>
        <ul className="mt-8 flex flex-wrap gap-2 text-[14px]">
          {(['hotel', 'pool', 'tariff'] as const).map((k) => (
            <li key={k} className="rounded-full bg-white/10 px-3 py-1">
              {t(`chips.${k}`, { stars: djerbaCase.hotel.stars })}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[17px]">
          <span className="text-dark-muted">{t('plantLabel')} </span>
          <span className="tabular font-semibold">{t('plant', { kwe: demo.engineKwe, kwc: demo.chillerKwc })}</span>
          <Footnote id="engine-model" />
        </p>

        <div className="mt-12 grid gap-10">
          {ROWS.map((row, i) => {
            const v = scenarioValues(s, row.field);
            const r = rangeOf(s, row.field);
            return (
              <Reveal key={row.key} delay={i * 80}>
                <div className="grid gap-4 border-t border-white/15 pt-6 md:grid-cols-[200px_1fr_220px] md:items-center md:gap-10">
                  <div>
                    <h3 className="font-sans text-[17px] font-semibold">{t(`rows.${row.key}.title`)}</h3>
                    <p className="text-[14px] text-dark-muted">{t(`rows.${row.key}.body`)}</p>
                  </div>
                  <RangeRail tone="dark" title={t(`rows.${row.key}.title`)} {...v} unit={row.unit} max={row.max} />
                  <div className="md:text-right">
                    <p className="tabular font-display text-[34px] leading-none font-semibold tracking-tight">
                      {formatRange(s, row.field, row.unit)}
                    </p>
                    <p className="mt-1 text-[14px] text-dark-muted">
                      {t(`rows.${row.key}.central`, { value: formatValue(r.central, row.unit) })}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <p className="mt-12 max-w-[46rem] text-[14px] text-dark-muted">
          {t('legend')}
          <Footnote id="engine-model" />{' '}
          {t('fte', { range: formatRange(s, 'paybackYearsWithFte', 'years') })}
          <Footnote id="fte" />
        </p>
        <Link href="/case-study/djerba" className="text-link-chevron mt-8 inline-block text-[17px] text-[#2997ff] hover:underline">
          {t('cta')}
        </Link>
      </div>
    </section>
  );
}
