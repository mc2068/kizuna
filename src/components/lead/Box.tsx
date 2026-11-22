import type { ReactNode } from 'react';

/** A white card with an optional header row, as in the admin prototype. */
export function Box({
  title,
  subtitle,
  action,
  children,
  bodyClassName = 'p-[18px]',
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="min-w-0 rounded-[14px] border border-[#e4e4e0] bg-white">
      {title && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#efefec] px-[18px] py-4">
          <h2 className="text-[15.5px] font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-[12.5px] text-[#6b6f72]">{subtitle}</p>}
          {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Round initials for a team member or contact. */
export function Avatar({ label, size = 'md', tone = 'bg-[#0f766e]' }: { label: string; size?: 'md' | 'lg'; tone?: string }) {
  const s = size === 'lg' ? 'h-10 w-10 text-[13px]' : 'h-8 w-8 text-[11px]';
  return (
    <span aria-hidden="true" className={`grid flex-none place-items-center rounded-full font-semibold text-white ${s} ${tone}`}>
      {label}
    </span>
  );
}
