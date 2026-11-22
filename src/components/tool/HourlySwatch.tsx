import type { Series } from './hourly-data';

/** The key of one hourly series in the legend and tooltip: a dashed line for demand, a square for supply. */
export function Swatch({ series }: { series: Series }) {
  if (series.kind === 'line') {
    return (
      <svg width="18" height="10" aria-hidden="true" className="shrink-0">
        <line x1="1" y1="5" x2="17" y2="5" stroke={series.color} strokeWidth="2" strokeDasharray="4 3" />
      </svg>
    );
  }
  return <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ background: series.color }} />;
}
