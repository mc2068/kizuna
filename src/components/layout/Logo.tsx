import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

/** The three-rings mark (electricity, hot water, cooling). Decorative. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('size-6 shrink-0', className)}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--elec)" strokeWidth="2.6" />
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="var(--heat)" strokeWidth="2.6" />
      <circle cx="12" cy="12" r="2.6" fill="var(--cool)" />
    </svg>
  );
}

export function Logo({ className, tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap font-display text-[17px] font-semibold tracking-tight', tone === 'dark' ? 'text-white' : 'text-ink', className)}>
      <LogoMark />
      {siteConfig.name}
    </span>
  );
}
