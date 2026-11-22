// Overview: the sizing stored with the lead when it arrived (inputs, verdict, ranges, options),
// plus the call checklist and the latest note. Nothing is recomputed here.
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { formatRange, verdictTone, warningText } from '@/lib/present';
import type { LeadDetail } from '@/lib/db/types';
import { Box } from './Box';
import { RangeRow } from './RangeRow';
import { VERDICT_STYLE } from './LeadHeader';
import { formatDateTime } from './format';

export async function OverviewTab({ lead, names }: { lead: LeadDetail; names: Record<string, string> }) {
  const t = await getTranslations('lead');
  const r = lead.results;
  const tone = verdictTone(r.verdict);
  const best = r.options.best;
  const chpFaster = best && best.chillerKwc === 0 && best.scenarios.central.paybackYears < r.scenarios.central.paybackYears;
  const checklist = t.raw('overview.checklistItems') as string[];
  const latest = lead.notes[0];
  const central = (field: Parameters<typeof formatRange>[1], kind: Parameters<typeof formatRange>[2]) => formatRange(r, field, kind).central;

  return (
    <div className="grid gap-4">
      <Box title={t('overview.title')} subtitle={t('overview.subtitle', { version: lead.engineVersion })}>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-2xl leading-tight font-semibold tracking-tight">
            {r.chillerKwc
              ? t('overview.plantChiller', { engine: r.engineKwe, chiller: r.chillerKwc })
              : t('overview.plant', { engine: r.engineKwe })}
          </h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_STYLE[tone]}`}>{t(`verdict.${tone}`)}</span>
        </div>
        <p className="mt-1 text-[13px] text-[#6b6f72]">{t('overview.rangeNote')}</p>

        <div className="mt-4 border-t border-[#efefec]">
          <RangeRow option={r} field="paybackYears" kind="years" label={t('overview.rows.payback')} sub={t('overview.rows.paybackSub')} />
          <RangeRow option={r} field="paybackYearsWithFte" kind="years" label={t('overview.rows.paybackFte')} sub={t('overview.rows.paybackFteSub')} />
          <RangeRow option={r} field="annualSavingsTnd" kind="tnd" label={t('overview.rows.savings')} sub={t('overview.rows.savingsSub')} />
          <RangeRow option={r} field="capexTnd" kind="tnd" label={t('overview.rows.capex')} sub={t('overview.rows.capexSub')} />
          <RangeRow option={r} field="co2AvoidedTonnes" kind="tonnes" label={t('overview.rows.co2')} sub={t('overview.rows.co2Sub')} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {(
            [
              ['fullLoadHours', central('fullLoadHours', 'hours')],
              ['primaryEnergy', central('primaryEnergySaving', 'percent')],
              ['peakRelief', central('peakGridReliefKw', 'kw')],
              ['demandCharge', central('demandChargeSavingTnd', 'tnd')],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-[10px] bg-[#f3f3f1] px-3 py-2.5">
              <dt className="text-[11.5px] text-[#6b6f72]">{t(`overview.minis.${key}`)}</dt>
              <dd className="mt-0.5 text-base font-semibold tracking-tight tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {r.warnings.length > 0 && (
          <div className="mt-4 rounded-xl bg-[#fbefd9] px-3.5 py-3 text-[13px] text-[#6f4300]">
            <p className="font-semibold">{t('overview.warnings')}</p>
            <ul className="mt-1 list-disc pl-5">
              {r.warnings.map((w) => (
                <li key={w}>{warningText(w)}</li>
              ))}
            </ul>
          </div>
        )}

        {chpFaster && best && (
          <div className="mt-4 rounded-xl border border-dashed border-[#cfcfc9] px-3.5 py-3 text-[13px] text-[#6b6f72]">
            <p className="font-semibold text-[#17191a]">{t('overview.chpTitle', { engine: best.engineKwe })}</p>
            <p className="mt-0.5">
              {t('overview.chpBody', {
                payback: formatRange(best, 'paybackYears', 'years').text,
                capex: formatRange(best, 'capexTnd', 'tnd').text,
              })}
            </p>
          </div>
        )}
      </Box>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Box title={t('overview.inputs')}>
          <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-[13px]">
            <dt className="text-[#6b6f72]">{t('overview.inputRooms')}</dt>
            <dd className="font-medium tabular-nums">{lead.inputs.rooms}</dd>
            <dt className="text-[#6b6f72]">{t('overview.inputCity')}</dt>
            <dd className="font-medium">{t(`cities.${lead.inputs.city}`)}</dd>
            <dt className="text-[#6b6f72]">{t('overview.inputPool')}</dt>
            <dd className="font-medium">{lead.inputs.pool ? t('header.poolYes') : t('header.poolNo')}</dd>
            <dt className="text-[#6b6f72]">{t('overview.inputElec')}</dt>
            <dd className="font-medium">
              {lead.inputs.elecPrice === null ? t('overview.elecDefault') : t('overview.elecFlat', { price: lead.inputs.elecPrice })}
            </dd>
          </dl>
        </Box>

        <Box title={t('overview.checklist')}>
          <ul className="grid gap-2 text-[13px]">
            {checklist.map((q) => (
              <li key={q} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[#0f766e]" />
                {q}
              </li>
            ))}
          </ul>
        </Box>

        {latest && (
          <Box
            title={t('overview.latestNote')}
            action={
              <Link href="?tab=notes" scroll={false} className="text-[12.5px] font-medium text-[#0f766e] hover:underline">
                {t('overview.allNotes')}
              </Link>
            }
          >
            <p className="text-[13px] leading-relaxed whitespace-pre-line">{latest.body}</p>
            <p className="mt-2 text-xs text-[#6b6f72]">
              {names[latest.authorId] ?? t('history.unknownPerson')} · {formatDateTime(latest.createdAt)}
            </p>
          </Box>
        )}
      </div>
    </div>
  );
}
