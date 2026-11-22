// Home (Role 3, #15). Sections follow prototypes/ui/landing.html. Every number comes from the
// engine (sizeHotel) or src/content/method.ts.
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site';
import { demoResult } from '@/components/marketing/demo';
import { Hero } from '@/components/marketing/home/Hero';
import { DemoBand } from '@/components/marketing/home/DemoBand';
import { Flow } from '@/components/marketing/home/Flow';
import { Honesty } from '@/components/marketing/home/Honesty';
import { FinalCta, Proof, ScreenCta, ServicesTeaser, WhatMoves } from '@/components/marketing/home/MoreSections';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.home.meta');
  return {
    title: { absolute: `${siteConfig.name}: ${t('title')}` },
    description: t('description'),
    openGraph: { title: `${siteConfig.name}: ${t('title')}`, description: t('description') },
  };
}

export default function HomePage() {
  const demo = demoResult();
  return (
    <main id="main">
      <Hero demo={demo} />
      <DemoBand demo={demo} />
      <Flow demo={demo} />
      <Honesty />
      <ScreenCta />
      <WhatMoves />
      <ServicesTeaser />
      <Proof />
      <FinalCta />
    </main>
  );
}
