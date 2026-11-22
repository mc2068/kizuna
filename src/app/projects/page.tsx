// My projects (#22): the signed-in visitor's saved projects, newest first. The layout sends signed-out
// visitors to sign-in; the data layer (and Supabase RLS) only ever returns the visitor's own rows.
import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { ProjectCard, type ProjectCardView } from '@/components/projects/ProjectCard';
import { toSearchString } from '@/components/tool/url-state';
import { getMyProjects, type Project } from '@/lib/db';
import { isStale } from '@/lib/engine';
import { formatRange, verdictTone } from '@/lib/present';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('projects.meta');
  return { title: t('title'), description: t('description'), robots: { index: false, follow: false } };
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Tunis' });

export default async function ProjectsPage() {
  // The Supabase session read uses Date.now(): mark the render as per request first.
  await connection();
  const [t, tTool, projects] = await Promise.all([getTranslations('projects'), getTranslations('tool'), getMyProjects()]);

  const view = (p: Project): ProjectCardView => {
    const tone = verdictTone(p.results.verdict);
    const payback = formatRange(p.results, 'paybackYears');
    return {
      id: p.id,
      hotelName: p.hotelName,
      summary: t('card.summary', { rooms: p.inputs.rooms, city: tTool(`inputs.city.options.${p.inputs.city}.name`), pool: String(p.inputs.pool) }),
      tone,
      verdict: tTool(`verdict.${tone}`),
      payback: payback.central,
      paybackRange: t('card.range', { favourable: payback.favourable, unfavourable: payback.unfavourable }),
      updated: t('card.updated', { date: dateFormat.format(new Date(p.updatedAt)) }),
      stale: isStale(p),
      engineVersion: p.engineVersion,
      toolHref: `/tool${toSearchString(p.inputs)}`,
      sharePath: `/p/${p.shareToken}`,
    };
  };

  return (
    <main id="main" className="mx-auto w-full max-w-[1068px] flex-1 px-4 pt-14 pb-24 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-5xl font-semibold sm:text-6xl">{t('list.title')}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--muted,#6e6e73)] sm:text-xl">{t('list.intro')}</p>
        </div>
        {projects.length > 0 ? (
          <Link
            href="/tool"
            className="self-start rounded-full bg-[var(--btn,#0071e3)] px-5 py-3 text-[17px] whitespace-nowrap text-white hover:bg-[#0077ed] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)] sm:self-auto"
          >
            {t('list.new')}
          </Link>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <section aria-labelledby="empty-heading" className="mt-12 rounded-[28px] bg-[var(--tile,#f5f5f7)] px-6 py-12 text-center sm:px-10">
          <h2 id="empty-heading" className="text-3xl font-semibold">
            {t('list.empty.title')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[17px] text-[var(--muted,#6e6e73)]">{t('list.empty.body')}</p>
          <Link
            href="/tool"
            className="mt-6 inline-block rounded-full bg-[var(--btn,#0071e3)] px-5 py-3 text-[17px] text-white hover:bg-[#0077ed] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
          >
            {t('list.empty.button')}
          </Link>
        </section>
      ) : (
        <>
          <p className="mt-10 text-[15px] text-[var(--muted,#6e6e73)]">{t('list.count', { count: projects.length })}</p>
          <ul className="mt-4 grid gap-5 md:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id} className="flex">
                <div className="flex w-full flex-col [&>article]:flex-1">
                  <ProjectCard project={view(p)} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
