'use client';

// Target of the summary's "See full results" link. Extension point:
// - #10 adds <Results /> (ranges, verdict, options, assumptions) inside this section;
// - #11 adds <HourlyChart /> after it.
// Both read the current result with useTool() from ./ToolState.
import { useTranslations } from 'next-intl';
import { HourlyChart } from './HourlyChart';

export function ResultsSection({ children }: { children?: React.ReactNode }) {
  const t = useTranslations('tool.results');
  return (
    <section
      id="results"
      aria-labelledby="results-heading"
      className="mt-24 scroll-mt-20 border-t border-[var(--line,#d2d2d7)] pt-16"
    >
      <h2 id="results-heading" className="text-4xl font-semibold sm:text-5xl">
        {t('heading')}
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-[var(--muted,#6e6e73)]">{t('intro')}</p>
      {children}
      <HourlyChart />
    </section>
  );
}
