import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/** Placeholder for a route another member is building (part of the #3 scaffold). */
export async function PageStub({ page, owner }: { page: string; owner: string }) {
  const t = await getTranslations('common.stub');
  return (
    <main id="main" className="mx-auto flex min-h-[60vh] max-w-[780px] flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-display font-semibold">{t('title', { page })}</h1>
      <p className="mt-4 text-lede text-muted">{t('body', { owner })}</p>
      <Link href="/" className="text-link-chevron mt-8 text-link hover:underline">
        {t('back')}
      </Link>
    </main>
  );
}
