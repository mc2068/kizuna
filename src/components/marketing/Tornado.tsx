import { getTranslations } from 'next-intl/server';
import { sensitivity } from '@/content/method';
import { formatNumber } from '@/lib/present';
import { cn } from '@/lib/utils';

/**
 * "What moves the answer": one bar per input, from the favourable to the unfavourable payback,
 * around the central case. Data from src/content/method.ts (sensitivity).
 */
export async function Tornado({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  const t = await getTranslations('marketing.tornado');
  const { baselineYears, rows } = sensitivity;
  const all = rows.flatMap((r) => [r.favourableYears, r.unfavourableYears]);
  const lo = Math.floor(Math.min(...all, baselineYears) - 1);
  const hi = Math.ceil(Math.max(...all, baselineYears) + 1);
  const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const dark = tone === 'dark';

  return (
    <figure className={cn('w-full', className)} aria-label={t('label', { baseline: formatNumber(baselineYears) })}>
      <ul className="grid gap-5">
        {rows.map((r) => {
          const fav = Math.min(r.favourableYears, baselineYears);
          const unf = Math.max(r.unfavourableYears, baselineYears);
          return (
            <li key={r.input} className="grid gap-2 md:grid-cols-[minmax(0,220px)_1fr] md:items-center md:gap-6">
              <div>
                <span className="block text-[15px] font-semibold">{r.input}</span>
                <span className={cn('block text-[13px]', dark ? 'text-dark-muted' : 'text-muted')}>{r.values}</span>
              </div>
              <div className="relative h-8" aria-hidden="true">
                <div
                  className="absolute top-1/2 h-4 -translate-y-1/2 rounded-l-full bg-good"
                  style={{ left: `${x(fav)}%`, width: `${x(baselineYears) - x(fav)}%` }}
                />
                <div
                  className="absolute top-1/2 h-4 -translate-y-1/2 rounded-r-full bg-heat"
                  style={{ left: `${x(baselineYears)}%`, width: `${x(unf) - x(baselineYears)}%` }}
                />
                <div className={cn('absolute inset-y-0 w-px', dark ? 'bg-white/60' : 'bg-ink/60')} style={{ left: `${x(baselineYears)}%` }} />
                <span
                  className={cn('tabular absolute top-1/2 -translate-x-full -translate-y-1/2 pr-2 text-[13px]', dark ? 'text-dark-muted' : 'text-muted')}
                  style={{ left: `${x(fav)}%` }}
                >
                  {t('years', { value: formatNumber(r.favourableYears) })}
                </span>
                <span
                  className={cn('tabular absolute top-1/2 -translate-y-1/2 pl-2 text-[13px]', dark ? 'text-dark-muted' : 'text-muted')}
                  style={{ left: `${x(unf)}%` }}
                >
                  {t('years', { value: formatNumber(r.unfavourableYears) })}
                </span>
              </div>
              <span className="sr-only">
                {t('row', { input: r.input, favourable: formatNumber(r.favourableYears), unfavourable: formatNumber(r.unfavourableYears) })}
              </span>
            </li>
          );
        })}
      </ul>
      <figcaption className={cn('mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px]', dark ? 'text-dark-muted' : 'text-muted')}>
        <span className="inline-flex items-center gap-2">
          <i aria-hidden="true" className="inline-block h-2.5 w-5 rounded-full bg-good" />
          {t('favourable')}
        </span>
        <span className="inline-flex items-center gap-2">
          <i aria-hidden="true" className="inline-block h-2.5 w-5 rounded-full bg-heat" />
          {t('unfavourable')}
        </span>
        <span className="inline-flex items-center gap-2">
          <i aria-hidden="true" className={cn('inline-block h-3.5 w-px', dark ? 'bg-white/60' : 'bg-ink/60')} />
          {t('central', { years: formatNumber(baselineYears) })}
        </span>
      </figcaption>
    </figure>
  );
}
