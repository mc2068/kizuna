// Djerba case study (Role 3, #17). Numbers come from sizeHotel() and src/content/method.ts only.
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SENSITIVITY } from '@/content/method';
import { djerbaFacts } from '@/components/marketing/content';
import type { PlantOption } from '@/lib/engine';
import { verdictTone } from '@/lib/present';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Section, SectionHeading, Lede } from '@/components/marketing/Section';
import { Eyebrow } from '@/components/marketing/Eyebrow';
import { Footnote } from '@/components/marketing/Footnote';
import { Reveal } from '@/components/marketing/Reveal';
import { DayChart } from '@/components/marketing/DayChart';
import { HotelIllustration } from '@/components/marketing/HotelIllustration';
import { ResultRails } from '@/components/marketing/ResultRails';
import { Tornado } from '@/components/marketing/Tornado';
import { DEMO_INPUT, demoResult, requestStudyHref, toolHref } from '@/components/marketing/demo';
import { cn } from '@/lib/utils';
import { rangeText, num } from '@/components/marketing/format';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.caseStudy.meta');
  const description = t('description', { rooms: DEMO_INPUT.rooms });
  return { title: t('title'), description, openGraph: { title: t('title'), description } };
}

export default async function DjerbaCaseStudyPage() {
  const t = await getTranslations('marketing.caseStudy');
  const tv = await getTranslations('common.verdict');
  const demo = demoResult();
  const facts = djerbaFacts();
  const s = demo.scenarios;
  const { summer, winter } = demo.hourly;
  const summerPeak = Math.round(Math.max(...summer.map((r) => r.elecDemand)));
  const winterLow = Math.round(Math.min(...winter.map((r) => r.elecDemand)));
  const winterHigh = Math.round(Math.max(...winter.map((r) => r.elecDemand)));
  const tri = demo.options.trigeneration;
  const best = demo.options.best;
  const options = [
    { key: 'trigeneration', option: tri, note: t('options.trigenerationNote') },
    ...(best && best !== tri && best.chillerKwc === 0 ? [{ key: 'chp', option: best, note: t('options.chpNote') }] : []),
  ].filter((o): o is { key: string; option: PlantOption; note: string } => o.option != null);

  return (
    <main id="main">
      <section aria-labelledby="page-title" className="px-4 pt-16 pb-12 sm:px-6 md:pt-24">
        <div className="mx-auto max-w-[1100px]">
          <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
          <h1 id="page-title" className="text-hero font-semibold">
            {t('hero.title')}
            <span className="block text-faint">{t('hero.titleSub')}</span>
          </h1>
          <div className="mt-10 overflow-hidden rounded-[28px]">
            <HotelIllustration label={t('hero.photoAlt')} className="h-[220px] w-full sm:h-[340px] md:h-[420px]" />
          </div>
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[21px] font-semibold tracking-tight" data-case-facts>
                {t('hero.facts', { rooms: DEMO_INPUT.rooms, stars: facts.stars })}
              </p>
              <p className="mt-1 text-[15px] text-muted">
                {t('hero.note')}
                <Footnote id="engine-model" />
              </p>
            </div>
            <div className="rounded-[22px] bg-tile p-5 md:min-w-[340px]" data-case-verdict>
              <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">{t('verdict.label')}</p>
              <Badge variant={verdictTone(demo.verdict)} className="mt-2 text-[15px]">
                {tv(verdictTone(demo.verdict))}
              </Badge>
              <p className="tabular mt-3 font-semibold">{t('verdict.plant', { kwe: demo.engineKwe, kwc: demo.chillerKwc })}</p>
              <p className="tabular text-[15px] text-muted">
                {t('verdict.payback', { range: rangeText(s, 'paybackYears'), central: num(s.central.paybackYears) })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section labelledBy="demand-title" tone="tile">
        <SectionHeading id="demand-title">{t('demand.title')}</SectionHeading>
        <Lede>{t('demand.lede')}</Lede>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {[
            { key: 'summer', rows: summer, note: t('demand.summerNote', { peak: summerPeak }) },
            { key: 'winter', rows: winter, note: t('demand.winterNote', { low: winterLow, high: winterHigh }) },
          ].map((d) => {
            const peak = Math.round(Math.max(...d.rows.map((r) => r.elecDemand)));
            const engine = Math.round(Math.max(...d.rows.map((r) => r.engineElec)));
            const season = t(`demand.${d.key}`);
            return (
              <figure key={d.key} className="rounded-[22px] bg-white p-6" data-day={d.key}>
                <figcaption className="mb-4">
                  <span className="block text-[21px] font-semibold tracking-tight">{season}</span>
                  <span className="tabular text-[15px] text-muted">{d.note}</span>
                </figcaption>
                <DayChart
                  rows={d.rows}
                  label={t('demand.chartLabel', { season, peak, engine })}
                  kwLabel={t('demand.kw')}
                  hourTick={(h) => t('demand.hourTick', { h })}
                />
              </figure>
            );
          })}
        </div>
        <p className="mt-6 flex flex-wrap justify-center gap-6 text-[14px] text-muted">
          <span className="inline-flex items-center gap-2">
            <i aria-hidden="true" className="inline-block h-3 w-5 rounded bg-ink/15" />
            {t('demand.legendDemand')}
          </span>
          <span className="inline-flex items-center gap-2">
            <i aria-hidden="true" className="inline-block h-3 w-5 rounded bg-elec" />
            {t('demand.legendEngine')}
          </span>
        </p>
      </Section>

      <Section labelledBy="smaller-title">
        <SectionHeading id="smaller-title">{t('smaller.title')}</SectionHeading>
        <Lede>{t('smaller.lede')}</Lede>
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            {
              key: 'winter',
              values: {
                occupancy: Math.round(facts.winterOccupancy * 100),
                low: winterLow,
                high: winterHigh,
                days: facts.winterDays,
              },
            },
            { key: 'minLoad', values: { pct: Math.round(facts.minLoad * 100), oldKwe: facts.old.engineKwe } },
            {
              key: 'hours',
              values: {
                oldKwe: facts.old.engineKwe,
                oldHours: num(facts.old.fullLoadHours, 0),
                kwe: demo.engineKwe,
                hours: num(s.central.fullLoadHours, 0),
              },
            },
          ]
            .map((c) => c as unknown as { key: string; values: Record<string, string | number> })
            .map((c, i) => (
            <li key={c.key}>
              <Reveal delay={i * 90} className="h-full">
                <div className="h-full rounded-[22px] border border-line/70 bg-white p-6">
                  <h3 className="text-[22px] font-semibold tracking-tight">{t(`smaller.${c.key}.title`)}</h3>
                  <p className="tabular mt-2 text-muted">{t(`smaller.${c.key}.body`, c.values)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="tabular mx-auto mt-10 max-w-[40rem] text-center text-headline font-semibold">
          {t('smaller.result', { central: num(s.central.paybackYears), oldYears: num(facts.old.paybackYears) })}
          <Footnote id="engine-model" />
        </p>
      </Section>

      <Section labelledBy="results-title" tone="white">
        <SectionHeading id="results-title" align="left" size="headline">
          {t('results.title')}
        </SectionHeading>
        <p className="mt-3 text-muted">{t('results.lede')}</p>
        <div className="mt-10">
          <ResultRails result={demo} />
        </div>
      </Section>

      <Section labelledBy="options-title" tone="tile">
        <SectionHeading id="options-title">{t('options.title')}</SectionHeading>
        <Lede>{t('options.lede')}</Lede>
        <div className={cn('mt-14 grid gap-4', options.length > 1 && 'md:grid-cols-2')}>
          {options.map(({ key, option, note }) => {
            const o = option.scenarios;
            const rows = [
              { k: 'plant', v: option.chillerKwc ? `${option.engineKwe} kWe + ${option.chillerKwc} kWc` : `${option.engineKwe} kWe, ${t('options.noChiller')}` },
              { k: 'payback', v: rangeText(o, 'paybackYears') },
              { k: 'fte', v: rangeText(o, 'paybackYearsWithFte') },
              { k: 'capex', v: rangeText(o, 'capexTnd') },
              { k: 'savings', v: rangeText(o, 'annualSavingsTnd') },
              { k: 'co2', v: rangeText(o, 'co2AvoidedTonnes') },
              { k: 'hours', v: num(o.central.fullLoadHours, 0) },
            ];
            return (
              <article key={key} data-option={key} className="rounded-[22px] bg-white p-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[26px] font-semibold tracking-tight">{t(`options.${key}`)}</h3>
                  <Badge variant={verdictTone(option.verdict)}>{tv(verdictTone(option.verdict))}</Badge>
                </div>
                <p className="mt-1 text-muted">{note}</p>
                <dl className="mt-6 divide-y divide-line/70">
                  {rows.map((r) => (
                    <div key={r.k} className="flex justify-between gap-4 py-2.5 text-[15px]">
                      <dt className="text-muted">{t(`options.${r.k}`)}</dt>
                      <dd className="tabular text-right font-semibold">{r.v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-center text-[14px] text-muted">
          {t('options.fte')}
          <Footnote id="fte" />
        </p>
      </Section>

      <Section labelledBy="moves-title">
        <SectionHeading id="moves-title">{t('moves.title')}</SectionHeading>
        <Lede>
          {t('moves.lede', { years: num(SENSITIVITY.centralPaybackYears) })}
          <Footnote id="engine-model" />
        </Lede>
        <div className="mt-14">
          <Tornado />
        </div>
      </Section>

      <Section labelledBy="case-cta-title" tone="white" className="text-center">
        <SectionHeading id="case-cta-title">{t('cta.title')}</SectionHeading>
        <Lede>{t('cta.lede')}</Lede>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
          <Button asChild size="lg">
            <Link href={toolHref()}>{t('cta.primary')}</Link>
          </Button>
          <Button asChild variant="chevron" size="lg">
            <Link href={requestStudyHref(DEMO_INPUT)}>{t('cta.secondary')}</Link>
          </Button>
        </div>
      </Section>
    </main>
  );
}
