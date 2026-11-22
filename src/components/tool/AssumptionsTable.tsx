'use client';

// Every engine parameter with its three values and its source, folded away under the results.
// URLs in a source become links (new tab); the method's references (src/content/method.ts) add links
// for sources the engine notes without a URL; anything left points to the Sources and method page.
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Assumption } from '@/lib/engine';
import { ASSUMPTIONS, REFERENCES } from '@/content/method';
import { formatPercent } from '@/lib/present';
import { sourceParts } from './results-metrics';

const SCENARIO_COLUMNS = ['favourable', 'central', 'unfavourable'] as const;

/** Reference links per parameter label, from the method content. */
const REFS_BY_LABEL = new Map(
  ASSUMPTIONS.map((a) => [a.label, a.refs.map((id) => REFERENCES.find((r) => r.id === id)!).filter(Boolean)]),
);

// @/lib/present formats engine outputs, not parameters; until it has a helper for these, parameters are
// shown at the precision the engine stores them (en-GB grouping), fractions as % and flags as words.
const paramNumber = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 4 });

function paramValue(value: number, unit: string, words: { yes: string; no: string }): string {
  if (unit === 'fraction') return formatPercent(value);
  if (unit === 'yes=1') return value ? words.yes : words.no;
  return paramNumber.format(value);
}

/** Fractions read as % and flags as words, so their unit column stays empty. */
function paramUnit(unit: string): string {
  return unit === 'fraction' || unit === 'yes=1' || unit === '-' ? '' : unit;
}

const linkClass = 'text-[var(--link,#0066cc)] underline-offset-2 hover:underline';

function ExternalLink({ href, label }: { href: string; label: string }) {
  const t = useTranslations('tool.results.assumptions');
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={href} className={linkClass}>
      {label}
      <span className="sr-only"> {t('newTab')}</span>
    </a>
  );
}

function Source({ assumption }: { assumption: Assumption }) {
  const t = useTranslations('tool.results.assumptions');
  const parts = sourceParts(assumption.source);
  const inText = new Set(parts.flatMap((p) => (p.kind === 'link' ? [p.href] : [])));
  const refs = (REFS_BY_LABEL.get(assumption.name) ?? []).filter((r) => !inText.has(r.url));
  return (
    <>
      {parts.map((part, i) =>
        part.kind === 'link' ? <ExternalLink key={i} href={part.href} label={part.label} /> : <span key={i}>{part.text}</span>,
      )}
      {refs.length > 0 ? (
        <span className="mt-1 block">
          {t('see')}{' '}
          {refs.map((r, i) => (
            <span key={r.id}>
              {i > 0 ? ', ' : null}
              <ExternalLink href={r.url} label={r.publisher} />
            </span>
          ))}
        </span>
      ) : inText.size === 0 ? (
        <span className="mt-1 block">
          <Link href="/sources" className={linkClass}>
            {t('methodShort')}
          </Link>
        </span>
      ) : null}
    </>
  );
}

export function AssumptionsTable({ assumptions }: { assumptions: Assumption[] }) {
  const t = useTranslations('tool.results.assumptions');
  const words = { yes: t('yes'), no: t('no') };

  return (
    <details className="group mt-16 rounded-[28px] bg-[var(--tile,#f5f5f7)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[28px] px-6 py-6 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)] sm:px-8 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-2xl font-semibold tracking-[-0.03em]">{t('summary')}</span>
          <span className="mt-1 block text-sm text-[var(--muted,#6e6e73)]">{t('count', { count: assumptions.length })}</span>
        </span>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
        >
          <Plus className="size-4" strokeWidth={2.25} />
        </span>
      </summary>

      <div className="px-6 pb-8 sm:px-8">
        <p className="max-w-3xl text-[15px] text-[var(--muted,#6e6e73)]">{t('intro')}</p>
        {/* relative: keeps the sr-only spans inside the scroller, or they widen the page on phones. */}
        <div className="relative mt-6 overflow-x-auto rounded-2xl bg-white" tabIndex={0} role="region" aria-label={t('caption')}>
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <caption className="sr-only">{t('caption')}</caption>
            <thead>
              <tr className="border-b border-[var(--line,#d2d2d7)] text-xs text-[var(--muted,#6e6e73)]">
                <th scope="col" className="w-[24%] px-4 py-3 font-medium">
                  {t('name')}
                </th>
                {SCENARIO_COLUMNS.map((c) => (
                  <th key={c} scope="col" className="px-3 py-3 text-right font-medium">
                    {t(c)}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 font-medium">
                  {t('unit')}
                </th>
                <th scope="col" className="w-[38%] px-4 py-3 font-medium">
                  {t('source')}
                </th>
              </tr>
            </thead>
            <tbody>
              {assumptions.map((a) => (
                <tr key={a.name} className="border-b border-[#ececf0] align-top last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium">
                    {a.name}
                  </th>
                  {SCENARIO_COLUMNS.map((c) => (
                    <td
                      key={c}
                      className={`px-3 py-3 text-right whitespace-nowrap tabular-nums ${c === 'central' ? 'font-semibold' : 'text-[var(--muted,#6e6e73)]'}`}
                    >
                      {paramValue(a[c], a.unit, words)}
                    </td>
                  ))}
                  <td className="px-3 py-3 whitespace-nowrap text-[var(--muted,#6e6e73)]">{paramUnit(a.unit)}</td>
                  <td className="px-4 py-3 text-[13px] leading-relaxed text-[var(--muted,#6e6e73)]">
                    <Source assumption={a} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-[15px]">
          <Link href="/sources" className={linkClass}>
            {t('method')}
          </Link>
        </p>
      </div>
    </details>
  );
}
