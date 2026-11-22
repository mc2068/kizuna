import type { HourRow } from '@/lib/engine';

/**
 * Static summary of one typical day: the hotel's electricity demand (grey area) and what the engine
 * supplies (orange area), hour by hour. A light stand-in until Ahmed's <HourlyChart/> can be reused.
 */
export function DayChart({
  rows,
  label,
  kwLabel,
  hourTick,
}: {
  rows: HourRow[];
  label: string;
  kwLabel: string;
  /** Label for an hour tick, e.g. (6) => "06h". */
  hourTick: (h: string) => string;
}) {
  const W = 480;
  const H = 220;
  const pad = { l: 40, r: 8, t: 10, b: 28 };
  const peak = Math.max(...rows.map((r) => r.elecDemand), 1);
  const top = Math.ceil(peak / 100) * 100;
  const x = (h: number) => pad.l + (h / 23) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const area = (pick: (r: HourRow) => number) =>
    `M${x(0)},${y(0)} ` + rows.map((r) => `L${x(r.hour)},${y(pick(r))}`).join(' ') + ` L${x(23)},${y(0)} Z`;
  const ticksY = [0, top / 2, top];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      {ticksY.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
          <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--muted)">
            {v}
          </text>
        </g>
      ))}
      <path d={area((r) => r.elecDemand)} fill="var(--ink)" opacity={0.12} />
      <path d={area((r) => r.engineElec)} fill="var(--elec)" opacity={0.85} />
      {[0, 6, 12, 18, 23].map((h) => (
        <text key={h} x={x(h)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--muted)">
          {hourTick(String(h).padStart(2, '0'))}
        </text>
      ))}
      <text x={4} y={pad.t + 4} fontSize={11} fill="var(--muted)">
        {kwLabel}
      </text>
    </svg>
  );
}
