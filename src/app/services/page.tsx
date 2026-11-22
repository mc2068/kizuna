// Services and pricing (Role 3, #16). Prices are "on request"; shared savings is "coming soon".
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageHero } from '@/components/marketing/PageHero';
import { Section, SectionHeading, Lede } from '@/components/marketing/Section';
import { Footnote } from '@/components/marketing/Footnote';
import { Reveal } from '@/components/marketing/Reveal';
import { toolHref } from '@/components/marketing/demo';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.services.meta');
  return { title: t('title'), description: t('description'), openGraph: { title: t('title'), description: t('description') } };
}

const OFFERS = [
  { key: 'study', href: '/request-study', live: true, featured: true },
  { key: 'referral', href: '/request-study', live: true, featured: false },
  { key: 'esco', href: '/request-study', live: false, featured: false },
] as const;
const STEPS = ['screen', 'study', 'quote', 'install'] as const;
const FAQ = ['cost', 'accuracy', 'fte', 'blackout', 'noGas', 'install'] as const;

export default async function ServicesPage() {
  const t = await getTranslations('marketing.services');

  return (
    <main id="main">
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} titleSub={t('hero.titleSub')} lede={t('hero.lede')} />

      <Section labelledBy="offers-title" className="pt-4 md:pt-8">
        <h2 id="offers-title" className="sr-only">
          {t('hero.eyebrow')}
        </h2>
        <ul className="grid gap-4 lg:grid-cols-3">
          {OFFERS.map((o, i) => (
            <li key={o.key}>
              <Reveal delay={i * 90} className="h-full">
                <article
                  data-offer={o.key}
                  className={cn(
                    'flex h-full flex-col rounded-[28px] p-7 md:p-8',
                    o.featured ? 'bg-ink text-white' : 'border border-line/70 bg-white',
                  )}
                >
                  <p className={cn('text-[13px] font-semibold tracking-wide uppercase', o.featured ? 'text-dark-muted' : 'text-muted')}>
                    {t(`offers.${o.key}.tag`)}
                  </p>
                  <h3 className="mt-2 text-[30px] font-semibold tracking-tight">{t(`offers.${o.key}.title`)}</h3>
                  <p className={cn('mt-3', o.featured ? 'text-dark-muted' : 'text-muted')}>{t(`offers.${o.key}.body`)}</p>
                  <ul className="mt-6 grid gap-2.5">
                    {(t.raw(`offers.${o.key}.items`) as string[]).map((it) => (
                      <li key={it} className="flex gap-2.5 text-[15px]">
                        <CheckIcon className={cn('mt-1 size-4 shrink-0', o.featured ? 'text-elec' : 'text-good-text')} aria-hidden="true" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-8">
                    {o.live ? (
                      <p className="font-display text-[22px] font-semibold tracking-tight">{t('offers.price')}</p>
                    ) : (
                      <Badge variant="soon">{t('offers.soon')}</Badge>
                    )}
                    <Button asChild variant={o.featured ? 'default' : 'outline'} className="mt-5 w-full">
                      <Link href={o.href}>{t(`offers.${o.key}.cta`)}</Link>
                    </Button>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="process-title" tone="tile">
        <SectionHeading id="process-title" sub={t('process.titleSub')}>
          {t('process.title')}
        </SectionHeading>
        <ol className="mt-14 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s}>
              <Reveal delay={i * 90} className="h-full">
                <div className="h-full rounded-[22px] bg-white p-6">
                  <span className="tabular grid size-9 place-items-center rounded-full bg-ink text-[15px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-[20px] font-semibold tracking-tight">{t(`process.steps.${s}.title`)}</h3>
                  <p className="mt-2 text-muted">{t(`process.steps.${s}.body`)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="faq-title" width="narrow">
        <SectionHeading id="faq-title">{t('faq.title')}</SectionHeading>
        <Accordion type="single" collapsible className="mt-10">
          {FAQ.map((q) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="py-5 text-left text-[19px] font-semibold">{t(`faq.items.${q}.q`)}</AccordionTrigger>
              <AccordionContent className="pb-5 text-[17px] text-muted">
                {t(`faq.items.${q}.a`)}
                {q === 'fte' ? <Footnote id="fte" /> : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section labelledBy="services-cta-title" tone="white" className="text-center">
        <SectionHeading id="services-cta-title">{t('cta.title')}</SectionHeading>
        <Lede>{t('cta.lede')}</Lede>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
          <Button asChild size="lg">
            <Link href={toolHref()}>{t('cta.primary')}</Link>
          </Button>
          <Button asChild variant="chevron" size="lg">
            <Link href="/request-study">{t('cta.secondary')}</Link>
          </Button>
        </div>
      </Section>
    </main>
  );
}
