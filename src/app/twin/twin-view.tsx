'use client';

// Draws the virtual site. Every number arrives precomputed from src/lib/twin/flows.ts (see page.tsx); this
// file only chooses positions, colours and arrow widths. Three parts, top to bottom:
//   1. "Now": the chosen hour, the grid saving of B against A, two bars, play, and a 24-hour chart that
//      doubles as the hour picker (with a visually hidden range input for keyboards and screen readers).
//   2. Two flat SVG diagrams, A (today) and B (with the plant), same layout. On phones one at a time.
//   3. The legend. The honesty line with its footnotes is in page.tsx (server).
// Arrow width = kW x one scale for the whole day, so the same width means the same kW at every hour and on
// both sides. Colours are the Contract 2 tokens; type, buttons and the moving dashes come from the design system.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useTranslations } from 'next-intl';
import { AirVent, Cog, Droplets, Fan, Flame, Heater, Hotel, PauseIcon, PlayIcon, Snowflake, UtilityPole, type LucideIcon } from 'lucide-react';
import { formatKw, formatPercent } from '@/lib/present';
import { FLOWS, gridSaving, maxFlowKw, type EnergyKind, type FlowId, type NodeId, type SiteHour, type TwinHour } from '@/lib/twin/flows';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------------------------------------------
// Colours and motion
// ---------------------------------------------------------------------------------------------------------------

/**
 * Arrow and fill colours (Contract 2). Gas has no energy token: it uses ink, as in the How it works diagram,
 * lightened so the biggest flow of the day (gas into the engine) does not dominate the picture.
 */
const STROKE: Record<EnergyKind, string> = {
  fuel: 'color-mix(in srgb, var(--ink) 24%, white)',
  elec: 'var(--elec)',
  heat: 'var(--heat)',
  cool: 'var(--cool)',
};
/** Text in the energy colours, the AA-contrast variants. */
const TEXT: Record<EnergyKind, string> = {
  fuel: 'var(--muted)',
  elec: 'var(--elec-text)',
  heat: 'var(--heat-text)',
  cool: 'var(--cool-text)',
};
const TINT = (k: EnergyKind) => `color-mix(in srgb, ${k === 'fuel' ? 'var(--faint)' : STROKE[k]} 14%, white)`;
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const LINE = 'var(--line)';
const TILE = 'var(--tile)';

/**
 * Twin-only styles. A <style> tag, not a CSS module: next.config.ts sends every *.css file through the Tailwind
 * loader, which drops CSS-module class names. The moving dashes are the design system's .flow-dash
 * (globals.css), and its prefers-reduced-motion rule also stills these transitions.
 */
const CSS = `
.twin-flow { transition: stroke-width 450ms ease; }
.twin-bar { transition: width 450ms ease; }
.twin-label { paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; }
/* Phones: the diagram is ~330px wide (0.75x), so the text inside it is set larger to stay readable. */
@media (max-width: 639px) {
  .twin-kw { font-size: 14.5px; }
  .twin-name { font-size: 12.5px; }
  .twin-small { font-size: 11px; }
}
`;

// ---------------------------------------------------------------------------------------------------------------
// Diagram layout: a 440 x 412 canvas, cards in 4 columns x 4 rows, the switchboard as a bus bar between
// columns 2 and 3. Same positions on both sides, so A and B can be compared at a glance.
// ---------------------------------------------------------------------------------------------------------------

const VIEW_W = 440;
const VIEW_H = 412;
const CW = 88;
const CH = 62;
const COL = [0, 118, 236, 352] as const;
const ROW = [10, 130, 230, 330] as const;
const BUS = { x: 210, y: 22, w: 6, h: 78 };

type CardId = Exclude<NodeId, 'switchboard'>;
const CARD: Record<CardId, { x: number; y: number; icon: LucideIcon; kind: EnergyKind }> = {
  grid: { x: COL[0], y: ROW[0], icon: UtilityPole, kind: 'elec' },
  hotelElec: { x: COL[3], y: ROW[0], icon: Hotel, kind: 'elec' },
  electricChillers: { x: COL[2], y: ROW[1], icon: Fan, kind: 'cool' },
  cooling: { x: COL[3], y: ROW[1], icon: AirVent, kind: 'cool' },
  engine: { x: COL[1], y: ROW[2], icon: Cog, kind: 'elec' },
  absorptionChiller: { x: COL[2], y: ROW[2], icon: Snowflake, kind: 'cool' },
  gas: { x: COL[0], y: ROW[3], icon: Flame, kind: 'fuel' },
  boiler: { x: COL[2], y: ROW[3], icon: Heater, kind: 'heat' },
  hotWater: { x: COL[3], y: ROW[3], icon: Droplets, kind: 'heat' },
};
const B_ONLY: ReadonlySet<CardId> = new Set(['engine', 'absorptionChiller']);

