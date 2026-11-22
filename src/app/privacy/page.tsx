// Privacy (Role 3, #18). Draft pending legal review; copy in messages/en/privacy.json.
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site';
import { PageHero } from '@/components/marketing/PageHero';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy.meta');
  const description = t('description', { name: siteConfig.name });
  return { title: t('title'), description, openGraph: { title: t('title'), description } };
}

/** Date of the last change to this notice. Update it with every content change. */
const LAST_UPDATED = new Date('2026-11-22T00:00:00Z');

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line pt-8">
      <h2 id={`${id}-title`} className="text-[28px] font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[17px]">{children}</div>
    </section>
  );
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
  const s = (k: string, v?: Record<string, string>) => t(`sections.${k}`, v);
  const email = siteConfig.contactEmail;
  const tbc = t('toBeConfirmed');
  const mail = <a href={`mailto:${email}`} className="text-link hover:underline">{email}</a>;

  return (
    <main id="main">
      <PageHero eyebrow={t('hero.eyebrow')} title={t('hero.title')} titleSub={t('hero.titleSub')} lede={t('hero.lede')} align="left" />

      <div className="mx-auto max-w-[780px] space-y-12 px-4 pb-24 sm:px-6">
        <aside role="note" data-privacy-draft className="rounded-[22px] border border-maybe/30 bg-maybe-soft p-6">
          <p className="font-semibold text-maybe-text">{t('draft.title')}</p>
          <p className="mt-1">{t('draft.body')}</p>
          <p className="mt-3 text-[14px] text-muted">{t('updated', { date: new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(LAST_UPDATED) })}</p>
        </aside>

        <Block id="controller" title={s('controller.title')}>
          <p>{t.rich('sections.controller.body', { name: siteConfig.name, email: () => mail })}</p>
        </Block>

        <Block id="collected" title={s('collected.title')}>
          <p className="text-muted">{s('collected.lede')}</p>
          <dl className="grid gap-4">
            {(['signIn', 'projects', 'requests', 'analytics'] as const).map((k) => (
              <div key={k} data-collected={k} className="rounded-[18px] bg-tile p-5">
                <dt className="font-semibold">{s(`collected.items.${k}.title`)}</dt>
                <dd className="mt-1 text-muted">{s(`collected.items.${k}.body`)}</dd>
              </div>
            ))}
          </dl>
          <p>{s('collected.noTool')}</p>
        </Block>

        <Block id="purposes" title={s('purposes.title')}>
          <ul className="list-disc space-y-1 pl-6">
            {(t.raw('sections.purposes.items') as string[]).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="font-semibold">{s('purposes.never')}</p>
        </Block>

        <Block id="basis" title={s('basis.title')}>
          <p>{s('basis.body')}</p>
        </Block>

        <Block id="retention" title={s('retention.title')}>
          <ul className="list-disc space-y-1 pl-6">
            {(['account', 'requests', 'analytics'] as const).map((k) => (
              <li key={k} data-retention={k}>
                {t(`sections.retention.items.${k}`, { period: tbc })}
              </li>
            ))}
          </ul>
        </Block>

        <Block id="processors" title={s('processors.title')}>
          <p className="text-muted">{s('processors.lede')}</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {(['supabase', 'resend', 'vercel'] as const).map((k) => (
              <li key={k} data-processor={k} className="rounded-[18px] border border-line/70 bg-white p-5">
                <p className="font-semibold">{s(`processors.items.${k}.name`)}</p>
                <p className="mt-1 text-[15px] text-muted">{s(`processors.items.${k}.role`)}</p>
              </li>
            ))}
          </ul>
          <p>{s('processors.transfer')}</p>
        </Block>

        <Block id="rights" title={s('rights.title')}>
          <p>{t.rich('sections.rights.body', { email: () => mail })}</p>
          <ul className="flex flex-wrap gap-2">
            {(t.raw('sections.rights.items') as string[]).map((r) => (
              <li key={r} className="rounded-full bg-tile px-3 py-1 text-[15px]">
                {r}
              </li>
            ))}
          </ul>
        </Block>

        <Block id="changes" title={s('changes.title')}>
          <p>{s('changes.body')}</p>
        </Block>
      </div>
    </main>
  );
}
