import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SENSITIVITY } from '@/content/method';
import { PROOF as proof } from '../content';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Section, SectionHeading, Lede } from '../Section';
import { Footnote } from '../Footnote';
import { Reveal } from '../Reveal';
import { Tornado } from '../Tornado';
import { requestStudyHref, toolHref } from '../demo';
import { num } from '../format';

/** "Screen your hotel": a CTA card until Ahmed's compact configurator (#9) can be embedded here. */
export async function ScreenCta() {
  const t = await getTranslations('marketing.home.screen');
  return (
    <Section id="screen" labelledBy="screen-title" tone="tile">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <SectionHeading id="screen-title" align="left">
            {t('title')}
          </SectionHeading>
          <Lede align="left">{t('lede')}</Lede>
        </div>
        <div className="rounded-[28px] bg-white p-8 md:p-10">
          <p className="text-[21px] font-semibold tracking-tight">{t('card')}</p>
          <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
            <Link href={toolHref()}>{t('cta')}</Link>
          </Button>
          <p className="mt-4 text-[14px] text-muted">{t('free')}</p>
        </div>
      </div>
    </Section>
  );
}

export async function WhatMoves() {
  const t = await getTranslations('marketing.home.tornado');
  return (
    <Section labelledBy="tornado-title">
      <SectionHeading id="tornado-title">{t('title')}</SectionHeading>
      <Lede>
        {t('lede', { years: num(SENSITIVITY.centralPaybackYears) })}
        <Footnote id="engine-model" />
      </Lede>
      <Reveal className="mt-14">
        <Tornado />
      </Reveal>
      <blockquote className="mx-auto mt-14 max-w-[40rem] text-center text-headline font-semibold">{t('quote')}</blockquote>
    </Section>
  );
}

export async function ServicesTeaser() {
  const t = await getTranslations('marketing.home.services');
  const cards = [
    { key: 'study', badge: t('price'), variant: 'secondary' as const },
    { key: 'referral', badge: t('price'), variant: 'secondary' as const },
    { key: 'esco', badge: t('soon'), variant: 'soon' as const },
  ];
  return (
    <Section labelledBy="services-title" tone="tile">
      <SectionHeading id="services-title">{t('title')}</SectionHeading>
      <Lede>{t('lede')}</Lede>
      <ul className="mt-14 grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <li key={c.key}>
            <Reveal delay={i * 90} className="h-full">
              <article className="flex h-full flex-col rounded-[22px] bg-white p-6">
                <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">{t(`${c.key}.tag`)}</p>
                <h3 className="mt-2 text-[24px] font-semibold tracking-tight">{t(`${c.key}.title`)}</h3>
                <p className="mt-2 text-muted">{t(`${c.key}.body`)}</p>
                <Badge variant={c.variant} className="mt-auto translate-y-0 pt-0.5">
                  {c.badge}
                </Badge>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-center">
        <Link href="/services" className="text-link-chevron text-[17px] text-link hover:underline">
          {t('cta')}
        </Link>
      </p>
    </Section>
  );
}

export async function Proof() {
  const t = await getTranslations('marketing.home.proof');
  return (
    <Section labelledBy="proof-title">
      <SectionHeading id="proof-title" sub={t('lede')}>
        {t('title')}
      </SectionHeading>
      <ul className="mt-14 grid gap-10 md:grid-cols-3">
        {proof.map((p, i) => (
          <li key={p.id}>
            <Reveal delay={i * 90}>
              <p className="tabular font-display text-[56px] leading-none font-semibold tracking-tight">{p.figure}</p>
              <h3 className="mt-3 font-sans text-[17px] font-semibold">{p.name}</h3>
              <p className="mt-1 text-muted">
                {p.body}
                <Footnote id={p.id} />
              </p>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export async function FinalCta() {
  const t = await getTranslations('marketing.home.final');
  return (
    <Section labelledBy="final-title" tone="white" className="text-center">
      <SectionHeading id="final-title" size="hero" sub={t('titleSub')}>
        {t('title')}
      </SectionHeading>
      <Lede>{t('lede')}</Lede>
      <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
        <Button asChild size="lg">
          <Link href={requestStudyHref()}>{t('primary')}</Link>
        </Button>
        <Button asChild variant="chevron" size="lg">
          <Link href="/tool">{t('secondary')}</Link>
        </Button>
      </div>
    </Section>
  );
}