type Pt = readonly [number, number];
/** Each arrow as a cubic Bezier [start, control 1, control 2, end], routed through empty cells. */
const PATH: Record<FlowId, readonly [Pt, Pt, Pt, Pt]> = {
  gridToSwitchboard: [[88, 41], [140, 41], [170, 41], [210, 41]],
  switchboardToHotel: [[216, 41], [270, 41], [300, 41], [352, 41]],
  switchboardToElectricChillers: [[216, 90], [256, 90], [280, 96], [280, 130]],
  switchboardToAbsorption: [[216, 97], [234, 108], [252, 196], [252, 230]],
  engineToSwitchboard: [[170, 230], [170, 160], [213, 150], [213, 100]],
  gasToEngine: [[44, 330], [44, 276], [80, 261], [118, 261]],
  gasToBoiler: [[88, 361], [150, 361], [180, 361], [236, 361]],
  engineToHotWater: [[150, 292], [160, 318], [320, 312], [352, 346]],
  engineToAbsorption: [[206, 264], [216, 264], [226, 264], [236, 264]],
  boilerToHotWater: [[324, 374], [334, 374], [342, 374], [352, 374]],
  electricChillersToCooling: [[324, 161], [334, 161], [342, 161], [352, 161]],
  absorptionToCooling: [[324, 261], [342, 261], [334, 180], [352, 180]],
};
/** Where each kW label sits, in free space next to its arrow. */
const LABEL: Record<FlowId, Pt> = {
  gridToSwitchboard: [150, 29],
  switchboardToHotel: [284, 29],
  switchboardToElectricChillers: [250, 120],
  switchboardToAbsorption: [230, 214],
  engineToSwitchboard: [136, 188],
  gasToEngine: [78, 306],
  gasToBoiler: [162, 350],
  engineToHotWater: [282, 304],
  engineToAbsorption: [221, 254],
  boilerToHotWater: [338, 405],
  electricChillersToCooling: [338, 122],
  absorptionToCooling: [345, 214],
};

const MAX_ARROW_PX = 16;
/** Below this width the moving dashes are not drawn: on a hairline they read as a dotted line. */
const MIN_PULSE_PX = 4;

const d = (p: readonly [Pt, Pt, Pt, Pt]) => `M${p[0].join(',')} C${p[1].join(',')} ${p[2].join(',')} ${p[3].join(',')}`;
const hh = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;

// ---------------------------------------------------------------------------------------------------------------
// Diagram
// ---------------------------------------------------------------------------------------------------------------

function Card({ id, label, ghost, off, offLabel, ghostLabel }: { id: CardId; label: string; ghost?: boolean; off?: boolean; offLabel: string; ghostLabel: string }) {
  const { x, y, icon: Icon, kind } = CARD[id];
  const cx = x + CW / 2;
  const lines = label.split('\n');
  const dim = ghost || off;
  return (
    <g opacity={ghost ? 0.7 : 1}>
      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={CW - 1}
        height={CH - 1}
        rx={14}
        fill={ghost ? TILE : '#fff'}
        stroke={LINE}
        strokeDasharray={dim ? '4 3' : undefined}
      />
      <circle cx={cx} cy={y + 19} r={12} fill={dim ? TILE : TINT(kind)} />
      <Icon x={cx - 7} y={y + 12} width={14} height={14} color={dim ? MUTED : TEXT[kind]} strokeWidth={2} aria-hidden="true" />
      <text x={cx} y={y + (lines.length > 1 ? 43 : 49)} textAnchor="middle" fontSize={11} fill={dim ? MUTED : INK} className="twin-name">
        {lines.map((line, i) => (
          <tspan key={i} x={cx} dy={i === 0 ? 0 : 12.5}>
            {line}
          </tspan>
        ))}
      </text>
      {ghost && (
        <text x={cx} y={y - 4} textAnchor="middle" fontSize={9.5} fontWeight={600} fill={MUTED} letterSpacing={0.3} className="twin-small">
          {ghostLabel}
        </text>
      )}
      {off && (
        <g>
          <rect x={x + CW - 30} y={y + 6} width={24} height={14} rx={7} fill={MUTED} />
          <text x={x + CW - 18} y={y + 16} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#fff">
            {offLabel}
          </text>
        </g>
      )}
    </g>
  );
}

