import { Eyebrow } from './Eyebrow';
import { cn } from '@/lib/utils';

/** The opening screen of a sub-page: eyebrow, huge two-tone title, lede. */
export function PageHero({
  eyebrow,
  title,
  titleSub,
  lede,
  children,
  className,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  titleSub?: string;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  align?: 'center' | 'left';
}) {
  return (
    <section aria-labelledby="page-title" className={cn('px-4 pt-16 pb-12 sm:px-6 md:pt-24 md:pb-16', className)}>
      <div className={cn('mx-auto max-w-[1100px]', align === 'center' && 'text-center')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 id="page-title" className="text-hero font-semibold">
          {title}
          {titleSub ? <span className="block text-faint">{titleSub}</span> : null}
        </h1>
        {lede ? (
          <p className={cn('mt-8 max-w-[40rem] text-lede text-muted', align === 'center' && 'mx-auto')}>{lede}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
