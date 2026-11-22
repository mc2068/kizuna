// Virtual site ("digital twin"): the hotel's energy flows hour by hour, today (A) against the plant (B).
// Server side: read the hotel from the URL, run the real engine once, derive every flow (src/lib/twin), and
// hand the 24 finished hours to the client view. The browser only draws; it computes nothing.
//
// Page frame from the design system (Role 3): <PageHero/>, a tile <Section/> holding the white cards, and
// <Footnote/> numbers that link to /sources. cacheComponents is on (next.config.ts): the hero is the static
// shell, and only <TwinForHotel>, which reads the URL query, waits inside <Suspense>.

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { paramsFor, parseToolSearchParams, sizeHotel, toToolSearchParams } from '@/lib/engine';
import { checkDay, twinConstants, twinDay } from '@/lib/twin/flows';
import { PageHero } from '@/components/marketing/PageHero';
import { Section } from '@/components/marketing/Section';
import { Footnote } from '@/components/marketing/Footnote';
import { TwinView } from './twin-view';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('method.twin');
  return { title: t('metaTitle'), description: t('intro') };
}

async function TwinForHotel({ query }: { query: PageProps<'/twin'>['searchParams'] }) {
  // Same query and parser as the sizing tool (/tool?rooms=&city=&pool=&price=), so a result links here as is.
  const input = parseToolSearchParams(await query);
  const result = sizeHotel(input);
  const constants = twinConstants(paramsFor('central'));
  const day = twinDay(result.hourly.summer, constants);
  const issues = checkDay(day, constants);
  // flows.test.ts covers 80 hotels; this only fires if a future engine change breaks the balance.
  if (issues.length > 0) console.error('[twin] energy balance issues', issues);
  const t = await getTranslations('method.twin');

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="tabular text-[15px] text-muted">
          {t('context', {
            rooms: input.rooms,
            city: input.city,
            pool: String(input.pool),
            engineKwe: result.engineKwe,
            chillerKwc: result.chillerKwc,
          })}
        </p>
        <Link href={`/tool${toToolSearchParams(input)}`} className="text-link-chevron text-[15px] text-link hover:underline">
          {t('toolLink')}
        </Link>
      </div>

      <TwinView day={day} />

      <p className="mt-10 border-t border-line pt-6 text-[15px] text-muted">
        {t.rich('honesty', {
          refs: () => (
            <>
              <Footnote id="doe-chp-engines" />
              <Footnote id="doe-absorption-chiller" />
            </>
          ),
        })}{' '}
        <Link href="/sources" className="text-link-chevron text-link hover:underline">
          {t('sources')}
        </Link>
      </p>
    </>
  );
}

export default async function Page({ searchParams }: PageProps<'/twin'>) {
  const t = await getTranslations('method.twin');
  return (
    <main id="main">
      <PageHero eyebrow={t('eyebrow')} title={t('title')} titleSub={t('titleSub')} lede={t('intro')} />
      <Section tone="tile" className="pt-12 md:pt-16" innerClassName="max-w-[1180px]">
        <h2 className="sr-only">{t('sectionLabel')}</h2>
        <Suspense fallback={<div className="h-[560px] rounded-[22px] bg-white" aria-busy="true" />}>
          <TwinForHotel query={searchParams} />
        </Suspense>
      </Section>
    </main>
  );
}
