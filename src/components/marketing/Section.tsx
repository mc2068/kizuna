import { cn } from '@/lib/utils';

type Tone = 'light' | 'tile' | 'white' | 'dark';
const TONES: Record<Tone, string> = {
  light: 'bg-bg text-ink',
  tile: 'bg-tile text-ink',
  white: 'bg-white text-ink',
  dark: 'bg-dark text-white',
};

/** One idea per screen: a full-width band with a centred column. */
export function Section({
  id,
  tone = 'light',
  width = 'default',
  className,
  innerClassName,
  labelledBy,
  children,
}: {
  id?: string;
  tone?: Tone;
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
  innerClassName?: string;
  labelledBy?: string;
  children: React.ReactNode;
}) {
  const max = { narrow: 'max-w-[780px]', default: 'max-w-[1100px]', wide: 'max-w-[1280px]' }[width];
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-tone={tone}
      className={cn('px-4 py-20 sm:px-6 md:py-28', TONES[tone], className)}
    >
      <div className={cn('mx-auto', max, innerClassName)}>{children}</div>
    </section>
  );
}

/** Big Keynote heading with an optional muted second line. */
export function SectionHeading({
  id,
  as: Tag = 'h2',
  children,
  sub,
  align = 'center',
  size = 'display',
  className,
}: {
  id?: string;
  as?: 'h1' | 'h2' | 'h3';
  children: React.ReactNode;
  sub?: React.ReactNode;
  align?: 'center' | 'left';
  size?: 'hero' | 'display' | 'headline';
  className?: string;
}) {
  const sizes = { hero: 'text-hero', display: 'text-display', headline: 'text-headline' };
  return (
    <Tag id={id} className={cn('font-semibold', sizes[size], align === 'center' && 'text-center', className)}>
      {children}
      {sub ? <span className="block text-faint">{sub}</span> : null}
    </Tag>
  );
}

export function Lede({ children, className, align = 'center' }: { children: React.ReactNode; className?: string; align?: 'center' | 'left' }) {
  return (
    <p className={cn('mt-6 max-w-[42rem] text-lede text-muted', align === 'center' && 'mx-auto text-center', className)}>
      {children}
    </p>
  );
}
