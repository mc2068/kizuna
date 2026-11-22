import { cn } from '@/lib/utils';

export type FlowLabels = {
  label: string;
  gas: string; gasSub: string;
  engine: string;
  elec: string; elecSub: string;
  heat: string; heatSub: string;
  hotWater: string; hotWaterSub: string;
  chiller: string; chillerSub: string;
  cold: string; coldSub: string;
  loss: string; lossSub: string;
};
type NodeKey = 'gas' | 'engine' | 'elec' | 'heat' | 'hotWater' | 'chiller' | 'cold' | 'loss';
type Box = { x: number; y: number; w: number; h: number };

const STYLE: Record<NodeKey, { stroke: string; fill: string; text: string }> = {
  gas: { stroke: 'var(--ink)', fill: '#ffffff', text: 'var(--ink)' },
  engine: { stroke: 'var(--ink)', fill: 'var(--ink)', text: '#ffffff' },
  elec: { stroke: 'var(--elec)', fill: '#ffffff', text: 'var(--elec-text)' },
  heat: { stroke: 'var(--heat)', fill: '#ffffff', text: 'var(--heat-text)' },
  hotWater: { stroke: 'var(--heat)', fill: '#ffffff', text: 'var(--heat-text)' },
  chiller: { stroke: 'var(--cool)', fill: '#ffffff', text: 'var(--cool-text)' },
  cold: { stroke: 'var(--cool)', fill: '#ffffff', text: 'var(--cool-text)' },
  loss: { stroke: 'var(--faint)', fill: 'var(--tile)', text: 'var(--muted)' },
};

const LINKS: { from: NodeKey; to: NodeKey; color: string; dashed?: boolean }[] = [
  { from: 'gas', to: 'engine', color: 'var(--ink)' },
  { from: 'engine', to: 'elec', color: 'var(--elec)' },
  { from: 'engine', to: 'heat', color: 'var(--heat)' },
  { from: 'engine', to: 'loss', color: 'var(--faint)', dashed: true },
  { from: 'heat', to: 'hotWater', color: 'var(--heat)' },
  { from: 'heat', to: 'chiller', color: 'var(--heat)' },
  { from: 'chiller', to: 'cold', color: 'var(--cool)' },
];

// Wide layout (desktop): left to right.
const WIDE: Record<NodeKey, Box> = {
  gas: { x: 10, y: 160, w: 150, h: 72 },
  engine: { x: 215, y: 160, w: 150, h: 72 },
  elec: { x: 430, y: 30, w: 170, h: 72 },
  heat: { x: 430, y: 160, w: 170, h: 72 },
  loss: { x: 430, y: 290, w: 170, h: 72 },
  hotWater: { x: 660, y: 105, w: 150, h: 72 },
  chiller: { x: 660, y: 225, w: 150, h: 72 },
  cold: { x: 850, y: 225, w: 140, h: 72 },
};
// Tall layout (phones): top to bottom.
const TALL: Record<NodeKey, Box> = {
  gas: { x: 105, y: 8, w: 150, h: 64 },
  engine: { x: 105, y: 122, w: 150, h: 64 },
  elec: { x: 6, y: 250, w: 110, h: 72 },
  heat: { x: 125, y: 250, w: 110, h: 72 },
  loss: { x: 244, y: 250, w: 110, h: 72 },
  hotWater: { x: 20, y: 390, w: 150, h: 72 },
  chiller: { x: 190, y: 390, w: 150, h: 72 },
  cold: { x: 190, y: 520, w: 150, h: 72 },
};

function path(a: Box, b: Box, dir: 'x' | 'y'): string {
  if (dir === 'x') {
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, m = (x1 + x2) / 2;
    return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;
  }
  const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, m = (y1 + y2) / 2;
  return `M${x1},${y1} C${x1},${m} ${x2},${m} ${x2},${y2}`;
}

function Diagram({ boxes, dir, labels, short, width, height, className }: {
  boxes: Record<NodeKey, Box>; dir: 'x' | 'y'; labels: FlowLabels; short: Partial<Record<NodeKey, string>>;
  width: number; height: number; className: string;
}) {
  const sub = (k: NodeKey): string | undefined =>
    short[k] ?? (labels as Record<string, string>)[`${k}Sub`];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.label} className={cn('h-auto w-full', className)}>
      {LINKS.map((l) => (
        <path
          key={`${l.from}-${l.to}`}
          d={path(boxes[l.from], boxes[l.to], dir)}
          fill="none"
          stroke={l.color}
          strokeWidth={l.dashed ? 2 : 4}
          strokeLinecap="round"
          strokeDasharray={l.dashed ? '4 6' : undefined}
          className={l.dashed ? undefined : 'flow-dash'}
          opacity={l.dashed ? 0.8 : 0.9}
        />
      ))}
      {(Object.keys(boxes) as NodeKey[]).map((k) => {
        const b = boxes[k];
        const s = STYLE[k];
        const subText = sub(k);
        const cx = b.x + b.w / 2;
        return (
          <g key={k} data-node={k}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={16} fill={s.fill} stroke={s.stroke} strokeWidth={2} />
            <text x={cx} y={b.y + (subText ? b.h / 2 - 3 : b.h / 2 + 5)} textAnchor="middle" fontSize={dir === 'x' ? 15 : 13} fontWeight={600} fill={s.text}>
              {(labels as Record<string, string>)[k]}
            </text>
            {subText ? (
              <text x={cx} y={b.y + b.h / 2 + 16} textAnchor="middle" fontSize={dir === 'x' ? 12 : 11} fill={k === 'engine' ? '#ffffff' : 'var(--muted)'}>
                {subText}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/** Inline SVG energy flow: gas -> engine -> electricity, recovered heat (hot water, pool, chiller ->
 *  chilled water) and losses. A wide layout from 768 px, a tall one below. */
export function EnergyFlow({ labels, pct, caption, className }: {
  labels: FlowLabels;
  pct: { elec: number; heat: number; loss: number };
  caption?: React.ReactNode;
  className?: string;
}) {
  const short = { elec: `${pct.elec}%`, heat: `${pct.heat}%`, loss: `${pct.loss}%`, hotWater: labels.hotWaterSub, chiller: undefined, cold: labels.coldSub };
  return (
    <figure data-energy-flow className={cn('w-full', className)}>
      <Diagram boxes={WIDE} dir="x" labels={labels} short={{}} width={1000} height={380} className="hidden md:block" />
      <Diagram boxes={TALL} dir="y" labels={labels} short={short} width={360} height={600} className="mx-auto max-w-[420px] md:hidden" />
      {caption ? <figcaption className="mx-auto mt-6 max-w-[40rem] text-center text-[14px] text-muted">{caption}</figcaption> : null}
    </figure>
  );
}
