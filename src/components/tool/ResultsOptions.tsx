"use client";

// Trigeneration beside the faster, smaller option (usually CHP only: hot water and pool heat, no
// chiller), shown only when the engine found one that pays back sooner. Both columns share axes.
import { useTranslations } from "next-intl";
import type { PlantOption } from "@/lib/engine";
import { formatRange, verdictTone, type VerdictTone } from "@/lib/present";
import { RangeRail } from "./RangeRail";
import { PlantLine } from "./ResultsCards";
import { COMPARE_RAILS, METRICS, metric, scalesFor, type MetricId } from "./results-metrics";

export const badgeTone: Record<VerdictTone, string> = {
  good: "bg-good-soft text-good",
  maybe: "bg-maybe-soft text-maybe",
  weak: "bg-weak-soft text-[#515154]",
};

const TEXT_ROWS: readonly MetricId[] = METRICS.map((m) => m.id).filter((id) => !COMPARE_RAILS.includes(id));

function OptionColumn({
  option,
  kind,
  scales,
}: {
  option: PlantOption;
  kind: "trigeneration" | "chpOnly" | "bestAny";
  scales: ReturnType<typeof scalesFor>;
}) {
  const t = useTranslations("tool");
  const tone = verdictTone(option.verdict);
  const fte = formatRange(option.scenarios, "paybackYearsWithFte", t("results.metrics.payback.unit"));
  const headline = kind === "trigeneration";

  return (
    <article
      aria-labelledby={`option-${kind}`}
      className={`rounded-[28px] bg-tile px-6 pt-7 pb-6 sm:px-8 ${headline ? "" : "ring-2 ring-btn"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold ${headline ? "bg-[#e3e3e8] text-muted" : "bg-btn text-white"}`}
        >
          {headline ? t("results.options.headline") : t("results.options.faster")}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold ${badgeTone[tone]}`}>
          {t(`verdict.${tone}`)}
        </span>
      </div>
      <h4 id={`option-${kind}`} className="mt-4 font-display text-[28px] leading-tight font-semibold tracking-[-0.035em]">
        {t(`results.options.${kind}`)}
      </h4>
      <p className="mt-1 text-sm text-muted">{t(`results.options.${kind}Note`)}</p>
      <p className="mt-3 text-[15px] font-medium tabular-nums">
        <PlantLine option={option} />
      </p>

      <dl className="mt-5">
        {COMPARE_RAILS.map((id) => {
          const m = metric(id);
          const unit = t(`results.metrics.${id}.unit`);
          const range = formatRange(option.scenarios, m.key, unit);
          const title = t(`results.metrics.${id}.title`);
          return (
            <div key={id} className="border-t border-[#e3e3e8] pt-4 pb-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[13px] text-muted">{title}</dt>
                <dd className="font-display text-xl font-semibold tracking-[-0.03em] tabular-nums">
                  {range.text}
                </dd>
              </div>
              <div className="mt-1">
                <RangeRail range={range} metric={m.key} scale={scales[id]} title={title} tone="light" size="sm" />
              </div>
            </div>
          );
        })}
        {TEXT_ROWS.map((id) => {
          const m = metric(id);
          const range = formatRange(option.scenarios, m.key, t(`results.metrics.${id}.unit`));
          return (
            <div key={id} className="flex items-baseline justify-between gap-3 border-t border-[#e3e3e8] py-2.5">
              <dt className="text-[13px] text-muted">{t(`results.metrics.${id}.title`)}</dt>
              <dd className="text-right text-[15px] font-medium tabular-nums">
                {range.text}
                <span className="block text-xs font-normal text-faint">
                  {t(`results.metrics.${id}.central`, { value: range.central })}
                </span>
              </dd>
            </div>
          );
        })}
        <div className="flex items-baseline justify-between gap-3 border-t border-[#e3e3e8] py-2.5">
          <dt className="text-[13px] text-muted">
            {t("results.options.fte")}
            <span className="block text-xs text-faint">{t("results.metrics.payback.fteFlag")}</span>
          </dt>
          <dd className="text-right text-[15px] font-medium tabular-nums">
            {fte.text}
            <span className="block text-xs font-normal text-faint">
              {t("results.metrics.payback.central", { value: fte.central })}
            </span>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ResultsOptions({ trigeneration, faster }: { trigeneration: PlantOption; faster: PlantOption }) {
  const t = useTranslations("tool.results.options");
  const scales = scalesFor([trigeneration, faster]);
  return (
    <section aria-labelledby="options-heading" className="mt-16">
      <h3 id="options-heading" className="text-3xl font-semibold sm:text-[40px]">
        {t("heading")}
      </h3>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t("intro")}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <OptionColumn option={trigeneration} kind="trigeneration" scales={scales} />
        <OptionColumn option={faster} kind={faster.chillerKwc > 0 ? "bestAny" : "chpOnly"} scales={scales} />
      </div>
    </section>
  );
}
