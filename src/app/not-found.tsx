import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('common.notFound');
  return (
    <main id="main" className="mx-auto flex min-h-[60vh] max-w-[780px] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="tabular font-display text-[15px] font-semibold text-muted">404</p>
      <h1 className="mt-2 text-display font-semibold">{t('title')}</h1>
      <p className="mt-4 text-lede text-muted">{t('body')}</p>
      <Link href="/" className="text-link-chevron mt-8 text-link hover:underline">
        {t('home')}
      </Link>
    </main>
  );
}
