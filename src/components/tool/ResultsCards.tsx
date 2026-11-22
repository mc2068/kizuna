"use client";

// The headline option's results, the Keynote way: a dark panel, one range per row, each drawn as a
// <RangeRail/> (favourable / central / unfavourable, central marked) with the range written beside it.
import { useTranslations } from "next-intl";
import type { PlantOption } from "@/lib/engine";
import { formatRange, formatValue } from "@/lib/present";
import { RangeRail } from "./RangeRail";
import { METRICS, scalesFor, type MetricId } from "./results-metrics";

export function PlantLine({ option }: { option: PlantOption }) {
  const t = useTranslations("tool.results.plant");
  return option.chillerKwc > 0
    ? t("both", { kwe: option.engineKwe, kwc: option.chillerKwc })
    : t("engineOnly", { kwe: option.engineKwe });
}

function Extra({ id, option }: { id: MetricId; option: PlantOption }) {
  const t = useTranslations("tool.results.metrics");
  if (id === "payback") {
    const fte = formatRange(option.scenarios, "paybackYearsWithFte", t("payback.unit"));
    return (
      <>
        {t("payback.fte", { range: fte.text, central: fte.central })}{" "}
        <span className="mt-1 inline-block rounded-full border border-[#48484a] px-2 py-0.5 text-[11px] whitespace-nowrap text-[#d2d2d7]">
          {t("payback.fteFlag")}
        </span>
      </>
    );
  }
  if (id === "savings") {
    return t("savings.demandCharge", {
      value: formatValue("demandChargeSavingTnd", option.scenarios.favourable.demandChargeSavingTnd),
    });
  }
  return null;
}

export function ResultsCards({ option }: { option: PlantOption }) {
  const t = useTranslations("tool.results");
  const scales = scalesFor([option]);

  return (
    <div className="mt-12 rounded-[28px] bg-black px-5 pt-8 pb-7 text-[#f5f5f7] sm:px-10 sm:pt-12 sm:pb-10">
      <h3 className="max-w-3xl text-3xl leading-[1.08] font-semibold sm:text-[40px]">{t("cardsHeading")}</h3>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <span className="rounded-full border border-[#424245] px-3 py-1 text-[13px] text-[#d2d2d7] tabular-nums">
          {t("plant.engine", { kwe: option.engineKwe })}
        </span>
        <span className="rounded-full border border-[#424245] px-3 py-1 text-[13px] text-[#d2d2d7] tabular-nums">
          {option.chillerKwc > 0 ? t("plant.chiller", { kwc: option.chillerKwc }) : t("plant.noChiller")}
        </span>
      </div>

      <ul className="mt-8 border-t border-[#333]">
        {METRICS.map((m) => {
          const unit = t(`metrics.${m.id}.unit`);
          const range = formatRange(option.scenarios, m.key, unit);
          const title = t(`metrics.${m.id}.title`);
          const extra = <Extra id={m.id} option={option} />;
          return (
            <li
              key={m.id}
              className="grid gap-x-8 gap-y-3 border-b border-[#222] py-7 lg:grid-cols-[190px_1fr_260px] lg:items-center"
            >
              <div className="text-[15px] text-[#a1a1a6]">
                <b className="mb-1 block font-display text-[19px] leading-tight font-semibold tracking-[-0.02em] text-[#f5f5f7]">
                  {title}
                </b>
                {t(`metrics.${m.id}.description`)}
              </div>
              <div className="order-last lg:order-none">
                <RangeRail range={range} metric={m.key} scale={scales[m.id]} title={title} />
              </div>
              <div className="lg:text-right">
                <p className="font-display text-[34px] leading-none font-semibold tracking-[-0.045em] whitespace-nowrap tabular-nums sm:text-[38px] lg:text-[34px]">
                  {range.low === range.high ? range.central : t("range", { low: range.low, high: range.high })}
                  {unit ? (
                    <small className="ml-1 text-lg font-medium tracking-[-0.01em] text-[#a1a1a6]">{unit}</small>
                  ) : null}
                </p>
                <p className="mt-2 text-[13px] text-[#86868b] tabular-nums">
                  {t(`metrics.${m.id}.central`, { value: range.central })}
                </p>
              </div>
              {m.id === "payback" || m.id === "savings" ? (
                <p className="order-last text-[13px] leading-relaxed text-[#a1a1a6] tabular-nums lg:col-span-3 lg:col-start-1">
                  {extra}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-[#86868b]">{t("scenarioNote")}</p>
    </div>
  );
}
