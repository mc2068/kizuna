// TEMPORARY (scaffold #3): a placeholder for pages not built yet. Each owner replaces
// their page.tsx; delete this file once no page uses it.
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ROUTES } from '@/config/routes';

export async function StubPage({ page }: { page: string }) {
  const t = await getTranslations('common');
  const route = ROUTES.find((r) => r.key === page);
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-24">
      <h1 className="text-5xl font-semibold tracking-tight">{t(`pages.${page}`)}</h1>
      <p className="mt-4 text-lg text-neutral-600">{t('stub.owner', { owner: route?.owner ?? '' })}</p>
      <p className="mt-1 text-sm text-neutral-500">{t('stub.note')}</p>
      <nav aria-label={t('stub.allPages')} className="mt-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">{t('stub.allPages')}</h2>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {ROUTES.map((r) => (
            <li key={r.path}>
              <Link className="text-blue-700 hover:underline" href={r.path}>
                {t(`pages.${r.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
