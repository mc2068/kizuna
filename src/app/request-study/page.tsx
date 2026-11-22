// Request a study (Role 3, #20). The backend (submitStudyRequest, Resend emails) is Mohamed's #19.
import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CheckIcon } from 'lucide-react';
import { sizeHotel } from '@/lib/engine';
import { verdictTone } from '@/lib/present';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/marketing/PageHero';
import { StudyRequestForm } from '@/components/marketing/StudyRequestForm';
import { prefillFrom, screeningInput } from '@/components/marketing/study-request';
import { toolHref } from '@/components/marketing/demo';
import { requestStudy } from './actions';
import { rangeText, num } from '@/components/marketing/format';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('forms.requestStudy.meta');
  return { title: t('title'), description: t('description'), openGraph: { title: t('title'), description: t('description') } };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RequestStudyPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations('forms.requestStudy');
  return (
    <main id="main">
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} titleSub={t('hero.titleSub')} lede={t('hero.lede')} align="left" />
      {/* The prefill reads the URL, so this part renders per request (cacheComponents). */}
      <Suspense fallback={<div className="min-h-[70vh] bg-tile" />}>
        <StudyBlock searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** The screening summary (when the link carries a hotel), what the study covers, and the form. */
async function StudyBlock({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations('forms.requestStudy');
  const tv = await getTranslations('common.verdict');
  const tc = await getTranslations('common.cities');
  const prefill = prefillFrom(await searchParams);
  const input = screeningInput(prefill);
  const result = input ? sizeHotel(input) : null;

  return (
      <div className="bg-tile px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto grid max-w-[1100px] gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          <aside className="grid gap-6 lg:sticky lg:top-20">
            {input && result ? (
              <section aria-labelledby="summary-title" data-screening-summary className="rounded-[22px] bg-white p-6">
                <h2 id="summary-title" className="text-[13px] font-semibold tracking-wide text-muted uppercase">
                  {t('summary.title')}
                </h2>
                <Badge variant={verdictTone(result.verdict)} className="mt-3 text-[15px]">
                  {tv(verdictTone(result.verdict))}
                </Badge>
                <p className="tabular mt-3 text-[15px] text-muted">
                  {t('summary.hotel', { rooms: input.rooms, city: tc(input.city), pool: input.pool ? 'yes' : 'no' })}
                </p>
                <p className="tabular mt-1 font-semibold">
                  {t('summary.plant', { kwe: result.engineKwe, chiller: result.chillerKwc ? String(result.chillerKwc) : 'none' })}
                </p>
                <p className="tabular text-[15px]">
                  {t('summary.payback', {
                    range: rangeText(result.scenarios, 'paybackYears'),
                    central: num(result.scenarios.central.paybackYears),
                  })}
                </p>
                <Link href={toolHref(input)} className="text-link-chevron mt-4 inline-block text-[15px] text-link hover:underline">
                  {t('summary.edit')}
                </Link>
              </section>
            ) : null}

            <section aria-labelledby="covers-title" className="rounded-[22px] bg-white p-6">
              <h2 id="covers-title" className="text-[22px] font-semibold tracking-tight">
                {t('about.title')}
              </h2>
              <ul className="mt-4 grid gap-3">
                {(['visit', 'bills', 'quotes', 'report'] as const).map((k) => (
                  <li key={k} className="flex gap-3">
                    <CheckIcon className="mt-1 size-4 shrink-0 text-good-text" aria-hidden="true" />
                    <span>{t(`about.items.${k}`)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line pt-5">
                <p className="font-display text-[22px] font-semibold tracking-tight">{t('about.price')}</p>
                <p className="text-[15px] text-muted">{t('about.priceNote')}</p>
              </div>
              <div className="mt-5">
                <p className="font-semibold">{t('about.timeline')}</p>
                <p className="text-[15px] text-muted">{t('about.timelineBody')}</p>
              </div>
            </section>
          </aside>

          <StudyRequestForm action={requestStudy} prefill={prefill} />
        </div>
      </div>
  );
}
