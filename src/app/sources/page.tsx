// Sources and method (Role 3, #18). Content from src/content/method.ts (Hamza): METHOD_STEPS,
// ASSUMPTIONS, SENSITIVITY, LIMITS and REFERENCES, plus the marketing references (Role 3).
// Every <Footnote id> on the site lands on an <li id="ref-<id>"> here.
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ASSUMPTIONS, LIMITS, METHOD_STEPS, SENSITIVITY } from '@/content/method';
import { ENGINE_VERSION } from '@/lib/engine';
import { Badge } from '@/components/ui/badge';
import { PageHero } from '@/components/marketing/PageHero';
import { ALL_REFERENCES, referenceAnchor, referenceNumber } from '@/components/marketing/references';
import { assumptionValue, splitSource, STATUS_BADGE } from '@/components/marketing/sources';
import { num } from '@/components/marketing/format';

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
            <SectionTitle id="calculate" lede={t('calculate.lede', { version: ENGINE_VERSION, count: METHOD_STEPS.length })}>
              {t('calculate.title')}
            </SectionTitle>
            <ol className="grid gap-4">
              {METHOD_STEPS.map((s, i) => (
                <li key={s.id} className="flex gap-4 rounded-[22px] bg-tile p-5">
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
                  {ASSUMPTIONS.map((a) => {
                    const src = splitSource(a.source);
                    const urls = a.urls.length ? a.urls : src.urls;
                    return (
                      <Fragment key={a.id}>
                        <tr className="border-t border-line/70 align-top" data-assumption={a.id}>
                          <th scope="row" className="px-4 pt-4 pb-1 font-semibold">
                            {a.label}
                          </th>
                          <td className="px-4 pt-4 pb-1 whitespace-nowrap">{assumptionValue(a.unfavourable)}</td>
                          <td className="px-4 pt-4 pb-1 font-semibold whitespace-nowrap">{assumptionValue(a.central)}</td>
                          <td className="px-4 pt-4 pb-1 whitespace-nowrap">{assumptionValue(a.favourable)}</td>
                          <td className="px-4 pt-4 pb-1 whitespace-nowrap text-muted">{a.unit}</td>
                          <td className="px-4 pt-4 pb-1">
                            <Badge variant={STATUS_BADGE[a.status]}>{t(`assumptions.${a.status}`)}</Badge>
                          </td>
                        </tr>
                        <tr data-assumption-source>
                          <td colSpan={6} className="px-4 pb-4 text-[13px] text-muted">
                            <span className="font-semibold text-ink">{t('assumptions.source')}: </span>
                            {src.text}
                            {urls.map((u, i) => (
                              <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="ml-1 text-link underline underline-offset-2">
                                {t('assumptions.link')}
                                {urls.length > 1 ? ` ${i + 1}` : ''}
                              </a>
                            ))}
                            {a.refs.map((id) => (
                              <a key={id} href={`#${referenceAnchor(id)}`} className="ml-1 text-link underline underline-offset-2">
                                {t('references.cite', { n: referenceNumber(id) })}
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
            <SectionTitle id="moves" lede={t('moves.lede', { years: num(SENSITIVITY.centralPaybackYears) })}>
              {t('moves.title')}
            </SectionTitle>
            <div className="overflow-x-auto rounded-[22px] border border-line/70 bg-white" tabIndex={0} role="region" aria-labelledby="moves-title">
              <table className="tabular w-full min-w-[560px] border-collapse text-left text-[15px]">
                <caption className="sr-only">{t('moves.caption')}</caption>
                <thead className="bg-tile text-[13px] text-muted">
                  <tr>
                    {(['input', 'unfavourable', 'favourable', 'impact'] as const).map((h) => (
                      <th key={h} scope="col" className="px-4 py-3 font-semibold">
                        {t(`moves.${h}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SENSITIVITY.rows.map((r) => (
                    <tr key={r.id} className="border-t border-line/70" data-sensitivity={r.id}>
                      <th scope="row" className="px-4 py-3 font-semibold">
                        {r.label}
                      </th>
                      <td className="px-4 py-3 text-heat-text">{t('moves.years', { value: num(r.unfavourablePaybackYears) })}</td>
                      <td className="px-4 py-3 text-good-text">{t('moves.years', { value: num(r.favourablePaybackYears) })}</td>
                      <td className="px-4 py-3">{t('moves.years', { value: num(r.impactYears) })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="limits" aria-labelledby="limits-title">
            <SectionTitle id="limits" lede={t('limits.lede')}>
              {t('limits.title')}
            </SectionTitle>
            <ul className="grid gap-3 rounded-[22px] border border-maybe/30 bg-maybe-soft p-6">
              {LIMITS.map((l) => (
                <li key={l.id} className="flex gap-3" data-limit={l.id}>
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-maybe-text" />
                  <span>
                    {t.rich('limits.item', { title: l.title, detail: l.detail, b: (chunks) => <span className="font-semibold">{chunks}</span> })}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section id="references" aria-labelledby="references-title">
            <SectionTitle id="references" lede={t('references.lede')}>
              {t('references.title')}
            </SectionTitle>
            <ol className="tabular grid list-decimal gap-3 pl-6 marker:font-semibold marker:text-muted">
              {ALL_REFERENCES.map((r) => (
                <li key={r.id} id={referenceAnchor(r.id)} className="pl-2 target:rounded-lg target:bg-[#fff6d6]">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-link hover:underline">
                    {r.title}
                  </a>
                  <span className="text-muted">
                    {' '}
                    · {r.publisher} · {t('references.accessed', { date: r.accessed })}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}
