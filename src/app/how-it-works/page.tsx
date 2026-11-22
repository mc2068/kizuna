// How it works (Role 3, #16).
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  CheckIcon, XIcon, LayersIcon, BadgeCheckIcon, BookOpenIcon, MapPinIcon, ReceiptTextIcon, HardHatIcon, FileTextIcon,
} from 'lucide-react';
import { TUNISIA_FACTS as tunisiaFacts, VERDICT_RULES as verdictRules } from '@/components/marketing/content';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/PageHero';
import { Section, SectionHeading, Lede } from '@/components/marketing/Section';
import { EnergyFlow, type FlowLabels } from '@/components/marketing/EnergyFlow';
import { Footnote } from '@/components/marketing/Footnote';
import { Reveal } from '@/components/marketing/Reveal';
import { centralParam } from '@/components/marketing/demo';
import { num } from '@/components/marketing/format';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.howItWorks.meta');
  return { title: t('title'), description: t('description'), openGraph: { title: t('title'), description: t('description') } };
}

export default async function HowItWorksPage() {
  const t = await getTranslations('marketing.howItWorks');
  const elec = Math.round(centralParam('engineElecEff') * 100);
  const heat = Math.round(centralParam('engineThermalEff') * 100);
  const loss = 100 - elec - heat;

  const d = (k: string, v?: Record<string, number>) => t(`diagram.${k}`, v);
  const labels: FlowLabels = {
    label: d('label', { elec, heat, loss }),
    gas: d('gas'), gasSub: d('gasSub'), engine: d('engine'),
    elec: d('elec'), elecSub: d('elecSub', { pct: elec }),
    heat: d('heat'), heatSub: d('heatSub', { pct: heat }),
    hotWater: d('hotWater'), hotWaterSub: d('hotWaterSub'),
    chiller: d('chiller'), chillerSub: d('chillerSub'),
    cold: d('cold'), coldSub: d('coldSub'),
    loss: d('loss'), lossSub: d('lossSub', { pct: loss }),
  };
  const yesItems = t.raw('fit.yesItems') as string[];
  const noItems = t.raw('fit.noItems') as string[];
  const decides = [
    { key: 'scenarios', icon: LayersIcon, values: {} },
    {
      key: 'verdict',
      icon: BadgeCheckIcon,
      values: {
        good: verdictRules.goodMaxYears,
        possible: verdictRules.possibleMaxYears,
        hours: num(verdictRules.minFullLoadHours, 0),
      },
    },
    { key: 'sources', icon: BookOpenIcon, values: {} },
  ] as const;
  const study = [
    { key: 'visit', icon: MapPinIcon },
    { key: 'bills', icon: ReceiptTextIcon },
    { key: 'quote', icon: HardHatIcon },
    { key: 'report', icon: FileTextIcon },
  ] as const;

  return (
    <main id="main">
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} titleSub={t('hero.titleSub')} lede={t('hero.lede')} />

      <Section labelledBy="diagram-title" className="pt-4 md:pt-8">
        <h2 id="diagram-title" className="sr-only">
          {t('diagram.title')}
        </h2>
        <EnergyFlow
          labels={labels}
          pct={{ elec, heat, loss }}
          caption={
            <>
              {t('diagram.caption', { total: elec + heat })}
              <Footnote id="doe-chp-engines" />
              <Footnote id="epa-catalog" />
            </>
          }
        />
      </Section>

      <Section labelledBy="why-title" tone="tile">
        <SectionHeading id="why-title">{t('why.title')}</SectionHeading>
        <Lede>{t('why.lede')}</Lede>
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {tunisiaFacts.map((f, i) => (
            <li key={f.id}>
              <Reveal delay={i * 90} className="h-full">
                <div className="h-full rounded-[22px] bg-white p-6">
                  <p className="tabular font-display text-[48px] leading-none font-semibold tracking-tight">{f.figure}</p>
                  <p className="mt-3 text-muted">
                    {f.label}
                    <Footnote id={f.id} />
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="fit-title">
        <SectionHeading id="fit-title" sub={t('fit.titleSub')}>
          {t('fit.title')}
        </SectionHeading>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {[
            { title: t('fit.yes'), items: yesItems, icon: CheckIcon, tone: 'bg-good-soft text-good-text' },
            { title: t('fit.no'), items: noItems, icon: XIcon, tone: 'bg-weak-soft text-weak-text' },
          ].map((col) => (
            <div key={col.title} className="rounded-[22px] border border-line/70 bg-white p-6 md:p-8">
              <h3 className="text-[24px] font-semibold tracking-tight">{col.title}</h3>
              <ul className="mt-5 grid gap-3">
                {col.items.map((it) => (
                  <li key={it} className="flex gap-3">
                    <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${col.tone}`}>
                      <col.icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section labelledBy="decides-title" tone="tile">
        <SectionHeading id="decides-title">{t('decides.title')}</SectionHeading>
        <Lede>{t('decides.lede')}</Lede>
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {decides.map((c, i) => (
            <li key={c.key}>
              <Reveal delay={i * 90} className="h-full">
                <div className="h-full rounded-[22px] bg-white p-6">
                  <c.icon className="size-7 text-btn" aria-hidden="true" />
                  <h3 className="mt-4 text-[22px] font-semibold tracking-tight">{t(`decides.${c.key}.title`)}</h3>
                  <p className="mt-2 text-muted">
                    {t(`decides.${c.key}.body`, c.values)}
                    {c.key === 'verdict' ? <Footnote id="engine-model" /> : null}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center">
          <Link href="/sources" className="text-link-chevron text-[17px] text-link hover:underline">
            {t('decides.cta')}
          </Link>
        </p>
      </Section>

      <Section labelledBy="study-title">
        <SectionHeading id="study-title">{t('study.title')}</SectionHeading>
        <Lede>{t('study.lede')}</Lede>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {study.map((s, i) => (
            <li key={s.key}>
              <Reveal delay={i * 90} className="h-full">
                <div className="h-full rounded-[22px] border border-line/70 bg-white p-6">
                  <s.icon className="size-7 text-ink" aria-hidden="true" />
                  <h3 className="mt-4 text-[20px] font-semibold tracking-tight">{t(`study.items.${s.key}.title`)}</h3>
                  <p className="mt-2 text-muted">{t(`study.items.${s.key}.body`)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
          <Button asChild size="lg">
            <Link href="/request-study">{t('study.primary')}</Link>
          </Button>
          <Button asChild variant="chevron" size="lg">
            <Link href="/services">{t('study.secondary')}</Link>
          </Button>
        </div>
      </Section>
    </main>
  );
}