function Diagram({ side, site, hour, engineOn, scale }: { side: 'A' | 'B'; site: SiteHour; hour: number; engineOn: boolean; scale: number }) {
  const t = useTranslations('method.twin');
  const flows = FLOWS.filter((f) => side === 'B' || f.side === 'both');
  const id = `twin-${side}`;
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-auto w-full"
      role="img"
      aria-label={t('diagramLabel', { side: t(side === 'A' ? 'sideA' : 'sideB'), hour: t('hourLabel', { from: hh(hour), to: hh(hour + 1) }) })}
    >
      <defs>
        {flows.map((f) => {
          const w = Math.max(1.5, site.flows[f.id] * scale);
          const head = Math.min(20, Math.max(8, 5 + w * 0.9));
          return (
            <marker key={f.id} id={`${id}-${f.id}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth={head} markerHeight={head} markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={STROKE[f.kind]} />
            </marker>
          );
        })}
      </defs>

      {/* Switchboard: the bus bar every electrical flow passes through. A junction, not a machine. */}
      <rect x={BUS.x} y={BUS.y} width={BUS.w} height={BUS.h} rx={3} fill={MUTED} />
      <text x={BUS.x + BUS.w / 2} y={BUS.y - 8} textAnchor="middle" fontSize={9.5} fill={MUTED} className="twin-small">
        {t('nodes.switchboard')}
      </text>

      {(Object.keys(CARD) as CardId[]).map((n) => (
        <Card
          key={n}
          id={n}
          label={t(`nodes.${n}`)}
          ghost={side === 'A' && B_ONLY.has(n)}
          off={side === 'B' && n === 'engine' && !engineOn}
          offLabel={t('off')}
          ghostLabel={t('notInstalled')}
        />
      ))}
      {flows.map((f) => {
        const kw = site.flows[f.id];
        const live = Math.round(kw) > 0;
        const w = Math.max(1.5, kw * scale);
        const path = d(PATH[f.id]);
        if (!live) {
          // Zero this hour (engine off at night): a faint trace, no label, so the night view stays calm.
          return <path key={f.id} d={path} fill="none" stroke={STROKE[f.kind]} strokeWidth={1} strokeDasharray="2 4" strokeOpacity={0.45} />;
        }
        return (
          <g key={f.id}>
            <path d={path} fill="none" stroke={STROKE[f.kind]} strokeWidth={w} strokeOpacity={0.9} markerEnd={`url(#${id}-${f.id})`} className="twin-flow" />
            {w >= MIN_PULSE_PX && <path d={path} fill="none" stroke="#fff" strokeOpacity={0.6} strokeWidth={Math.min(3, w / 3)} className="flow-dash" />}
          </g>
        );
      })}


      {/* Labels last, so no card or arrow covers them. */}
      {flows.map((f) => {
        const kw = site.flows[f.id];
        if (Math.round(kw) <= 0) return null;
        return (
          <text key={f.id} x={LABEL[f.id][0]} y={LABEL[f.id][1]} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={TEXT[f.kind]} className="twin-label twin-kw tabular">
            {formatKw(Math.round(kw))}
          </text>
        );
      })}
    </svg>
  );
}

function Totals({ site }: { site: SiteHour }) {
  const t = useTranslations('method.twin.totals');
  const rows: [string, number][] = [
    [t('grid'), site.gridKw],
    [t('gas'), site.gasKw],
    [t('losses'), site.lossesKw],
  ];
  if (site.unusedHeatKw >= 0.5) rows.push([t('unused'), site.unusedHeatKw]);
  return (
    <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
      {rows.map(([label, kw]) => (
        <div key={label} className="min-w-0">
          <dt className="truncate text-xs text-muted">{label}</dt>
          <dd className="text-base font-semibold tabular">{formatKw(Math.round(kw))}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// 24-hour chart: grid draw of A (light) and B (solid) per hour; the gap between them is the saving. It is also
// the hour picker: click or drag on it. A visually hidden <input type="range"> carries keyboard and screen
// reader access, and the chart shows its focus ring.
// ---------------------------------------------------------------------------------------------------------------

function DayChart({ day, hour, onHour }: { day: TwinHour[]; hour: number; onHour: (h: number) => void }) {
  const t = useTranslations('method.twin');
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const H = 132;
  const top = 20;
  const base = H - 22;
  const max = Math.max(1, ...day.map((h) => h.a.gridKw)) * 1.08;
  const x = (h: number) => (h / 24) * w;
  const y = (kw: number) => base - (kw / max) * (base - top);
  const steps = (get: (t: TwinHour) => number) =>
    `M0,${base} ` + day.map((t, h) => `L${x(h)},${y(get(t))} L${x(h + 1)},${y(get(t))}`).join(' ') + ` L${w},${base} Z`;

  // Contiguous runs of engine-off hours, shaded.
  const offRuns: [number, number][] = [];
  day.forEach((t, h) => {
    if (t.engineOn) return;
    const last = offRuns.at(-1);
    if (last && last[1] === h) last[1] = h + 1;
    else offRuns.push([h, h + 1]);
  });

  const pick = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onHour(Math.min(23, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 24))));
  };

  return (
    <div className="mt-6">
      <label className="sr-only" htmlFor="twin-hour">
        {t('chart.label')}
      </label>
      <input
        id="twin-hour"
        type="range"
        min={0}
        max={23}
        step={1}
        value={hour}
        onChange={(e) => onHour(Number(e.target.value))}
        aria-valuetext={t('hourLabel', { from: hh(hour), to: hh(hour + 1) })}
        className="peer sr-only"
      />
      <div
        ref={box}
        className="relative cursor-pointer touch-none rounded-2xl select-none peer-focus-visible:ring-2 peer-focus-visible:ring-btn peer-focus-visible:ring-offset-4"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons) pick(e);
        }}
        title={t('chart.help')}
      >
        <svg width={w} height={H} className="block" aria-hidden="true">
          {offRuns.map(([a, b]) => (
            <g key={a}>
              <rect x={x(a)} y={top - 14} width={x(b) - x(a)} height={base - top + 14} fill={TILE} />
              {x(b) - x(a) > 70 && (
                <text x={(x(a) + x(b)) / 2} y={top - 3} textAnchor="middle" fontSize={10.5} fill={MUTED}>
                  {t('chart.engineOff')}
                </text>
              )}
            </g>
          ))}
          <path d={steps((t) => t.a.gridKw)} fill={STROKE.elec} fillOpacity={0.22} />
          <path d={steps((t) => t.b.gridKw)} fill={STROKE.elec} fillOpacity={0.85} />
          <line x1={0} x2={w} y1={base} y2={base} stroke={LINE} />
          <rect x={x(hour)} y={top - 14} width={x(hour + 1) - x(hour)} height={base - top + 14} fill="none" stroke={INK} strokeWidth={1.5} rx={3} />
          {[0, 6, 12, 18, 24].map((h) => (
            <text key={h} x={Math.min(w - 16, Math.max(16, x(h)))} y={H - 5} textAnchor="middle" fontSize={11} fill={MUTED} className="tabular">
              {hh(h === 24 ? 0 : h)}
            </text>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-3 rounded-sm" style={{ background: STROKE.elec, opacity: 0.22 }} />
          {t('chart.saved')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-3 rounded-sm" style={{ background: STROKE.elec, opacity: 0.85 }} />
          {t('chart.b')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block size-3 rounded-sm" style={{ background: TILE, outline: `1px solid ${LINE}` }} />
          {t('chart.engineOff')}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------
// Page body
// ---------------------------------------------------------------------------------------------------------------

export function TwinView({ day }: { day: TwinHour[] }) {
  const t = useTranslations('method.twin');
  const [hour, setHour] = useState(15);
  const [playing, setPlaying] = useState(false);
  const [view, setView] = useState<'A' | 'B'>('B');

  // About one second per hour, looping. Only after the visitor presses play.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setHour((h) => (h + 1) % 24), 1000);
    return () => window.clearInterval(id);
  }, [playing]);

  const now = day[hour] as TwinHour;
  const scale = MAX_ARROW_PX / Math.max(1, maxFlowKw(day));
  const gridMax = Math.max(1, ...day.map((h) => h.a.gridKw));
  const saving = gridSaving(now);
  const choose = (h: number) => {
    setPlaying(false);
    setHour(h);
  };

  return (
    <section className="mt-10">
      <style>{CSS}</style>

      {/* 1. Now: the result first */}
      <div className="rounded-[22px] bg-white p-5 ring-1 ring-line sm:p-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">{t('now.hour')}</p>
            <p className="mt-1 font-display text-[56px] leading-none font-semibold tracking-[-0.04em] tabular sm:text-[80px]">{hh(hour)}</p>
            <p className="mt-2 text-muted tabular">
              {t('now.until', { to: hh(hour + 1) })}
              {' · '}
              {now.engineOn ? t('now.engineOn', { kw: formatKw(Math.round(now.b.flows.engineToSwitchboard), 'kWe') }) : t('now.engineOff')}
            </p>
            <Button size="sm" className="mt-5" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
              {playing ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
              {playing ? t('pause') : t('play')}
            </Button>
          </div>

          <div aria-live={playing ? 'off' : 'polite'}>
            <p className="text-[13px] font-semibold tracking-wide text-muted uppercase">{t('now.grid')}</p>
            {saving >= 0.005 ? (
              <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="font-display text-[56px] leading-none font-semibold tracking-[-0.04em] text-elec-text tabular sm:text-[80px]">
                  {formatPercent(saving)}
                </span>
                <span className="text-lg text-muted">{t('now.less')}</span>
              </p>
            ) : (
              <p className="mt-3 text-xl font-semibold">{t('now.same')}</p>
            )}
            <div className="mt-5 space-y-2.5">
              {(['a', 'b'] as const).map((k) => {
                const kw = now[k].gridKw;
                return (
                  <div key={k} className="grid grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm max-sm:grid-cols-[auto_minmax(0,1fr)_4rem]">
                    <span className="whitespace-nowrap text-muted">{t(k === 'a' ? 'sideA' : 'sideB')}</span>
                    <div className="h-3 overflow-hidden rounded-full bg-tile">
                      <div
                        className="twin-bar h-full rounded-full"
                        style={{ width: `${(kw / gridMax) * 100}%`, background: STROKE.elec, opacity: k === 'a' ? 0.35 : 1 }}
                      />
                    </div>
                    <span className="text-right font-semibold tabular">{formatKw(Math.round(kw))}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DayChart day={day} hour={hour} onHour={choose} />
      </div>

      {/* 2. The two sites. Phones: one at a time with a switch; md and up: side by side. */}
      <div className="mt-8 flex justify-center md:hidden">
        <div role="group" aria-label={t('view')} className="inline-flex rounded-full bg-white p-1 ring-1 ring-line">
          {(['A', 'B'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={view === s}
              onClick={() => setView(s)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium',
                view === s ? 'bg-ink text-white' : 'text-muted',
              )}
            >
              {t(s === 'A' ? 'sideA' : 'sideB')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-6 md:mt-8 md:grid-cols-2">
        {(['A', 'B'] as const).map((side) => {
          const site = side === 'A' ? now.a : now.b;
          return (
            <div key={side} className={cn('min-w-0 rounded-[22px] bg-white p-3 ring-1 ring-line sm:p-6', view !== side && 'hidden md:block')}>
              <h2 className="px-1 text-xl font-semibold tracking-tight sm:px-0">{t(side === 'A' ? 'sideA' : 'sideB')}</h2>
              <p className="mb-4 px-1 text-sm text-muted sm:px-0">{t(side === 'A' ? 'sideASub' : 'sideBSub')}</p>
              <Diagram side={side} site={site} hour={hour} engineOn={now.engineOn} scale={scale} />
              <Totals site={site} />
            </div>
          );
        })}
      </div>

      {/* 3. Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="font-medium text-ink">{t('legend.title')}</span>
        {(Object.keys(STROKE) as EnergyKind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-1.5 w-6 rounded-full" style={{ background: STROKE[k] }} />
            {t(`legend.${k}`)}
          </span>
        ))}
        <span className="basis-full">{t('legend.width')}</span>
      </div>

    </section>
  );
}
