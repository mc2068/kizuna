import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '../Eyebrow';
import { Footnote } from '../Footnote';
import { Rings } from '../Rings';
import { coverage } from '../coverage';
import { DEMO_INPUT, toolHref } from '../demo';
import type { SizingResult } from '@/lib/engine';

export async function Hero({ demo }: { demo: SizingResult }) {
  const t = await getTranslations('marketing.home.hero');
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden px-4 pt-16 pb-20 sm:px-6 md:pt-24 md:pb-28">
      <div className="mx-auto max-w-[1100px] text-center">
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <h1 id="hero-title" className="text-hero font-semibold">
          {t('title')}
          <span className="block text-faint">{t('titleSub')}</span>
        </h1>
        <p className="mx-auto mt-8 max-w-[40rem] text-lede text-muted">{t('lede')}</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
          <Button asChild size="lg">
            <Link href={toolHref()}>{t('ctaPrimary')}</Link>
          </Button>
          <Button asChild variant="chevron" size="lg">
            <Link href="/how-it-works">{t('ctaSecondary')}</Link>
          </Button>
        </div>
        <div className="mt-16 grid items-center gap-8 md:mt-20 md:grid-cols-[1fr_auto_1fr]">
          <p className="order-2 mx-auto max-w-[16rem] text-[15px] text-muted md:order-1 md:mr-0 md:text-right">
            {t('ringsCaption', { kwe: demo.engineKwe, rooms: DEMO_INPUT.rooms })}
            <Footnote id="engine-model" />
          </p>
          <Rings {...coverage(demo)} size={320} stroke={32} className="order-1 md:order-2 md:col-span-2 md:justify-self-start" />
        </div>
      </div>
    </section>
  );
}
