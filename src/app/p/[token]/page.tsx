// /p/<token> (#22): the read-only view of one shared project. Anyone with the link may open it, signed
// in or not. It shows the stored, server-computed results (never recomputed here) and nothing about
// the owner: getSharedProject returns only the name, inputs, results, engine version and date.
// Not indexed, and the link is not passed on as a referrer.
import type { Metadata } from 'next';
import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { HourlyChart } from '@/components/tool/HourlyChart';
import { Results } from '@/components/tool/Results';
import { StoredResultProvider } from '@/components/tool/ToolState';
import { getSharedProject, type SharedProject } from '@/lib/db';
import { ENGINE_VERSION, isStale } from '@/lib/engine';
import { isShareToken } from '@/lib/auth/paths';

const NOINDEX = { index: false, follow: false } as const;

/** One lookup per request, shared by the metadata and the page. */
const load = cache(async (token: string): Promise<SharedProject | null> => (isShareToken(token) ? getSharedProject(token) : null));

export async function generateMetadata({ params }: PageProps<'/p/[token]'>): Promise<Metadata> {
  await connection();
  const { token } = await params;
  const t = await getTranslations('projects.shared');
  const project = await load(token);
  return {
    title: project ? t('metaTitle', { name: project.hotelName }) : undefined,
    description: t('metaDescription'),
    robots: NOINDEX,
    referrer: 'no-referrer',
  };
}


const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Tunis' });

// Rendered per request: the page is small, and it must never be cached with someone's project in it.
export const instant = false;

// src/proxy.ts answers 404 for an unknown token before rendering (a status set here would come too
// late: the page has started streaming); notFound() below is the backstop.
export default async function SharedProjectPage({ params }: PageProps<'/p/[token]'>) {
  await connection();
  const { token } = await params;
  const project = await load(token);
  if (!project) notFound();
  const [t, tTool] = await Promise.all([getTranslations('projects.shared'), getTranslations('tool')]);
  const { inputs } = project;
  const price = inputs.elecPrice == null ? t('tou') : t('flat', { price: inputs.elecPrice });

  return (
    <main id="main" className="mx-auto w-full max-w-[1068px] flex-1 px-4 pt-14 pb-24 sm:px-6">
      <p className="text-[17px] font-semibold text-[var(--muted,#6e6e73)]">{t('eyebrow')}</p>
      <h1 className="mt-2 text-5xl font-semibold break-words sm:text-6xl">{project.hotelName}</h1>
      <p className="mt-4 text-lg text-[var(--muted,#6e6e73)] sm:text-xl">
        {t('summary', { rooms: inputs.rooms, city: tTool(`inputs.city.options.${inputs.city}.name`), pool: String(inputs.pool), price })}
      </p>

      <a
        href={`/api/share/${encodeURIComponent(token)}/report`}
        download
        className="mt-6 inline-block rounded-full border border-[var(--line,#d2d2d7)] px-5 py-3 text-[17px] hover:bg-[var(--tile,#f5f5f7)] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
      >
        {t('pdf')}
      </a>

      <StoredResultProvider inputs={inputs} result={project.results}>
        <section aria-labelledby="results-heading" className="mt-12 border-t border-[var(--line,#d2d2d7)] pt-12">
          <h2 id="results-heading" className="text-4xl font-semibold sm:text-5xl">
            {t('resultsHeading')}
          </h2>
          <Results readOnly />
          <HourlyChart />
        </section>
      </StoredResultProvider>

      <footer className="mt-16 max-w-3xl text-[13px] text-[var(--muted,#6e6e73)]">
        <p>{t('footnote', { date: dateFormat.format(new Date(project.createdAt)), version: project.engineVersion })}</p>
        {isStale(project) ? <p className="mt-1">{t('stale', { current: ENGINE_VERSION })}</p> : null}
        <p className="mt-1">
          <Link href="/sources" className="text-[var(--link,#0066cc)] underline-offset-4 hover:underline">
            {t('method')}
          </Link>
        </p>
      </footer>
    </main>
  );
}
