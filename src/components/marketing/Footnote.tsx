import { useTranslations } from 'next-intl';
import { getReference, referenceHref, referenceNumber } from './references';
import { cn } from '@/lib/utils';

/** Superscript source number linking to /sources#ref-<id>. Unknown ids fail the build. */
export function Footnote({ id, className }: { id: string; className?: string }) {
  const t = useTranslations('common.footnote');
  const n = referenceNumber(id);
  const ref = getReference(id);
  return (
    <sup className={cn('ml-0.5 align-super text-[0.6em] leading-none font-normal', className)}>
      <a
        href={referenceHref(id)}
        aria-label={t('label', { n, title: ref.title })}
        className="tabular rounded px-0.5 text-current hover:text-link hover:underline"
      >
        {n}
      </a>
    </sup>
  );
}
