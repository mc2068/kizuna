// One stored result as a range rail (favourable to unfavourable, central dot), read-only.
// The tool's <RangeRail/> (#10) is not on the default branch yet; this stays local to the lead
// page and can be swapped for it later. Labels come from @/lib/present, never formatted here.
import { getTranslations } from 'next-intl/server';
import { formatRange, type RangeKind } from '@/lib/present';
import type { PlantOption, ScenarioResult } from '@/lib/engine';

export async function RangeRow({
  option,
  field,
  kind,
  label,
  sub,
}: {
  option: Pick<PlantOption, 'scenarios'>;
  field: keyof ScenarioResult;
  kind: RangeKind;
  label: string;
  sub: string;
}) {
  const t = await getTranslations('lead.overview');
  const s = option.scenarios;
  const text = formatRange(option, field, kind);
  const values = [s.favourable[field], s.central[field], s.unfavourable[field]];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const max = Math.max(hi * 1.15, 1);
  const pct = (v: number) => (Math.max(0, v) / max) * 100;
  const loIsFavourable = s.favourable[field] <= s.unfavourable[field];
  const [loLabel, hiLabel] = loIsFavourable ? [text.favourable, text.unfavourable] : [text.unfavourable, text.favourable];

  return (
    <div className="grid items-center gap-x-5 gap-y-2 border-b border-[#efefec] py-3.5 md:grid-cols-[170px_minmax(0,1fr)_minmax(200px,auto)]">
      <div className="font-medium">
        {label}
        <small className="block text-xs font-normal text-[#6b6f72]">{sub}</small>
      </div>
      <div aria-hidden="true" className="relative h-9">
        <div className="absolute top-[22px] right-0 left-0 h-0.5 rounded bg-[#ececea]" />
        <div
          className="absolute top-[19px] h-2 rounded bg-[#cfd3d1]"
          style={{ left: `${pct(lo)}%`, width: `${Math.max(1.5, pct(hi) - pct(lo))}%` }}
        />
        <div
          className="absolute top-[17px] -ml-1.5 h-3 w-3 rounded-full bg-[#17191a] ring-2 ring-white"
          style={{ left: `${pct(s.central[field])}%` }}
        />
        <span className="absolute top-0 -translate-x-1/2 text-[10.5px] whitespace-nowrap text-[#9a9ea1] tabular-nums" style={{ left: `${pct(lo)}%` }}>
          {loLabel}
        </span>
        <span className="absolute top-0 -translate-x-1/2 text-[10.5px] whitespace-nowrap text-[#9a9ea1] tabular-nums" style={{ left: `${pct(hi)}%` }}>
          {hiLabel}
        </span>
      </div>
      <div className="md:text-right">
        <p className="text-[15px] font-semibold tracking-tight tabular-nums">{text.central}</p>
        <p className="text-xs text-[#6b6f72] tabular-nums">{t('range', { from: text.favourable, to: text.unfavourable })}</p>
      </div>
    </div>
  );
}
