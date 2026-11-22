'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { siteConfig } from '@/config/site';
import { Logo } from './Logo';
import { isAdminPath } from './nav';

const COLUMNS = [
  {
    key: 'product',
    links: [
      { key: 'nav.howItWorks', href: '/how-it-works' },
      { key: 'nav.tool', href: '/tool' },
      { key: 'nav.services', href: '/services' },
      { key: 'nav.caseStudy', href: '/case-study/djerba' },
    ],
  },
  {
    key: 'company',
    links: [
      { key: 'nav.about', href: '/about' },
      { key: 'nav.requestStudy', href: '/request-study' },
    ],
  },
  {
    key: 'legal',
    links: [
      { key: 'nav.sources', href: '/sources' },
      { key: 'footer.privacy', href: '/privacy' },
    ],
  },
] as const;

/** Site footer (Contract 2). Hidden on /admin. */
export function SiteFooter() {
  const t = useTranslations('common');
  const pathname = usePathname() ?? '/';
  if (isAdminPath(pathname)) return null;

  return (
    <footer data-site-footer className="border-t border-line/70 bg-tile text-[13px] text-muted">
      <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs">{t('footer.tagline')}</p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.key} aria-label={t(`footer.${col.key}`)}>
              <h2 className="mb-3 font-sans text-[13px] font-semibold text-ink">{t(`footer.${col.key}`)}</h2>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-ink hover:underline">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:justify-between">
          <p>{t('footer.disclaimer')}</p>
          <p className="shrink-0">{t('footer.copyright', { name: siteConfig.name })}</p>
        </div>
      </div>
    </footer>
  );
}
