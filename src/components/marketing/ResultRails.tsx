import { getTranslations } from 'next-intl/server';
import type { ScenarioResult, SizingResult } from '@/lib/engine';
import { formatRange, formatValue, rangeOf } from '@/lib/present';
import { RangeRail } from './RangeRail';

type Row = { key: 'payback' | 'savings' | 'capex' | 'co2'; field: keyof ScenarioResult; unit: string; max: number };
export const RESULT_ROWS: Row[] = [
  { key: 'payback', field: 'paybackYears', unit: 'years', max: 25 },
  { key: 'savings', field: 'annualSavingsTnd', unit: 'TND', max: 300_000 },
  { key: 'capex', field: 'capexTnd', unit: 'TND', max: 3_000_000 },
  { key: 'co2', field: 'co2AvoidedTonnes', unit: 't', max: 300 },
];

/** The four headline results as range rails on a light background. */
export async function ResultRails({ result }: { result: SizingResult }) {
  const t = await getTranslations('marketing.home.demo.rows');
  const s = result.scenarios;
  return (
    <div className="grid gap-8">
      {RESULT_ROWS.map((row) => {
        const r = rangeOf(s, row.field);
        return (
          <div key={row.key} className="grid gap-4 border-t border-line pt-6 md:grid-cols-[200px_1fr_220px] md:items-center md:gap-10">
            <div>
              <h3 className="font-sans text-[17px] font-semibold">{t(`${row.key}.title`)}</h3>
              <p className="text-[14px] text-muted">{t(`${row.key}.body`)}</p>
            </div>
            <RangeRail
              title={t(`${row.key}.title`)}
              favourable={s.favourable[row.field]}
              central={s.central[row.field]}
              unfavourable={s.unfavourable[row.field]}
              unit={row.unit}
              max={row.max}
            />
            <div className="md:text-right">
              <p className="tabular font-display text-[30px] leading-none font-semibold tracking-tight">{formatRange(s, row.field, row.unit)}</p>
              <p className="mt-1 text-[14px] text-muted">{t(`${row.key}.central`, { value: formatValue(r.central, row.unit) })}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
