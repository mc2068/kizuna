'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/config/site';
import { Logo } from './Logo';
import { MAIN_NAV, isActive, isAdminPath } from './nav';

export type HeaderUser = { id: string; email: string; role: 'user' | 'admin' } | null;

/** Frosted sticky header (Contract 2). Hidden on /admin, where <AdminShell/> takes over. */
export function SiteHeader({ user }: { user: HeaderUser }) {
  const t = useTranslations('common');
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isAdminPath(pathname)) return null;

  const account = user
    ? { href: '/projects', label: t('nav.myProjects') }
    : { href: '/sign-in', label: t('nav.signIn') };

  return (
    <header
      data-site-header
      className={cn(
        'frosted sticky top-0 z-50 border-b transition-colors',
        scrolled ? 'border-line/80' : 'border-transparent',
      )}
    >
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-4"
      >
        {t('skipToContent')}
      </a>
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label={t('home', { name: siteConfig.name })} className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label={t('nav.label')} className="hidden items-center gap-1 lg:flex">
          {MAIN_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[14px] transition-colors hover:text-ink',
                  active ? 'font-medium text-ink' : 'text-muted',
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
          <Link
            href={account.href}
            className={cn(
              'rounded-full px-3 py-1.5 text-[14px] transition-colors hover:text-ink',
              isActive(pathname, account.href) ? 'font-medium text-ink' : 'text-muted',
            )}
          >
            {account.label}
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className="rounded-full px-3 py-1.5 text-[14px] text-muted transition-colors hover:text-ink">
              {t('nav.admin')}
            </Link>
          )}
          <Button asChild size="xs" className="ml-2 h-8 px-4 text-[14px]">
            <Link href="/tool">{t('nav.cta')}</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild size="xs" className="h-8 px-3.5 text-[14px] max-[419px]:hidden">
            <Link href="/tool">{t('nav.cta')}</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('nav.openMenu')}>
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,360px)] bg-bg p-0">
              <SheetHeader className="border-b border-line/70 px-6 py-4">
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
                <SheetDescription className="sr-only">{t('nav.menuTitle')}</SheetDescription>
              </SheetHeader>
              <nav aria-label={t('nav.label')} className="flex flex-col px-3 py-3">
                {[...MAIN_NAV, { key: 'sources' as const, href: '/sources' }].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                    className="rounded-xl px-3 py-3 font-display text-[22px] font-semibold tracking-tight text-ink hover:bg-tile aria-[current=page]:text-btn"
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                ))}
                <div className="my-2 border-t border-line/70" />
                <Link
                  href={account.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-[17px] text-ink hover:bg-tile"
                >
                  {account.label}
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-[17px] text-ink hover:bg-tile">
                    {t('nav.admin')}
                  </Link>
                )}
                <Button asChild className="mx-3 mt-4">
                  <Link href="/tool" onClick={() => setOpen(false)}>
                    {t('nav.cta')}
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="mx-3 mt-3">
                  <Link href="/request-study" onClick={() => setOpen(false)}>
                    {t('nav.requestStudy')}
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
