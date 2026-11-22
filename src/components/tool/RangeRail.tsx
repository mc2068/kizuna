"use client";

// A result range on a rail, after the Keynote prototype's demo section: the span runs from the lower
// to the higher end of the favourable and unfavourable cases, the dot marks the central case, and the
// three values sit above their positions. Role 3 may ship a shared <RangeRail/>; until then the tool
// keeps its own here. Every label comes from @/lib/present.
import { useTranslations } from "next-intl";
import { formatValue, type FormattedRange, type Scale } from "@/lib/present";
import type { ScenarioResult } from "@/lib/engine";

type Tone = "dark" | "light";
type Size = "lg" | "sm";

type RangeRailProps = {
  range: FormattedRange;
  /** Engine field the range comes from; formats the axis ticks. */
  metric: keyof ScenarioResult;
  scale: Scale;
  /** Spoken name of the range, e.g. "Payback". */
  title: string;
  tone?: Tone;
  size?: Size;
};

// Written out in full so Tailwind's scanner sees every class.
const toneClass = {
  dark: {
    track: "bg-[#2c2c2e]",
    dot: "bg-[#f5f5f7] shadow-[0_0_0_4px_#000]",
    label: "text-[#86868b]",
    central: "text-[#f5f5f7] font-semibold",
    tick: "text-[#6e6e73]",
    spanFrom: "#48484a",
    spanTo: "#f5f5f7",
  },
  light: {
    track: "bg-[#e3e3e8]",
    dot: "bg-ink shadow-[0_0_0_3px_var(--tile)]",
    label: "text-faint",
    central: "text-ink font-semibold",
    tick: "text-faint",
    spanFrom: "#d2d2d7",
    spanTo: "#6e6e73",
  },
} as const;

const sizeClass = {
  lg: { box: "h-14", label: "text-xs", tick: "top-[44px] text-[11px]", track: "top-[27px]", span: "top-6 h-2", dot: "top-5 -ml-2 size-4", minGap: 10 },
  sm: { box: "h-12", label: "text-[11px]", tick: "top-[36px] text-[10px]", track: "top-[23px]", span: "top-[20px] h-2", dot: "top-[17px] -ml-[7px] size-3.5", minGap: 10 },
} as const;

/** Keeps a label inside the rail at either end instead of centring it on its position. */
function anchor(pct: number): string {
  if (pct < 6) return "translateX(0)";
  if (pct > 94) return "translateX(-100%)";
  return "translateX(-50%)";
}

export function RangeRail({ range, metric, scale, title, tone = "dark", size = "lg" }: RangeRailProps) {
  const t = useTranslations("tool.results");
  const c = toneClass[tone];
  const s = sizeClass[size];
  const pct = (v: number) => (Math.min(Math.max(v, 0), scale.max) / scale.max) * 100;

  const lo = pct(range.lowValue);
  const hi = pct(range.highValue);
  const mid = pct(range.centralValue);
  const width = Math.max(hi - lo, 0.75);
  const midInSpan = width > 0 ? ((mid - lo) / width) * 100 : 50;

  // Ends that would collide with the central label, or repeat it, are left to the value beside the rail.
  const ends = [
    { key: "favourable", value: range.favourableValue, text: range.favourable },
    { key: "unfavourable", value: range.unfavourableValue, text: range.unfavourable },
  ].filter((e) => e.text !== range.central && Math.abs(pct(e.value) - mid) >= s.minGap);

  const transition = "transition-all duration-500 ease-out motion-reduce:transition-none";

  return (
    <div
      role="img"
      aria-label={t("rail", {
        title,
        favourable: range.favourable,
        central: range.central,
        unfavourable: range.unfavourable,
        unit: range.unit,
      })}
      className={`relative ${s.box} min-w-0`}
    >
      <div aria-hidden="true">
        <div className={`absolute inset-x-0 ${s.track} h-0.5 rounded ${c.track}`} />
        <div
          className={`absolute ${s.span} rounded-full ${transition}`}
          style={{
            left: `${lo}%`,
            width: `${width}%`,
            background: `linear-gradient(90deg, ${c.spanFrom}, ${c.spanTo} ${midInSpan}%, ${c.spanFrom})`,
          }}
        />
        {ends.map((e) => (
          <span
            key={e.key}
            className={`absolute top-0 whitespace-nowrap tabular-nums ${s.label} ${c.label} ${transition}`}
            style={{ left: `${pct(e.value)}%`, transform: anchor(pct(e.value)) }}
          >
            {e.text}
          </span>
        ))}
        <span
          className={`absolute top-0 whitespace-nowrap tabular-nums ${s.label} ${c.central} ${transition}`}
          style={{ left: `${mid}%`, transform: anchor(mid) }}
        >
          {range.central}
        </span>
        <div className={`absolute ${s.dot} rounded-full ${c.dot} ${transition}`} style={{ left: `${mid}%` }} />
        {scale.ticks.map((tick, i) => (
          <span
            key={tick}
            className={`absolute whitespace-nowrap tabular-nums ${s.tick} ${c.tick}`}
            style={{
              left: `${pct(tick)}%`,
              transform: i === 0 ? "translateX(0)" : i === scale.ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {i === scale.ticks.length - 1 && range.highValue > scale.max
              ? t("over", { value: formatValue(metric, tick) })
              : formatValue(metric, tick)}
          </span>
        ))}
      </div>
    </div>
  );
}
