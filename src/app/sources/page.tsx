// Sources and method (Role 3, #18). Content from src/content/method.ts (Hamza) and the engine's own
// assumptions. Every <Footnote id> on the site lands on an <li id="ref-<id>"> here.
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { limits, references, sensitivity, steps } from '@/content/method';
import { ENGINE_VERSION } from '@/lib/engine';
import { formatNumber } from '@/lib/present';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/marketing/PageHero';
import { referenceAnchor } from '@/components/marketing/references';
import { assumptionStatus, assumptionValue, splitSource } from '@/components/marketing/sources';
import { demoResult } from '@/components/marketing/demo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.sources.meta');
  return { title: t('title'), description: t('description'), openGraph: { title: t('title'), description: t('description') } };
}

const SECTIONS = ['calculate', 'assumptions', 'moves', 'limits', 'references'] as const;

function SectionTitle({ id, children, lede }: { id: string; children: React.ReactNode; lede?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h2 id={`${id}-title`} className="text-headline font-semibold">
        {children}
      </h2>
      {lede ? <p className="mt-3 max-w-[44rem] text-muted">{lede}</p> : null}
    </header>
  );
}

export default async function SourcesPage() {
  const t = await getTranslations('marketing.sources');
  const assumptions = demoResult().assumptions;

  return (
    <main id="main">
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} titleSub={t('hero.titleSub')} lede={t('hero.lede')} align="left" />

      <div className="mx-auto grid max-w-[1100px] gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label={t('toc.label')} className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-3 text-[13px] font-semibold tracking-wide text-muted uppercase">{t('toc.label')}</p>
          <ol className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {SECTIONS.map((s) => (
              <li key={s}>
                <a href={`#${s}`} className="inline-block rounded-full bg-tile px-3 py-1.5 text-[14px] hover:text-link lg:bg-transparent lg:px-0">
                  {t(`toc.${s}`)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-20">
          <section id="calculate" aria-labelledby="calculate-title">
            <SectionTitle id="calculate" lede={t('calculate.lede', { version: ENGINE_VERSION })}>
              {t('calculate.title')}
            </SectionTitle>
            <ol className="grid gap-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-[22px] bg-tile p-5">
                  <span className="tabular grid size-9 shrink-0 place-items-center rounded-full bg-ink text-[15px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[19px] font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="assumptions" aria-labelledby="assumptions-title">
            <SectionTitle id="assumptions" lede={t('assumptions.lede')}>
              {t('assumptions.title')}
            </SectionTitle>
            <div className="overflow-x-auto rounded-[22px] border border-line/70 bg-white" tabIndex={0} role="region" aria-labelledby="assumptions-title">
              <table className="tabular w-full min-w-[640px] border-collapse text-left text-[14px]">
                <caption className="sr-only">{t('assumptions.caption')}</caption>
                <thead className="bg-tile text-[13px] text-muted">
                  <tr>
                    {(['parameter', 'unfavourable', 'central', 'favourable', 'unit', 'status'] as const).map((h) => (
                      <th key={h} scope="col" className="px-4 py-3 font-semibold">
                        {t(`assumptions.${h}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assumptions.map((a) => {
                    const status = assumptionStatus(a);
                    const src = splitSource(a.source);
                    return (
                      <Fragment key={a.name}>
                      <tr className="border-t border-line/70 align-top" data-assumption>
                        <th scope="row" className="px-4 pt-4 pb-1 font-semibold">
                          {a.name}
                        </th>
                        <td className="px-4 pt-4 pb-1 whitespace-nowrap">{assumptionValue(a.unfavourable)}</td>
                        <td className="px-4 pt-4 pb-1 font-semibold whitespace-nowrap">{assumptionValue(a.central)}</td>
                        <td className="px-4 pt-4 pb-1 whitespace-nowrap">{assumptionValue(a.favourable)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted">{a.unit}</td>
                        <td className="px-4 py-3">
                          <Badge variant={status === 'sourced' ? 'good' : 'maybe'}>{t(`assumptions.${status}`)}</Badge>
                        </td>
                      </tr>
                      <tr data-assumption-source>
                        <td colSpan={6} className="px-4 pb-4 text-[13px] text-muted">
                          <span className="font-semibold text-ink">{t('assumptions.source')}: </span>
                          {src.text}
                          {src.urls.map((u, i) => (
                            <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="ml-1 text-link underline-offset-2 hover:underline">
                              {t('assumptions.link')}
                              {src.urls.length > 1 ? ` ${i + 1}` : ''}
                            </a>
                          ))}
                        </td>
                      </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[14px] text-muted">{t('assumptions.statusNote')}</p>
          </section>

          <section id="moves" aria-labelledby="moves-title">
            <SectionTitle id="moves" lede={t('moves.lede', { years: formatNumber(sensitivity.baselineYears) })}>
              {t('moves.title')}
            </SectionTitle>
            <div className="overflow-x-auto rounded-[22px] border border-line/70 bg-white" tabIndex={0} role="region" aria-labelledby="moves-title">
              <table className="tabular w-full min-w-[560px] border-collapse text-left text-[15px]">
                <caption className="sr-only">{t('moves.caption')}</caption>
                <thead className="bg-tile text-[13px] text-muted">
                  <tr>
                    {(['input', 'values', 'unfavourable', 'favourable'] as const).map((h) => (
                      <th key={h} scope="col" className="px-4 py-3 font-semibold">
                        {t(`moves.${h}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.rows.map((r) => (
                    <tr key={r.input} className="border-t border-line/70">
                      <th scope="row" className="px-4 py-3 font-semibold">
                        {r.input}
                      </th>
                      <td className="px-4 py-3 text-muted">{r.values}</td>
                      <td className="px-4 py-3 text-heat-text">{t('moves.years', { value: formatNumber(r.unfavourableYears) })}</td>
                      <td className="px-4 py-3 text-good-text">{t('moves.years', { value: formatNumber(r.favourableYears) })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[14px] text-muted">{sensitivity.note}</p>
          </section>

          <section id="limits" aria-labelledby="limits-title">
            <SectionTitle id="limits" lede={t('limits.lede')}>
              {t('limits.title')}
            </SectionTitle>
            <ul className="grid gap-2 rounded-[22px] border border-maybe/30 bg-maybe-soft p-6">
              {limits.map((l) => (
                <li key={l} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-maybe-text" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </section>

          <section id="references" aria-labelledby="references-title">
            <SectionTitle id="references" lede={t('references.lede')}>
              {t('references.title')}
            </SectionTitle>
            <ol className="tabular grid list-decimal gap-3 pl-6 marker:font-semibold marker:text-muted">
              {references.map((r) => (
                <li key={r.id} id={referenceAnchor(r.id)} className="pl-2 target:rounded-lg target:bg-[#fff6d6]">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-link hover:underline">
                      {r.title}
                    </a>
                  ) : (
                    <span className="font-semibold">{r.title}</span>
                  )}
                  <span className="text-muted">
                    {' '}
                    · {r.publisher}
                    {r.year ? `, ${r.year}` : ''}
                  </span>
                  {r.note ? <span className="block text-[15px] text-muted">{r.note}</span> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
