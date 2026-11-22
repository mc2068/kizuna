'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, LayoutGridIcon, UserRoundCheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LogoMark } from './Logo';

export type AdminShellUser = { id: string; name: string };

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Admin frame after the admin prototype: a dark rail (Pipeline, Assigned to me) and a top bar.
 *  On phones the rail becomes a bar across the top. */
export function AdminShell({ user, children }: { user: AdminShellUser; children: React.ReactNode }) {
  const t = useTranslations('common.admin');
  const tc = useTranslations('common');
  const pathname = usePathname() ?? '/admin';
  const params = useSearchParams();
  const mine = params?.get('mine') === '1';
  const items = [
    { href: '/admin', label: t('pipeline'), icon: LayoutGridIcon, active: pathname === '/admin' && !mine },
    { href: '/admin?mine=1', label: t('mine'), icon: UserRoundCheckIcon, active: pathname === '/admin' && mine },
  ];

  return (
    <div className="min-h-dvh bg-[#f4f5f4] md:pl-[72px]">
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-4"
      >
        {tc('skipToContent')}
      </a>
      <aside
        aria-label={t('railLabel')}
        className="sticky top-0 z-40 flex h-14 items-center gap-1 bg-rail px-3 md:fixed md:inset-y-0 md:left-0 md:h-auto md:w-[72px] md:flex-col md:gap-2 md:px-0 md:py-4"
      >
        <Link href="/admin" className="mr-2 grid size-10 place-items-center rounded-xl md:mr-0 md:mb-4">
          <LogoMark className="size-7" />
          <span className="sr-only">{t('pipeline')}</span>
        </Link>
        <nav aria-label={t('railLabel')} className="flex gap-1 md:flex-col md:gap-2">
          {items.map((it) => (
            <Tooltip key={it.href}>
              <TooltipTrigger asChild>
                <Link
                  href={it.href}
                  aria-current={it.active ? 'page' : undefined}
                  className={cn(
                    'grid size-10 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white',
                    it.active && 'bg-white text-rail hover:bg-white hover:text-rail',
                  )}
                >
                  <it.icon className="size-5" aria-hidden="true" />
                  <span className="sr-only">{it.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{it.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <div className="ml-auto md:mt-auto md:ml-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className="grid size-10 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeftIcon className="size-5" aria-hidden="true" />
                <span className="sr-only">{t('backToSite')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('backToSite')}</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <div className="flex h-14 items-center justify-end gap-3 border-b border-line/70 bg-white px-4 sm:px-6">
        <span className="text-[13px] text-muted">{t('signedInAs', { name: user.name })}</span>
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-status-quoted text-[12px] font-semibold text-white"
        >
          {initials(user.name)}
        </span>
      </div>
      {children}
    </div>
  );
}
