import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/** Shown to a signed-in user who is not on the team. No lead data is loaded for them. */
export async function AdminsOnly() {
  const t = await getTranslations('lead.denied');
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-3 text-[#6b6f72]">{t('body')}</p>
      <Link href="/" className="mt-8 inline-flex h-10 items-center rounded-full bg-[#17191a] px-5 text-sm font-medium text-white hover:bg-[#2b2e30]">
        {t('back')}
      </Link>
    </main>
  );
}
