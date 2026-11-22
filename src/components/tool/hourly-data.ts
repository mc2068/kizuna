// Pure helpers for the hourly dashboard (#11): which series each tab draws, a y scale shared by both
// seasons (so the summer/winter toggle shows the real change in size), and the day totals the
// captions quote. Input is Contract 1's HourRow (headline option, central case).
import type { HourRow } from "@/lib/engine";

export const SEASONS = ["summer", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const HOURLY_TABS = ["elec", "heat", "cool"] as const;
export type HourlyTab = (typeof HOURLY_TABS)[number];

export type SeriesKey = Exclude<keyof HourRow, "hour">;

export type Series = {
  key: SeriesKey;
  /** "area" is a filled supply series (stacked on electricity), "line" a dashed demand line. */
  kind: "area" | "line";
  /** A Contract 2 token, never a hex value. */
  color: string;
};

/** Supply first (drawn underneath), demand line last (drawn on top). */
export const TAB_SERIES: Record<HourlyTab, Series[]> = {
  elec: [
    { key: "engineElec", kind: "area", color: "var(--elec)" },
    { key: "gridImport", kind: "area", color: "var(--faint)" },
    { key: "elecDemand", kind: "line", color: "var(--ink)" },
  ],
  heat: [
    { key: "recoveredHeat", kind: "area", color: "var(--heat)" },
    { key: "heatDemand", kind: "line", color: "var(--ink)" },
  ],
  cool: [
    { key: "chillerCool", kind: "area", color: "var(--cool)" },
    { key: "coolDemand", kind: "line", color: "var(--ink)" },
  ],
};

/** Every column of the screen-reader table, grouped by need. */
export const TABLE_COLUMNS: SeriesKey[] = [
  "elecDemand",
  "engineElec",
  "gridImport",
  "heatDemand",
  "recoveredHeat",
  "coolDemand",
  "chillerCool",
];

/** X axis ticks: every 6 hours, plus the last hour. */
export const HOUR_TICKS = [0, 6, 12, 18, 23];

/** 7 -> "07" (the message adds ":00"). */
export function padHour(hour: number): string {
  return String(hour).padStart(2, "0");
}

/** Gridlines on the y axis, above zero. */
const Y_STEPS = 4;

/**
 * Y scale for a tab, shared by both seasons: the highest value it draws (electricity stacks engine + grid),
 * rounded up to Y_STEPS even steps of a round number (1, 1.5, 2, 2.5, 3, 4, 5, 6 or 8 x 10^n).
 */
export function tabScale(hourly: Record<Season, HourRow[]>, tab: HourlyTab): { max: number; ticks: number[] } {
  let max = 0;
  for (const season of SEASONS) {
    for (const r of hourly[season]) {
      const value =
        tab === "elec"
          ? Math.max(r.engineElec + r.gridImport, r.elecDemand)
          : tab === "heat"
            ? Math.max(r.recoveredHeat, r.heatDemand)
            : Math.max(r.chillerCool, r.coolDemand);
      if (value > max) max = value;
    }
  }
  const rough = Math.max(max, 1) / Y_STEPS;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = magnitude * ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * magnitude >= rough) ?? 10);
  const ticks = Array.from({ length: Y_STEPS + 1 }, (_, i) => i * step);
  return { max: ticks[Y_STEPS], ticks };
}

function sum(rows: HourRow[], value: (r: HourRow) => number): number {
  return rows.reduce((total, r) => total + value(r), 0);
}

function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export type DayFigures = {
  /** Share of the day's electricity (engine + grid) made by the engine, %. */
  engineShare: number;
  /** First hour the engine runs, or null if it stays off all day. */
  engineStart: number | null;
  /** Share of the day's hot-water and pool heat covered by recovered heat, %. */
  heatShare: number;
  /** Share of the day's cooling made by the absorption chiller, %. */
  coolShare: number;
};

export function dayFigures(rows: HourRow[]): DayFigures {
  const engine = sum(rows, (r) => r.engineElec);
  const firstRun = rows.find((r) => r.engineElec > 0);
  return {
    engineShare: percent(engine, engine + sum(rows, (r) => r.gridImport)),
    engineStart: firstRun ? firstRun.hour : null,
    // Recovered heat serves hot water first and sends the rest to the absorption chiller (engine/model.mjs operate()).
    heatShare: percent(
      sum(rows, (r) => Math.min(r.recoveredHeat, r.heatDemand)),
      sum(rows, (r) => r.heatDemand),
    ),
    coolShare: percent(
      sum(rows, (r) => r.chillerCool),
      sum(rows, (r) => r.coolDemand),
    ),
  };
}
