// About (Role 3, #17): mission and the team (initials until photos arrive in public/team/).
import type { Metadata } from 'next';
import Link from 'next/link';
import { existsSync } from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { PageHero } from '@/components/marketing/PageHero';
import { Section, SectionHeading, Lede } from '@/components/marketing/Section';
import { Reveal } from '@/components/marketing/Reveal';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.about.meta');
  return { title: t('title'), description: t('description'), openGraph: { title: t('title'), description: t('description') } };
}

const TEAM = [
  { id: 'mohamed', color: 'bg-status-quoted' },
  { id: 'hamza', color: 'bg-heat-text' },
  { id: 'ahmed', color: 'bg-status-new' },
  { id: 'gaith', color: 'bg-elec-text' },
] as const;
const BELIEFS = ['honest', 'ranges', 'independent'] as const;

/** A photo at public/team/<id>.jpg replaces the initials automatically. */
function photoFor(id: string): string | null {
  return existsSync(path.join(process.cwd(), 'public', 'team', `${id}.jpg`)) ? `/team/${id}.jpg` : null;
}

export default async function AboutPage() {
  const t = await getTranslations('marketing.about');
  return (
    <main id="main">
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} titleSub={t('hero.titleSub')} lede={t('hero.lede')} />

      <Section labelledBy="mission-title" tone="tile">
        <SectionHeading id="mission-title">{t('mission.title')}</SectionHeading>
        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {BELIEFS.map((b, i) => (
            <li key={b}>
              <Reveal delay={i * 90} className="h-full">
                <div className="h-full rounded-[22px] bg-white p-6">
                  <h3 className="text-[22px] font-semibold tracking-tight">{t(`mission.items.${b}.title`)}</h3>
                  <p className="mt-2 text-muted">{t(`mission.items.${b}.body`)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="team-title">
        <SectionHeading id="team-title" sub={t('team.lede')}>
          {t('team.title')}
        </SectionHeading>
        <ul className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {TEAM.map((m, i) => {
            const name = t(`team.members.${m.id}.name`);
            const photo = photoFor(m.id);
            return (
              <li key={m.id} data-member={m.id}>
                <Reveal delay={i * 90} className="h-full">
                  <div className="flex h-full flex-col items-center rounded-[22px] border border-line/70 bg-white p-6 text-center">
                    {photo ? (
                      <Image src={photo} alt={t('team.photo', { name })} width={112} height={112} className="size-28 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden="true" className={`grid size-28 place-items-center rounded-full font-display text-[36px] font-semibold text-white ${m.color}`}>
                        {name.slice(0, 1)}
                      </span>
                    )}
                    <h3 className="mt-5 text-[21px] font-semibold tracking-tight">{name}</h3>
                    <p className="mt-1 text-[15px] text-muted">{t(`team.members.${m.id}.role`)}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section labelledBy="contact-title" tone="white" className="text-center">
        <SectionHeading id="contact-title">{t('contact.title')}</SectionHeading>
        <Lede>{t('contact.lede')}</Lede>
        <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
          <Button asChild size="lg">
            <Link href="/request-study">{t('contact.primary')}</Link>
          </Button>
          <Button asChild variant="chevron" size="lg">
            <a href={`mailto:${siteConfig.contactEmail}`}>{t('contact.email', { email: siteConfig.contactEmail })}</a>
          </Button>
        </div>
      </Section>
    </main>
  );
}
