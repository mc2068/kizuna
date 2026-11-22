'use client';

// The full result under the configurator (#10), in the Keynote order: verdict and warnings first,
// then every range of the headline option, the faster option beside trigeneration when there is one,
// the assumptions with their sources, and the next step. Reads the current result with useTool().
import { useTranslations } from 'next-intl';
import { toToolSearchParams } from '@/lib/engine';
import { formatRange, verdictTone, warningText } from '@/lib/present';
import { AssumptionsTable } from './AssumptionsTable';
import { ResultsCards, usePlantText } from './ResultsCards';
import { ResultsOptions, badgeTone } from './ResultsOptions';
import { Collapse, usePop } from './motion';
import { fasterOption } from './results-metrics';
import { useTool } from './ToolState';

const toneAccent = {
  good: 'border-[var(--good,#1f8a4c)]',
  maybe: 'border-[var(--maybe,#b26b00)]',
  weak: 'border-[var(--weak,#8e8e93)]',
} as const;

function Verdict() {
  const t = useTranslations('tool');
  const tEngine = useTranslations('engine');
  const plantText = usePlantText();
  const { result } = useTool();
  const tone = verdictTone(result.verdict);
  const faster = fasterOption(result.options);
  const badge = usePop<HTMLSpanElement>(tone);

  return (
    <div className={`mt-12 border-l-4 pl-5 transition-colors duration-300 motion-reduce:transition-none sm:pl-7 ${toneAccent[tone]}`}>
      <span ref={badge} className={`inline-block rounded-full px-3 py-1.5 text-xs leading-none font-semibold ${badgeTone[tone]}`}>
        {t(`verdict.${tone}`)}
      </span>
      <h3 className="mt-4 max-w-3xl text-3xl leading-[1.08] font-semibold sm:text-[44px]">
        {t(`results.verdict.${tone}.title`)}
      </h3>
      <p className="mt-3 max-w-2xl text-lg text-[var(--muted,#6e6e73)]">{t(`results.verdict.${tone}.body`)}</p>

      <Collapse show={result.warnings.length > 0}>
        <div className="mt-6 max-w-2xl rounded-2xl bg-[var(--tile,#f5f5f7)] px-5 py-4">
          <h4 className="font-sans text-sm font-semibold tracking-normal">{t('results.warnings')}</h4>
          <ul className="mt-2 space-y-1.5 text-[15px]">
            {result.warnings.map((w) => (
              <li key={w.code} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--maybe,#b26b00)]" />
                {warningText(w, tEngine)}
              </li>
            ))}
          </ul>
        </div>
      </Collapse>

      <Collapse show={faster != null}>
        {faster ? (
          <p className="mt-5 max-w-2xl text-[15px] tabular-nums">
            {t('results.faster', { plant: plantText(faster), years: formatRange(faster, 'paybackYears').central })}
          </p>
        ) : null}
      </Collapse>
    </div>
  );
}

function NextStep() {
  const t = useTranslations('tool.results.cta');
  const { resultInputs } = useTool();
  return (
    <div className="mt-16 flex flex-col gap-6 rounded-[28px] border border-[var(--line,#d2d2d7)] px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between">
      <div className="max-w-xl">
        <h3 className="text-3xl font-semibold">{t('heading')}</h3>
        <p className="mt-2 text-[17px] text-[var(--muted,#6e6e73)]">{t('body')}</p>
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="flex flex-wrap gap-3">
          <a
            href={`/request-study${toToolSearchParams(resultInputs)}`}
            className="rounded-full bg-[var(--btn,#0071e3)] px-5 py-3 text-[17px] text-white hover:bg-[#0077ed] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)]"
          >
            {t('request')}
          </a>
          <button
            type="button"
            disabled
            aria-describedby="save-soon"
            className="cursor-not-allowed rounded-full border border-[var(--line,#d2d2d7)] px-5 py-3 text-[17px] text-[var(--faint,#86868b)]"
          >
            {t('save')}
          </button>
        </div>
        <p id="save-soon" className="text-xs text-[var(--muted,#6e6e73)]">
          {t('saveSoon')}
        </p>
      </div>
    </div>
  );
}

export function Results() {
  const { result } = useTool();
  const faster = fasterOption(result.options);
  return (
    <>
      <Verdict />
      <ResultsCards option={result} />
      <Collapse show={faster != null && result.options.trigeneration != null}>
        {faster && result.options.trigeneration ? (
          <ResultsOptions trigeneration={result.options.trigeneration} faster={faster} />
        ) : null}
      </Collapse>
      <AssumptionsTable assumptions={result.assumptions} />
      <NextStep />
    </>
  );
}
