"use client";

// Every engine parameter with its three values and its source, folded away under the results.
// URLs in a source become links (new tab); the rest of the note stays as text.
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Assumption } from "@/lib/engine";
import { assumptionUnit, formatAssumptionValue, hasSourceLink, sourceParts } from "@/lib/present";

const SCENARIO_COLUMNS = ["favourable", "central", "unfavourable"] as const;

function Source({ text }: { text: string }) {
  const t = useTranslations("tool.results.assumptions");
  return (
    <>
      {sourceParts(text).map((part, i) =>
        part.kind === "link" ? (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            title={part.href}
            className="text-link underline-offset-2 hover:underline"
          >
            {part.label}
            <span className="sr-only"> {t("newTab")}</span>
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
      {/* Notes without a URL (estimates, standards) point to the method page, where each is explained. */}
      {hasSourceLink(text) ? null : (
        <>
          {" "}
          <Link href="/sources" className="whitespace-nowrap text-link underline-offset-2 hover:underline">
            {t("methodShort")}
          </Link>
        </>
      )}
    </>
  );
}

export function AssumptionsTable({ assumptions }: { assumptions: Assumption[] }) {
  const t = useTranslations("tool.results.assumptions");
  const words = { yes: t("yes"), no: t("no") };

  return (
    <details className="group mt-16 rounded-[28px] bg-tile">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[28px] px-6 py-6 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[rgba(0,125,250,.35)] sm:px-8 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-2xl font-semibold tracking-[-0.03em]">{t("summary")}</span>
          <span className="mt-1 block text-sm text-muted">{t("count", { count: assumptions.length })}</span>
        </span>
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-xl leading-none text-ink transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
        >
          +
        </span>
      </summary>

      <div className="px-6 pb-8 sm:px-8">
        <p className="max-w-3xl text-[15px] text-muted">{t("intro")}</p>
        <div className="relative mt-6 overflow-x-auto rounded-2xl bg-white" tabIndex={0} role="region" aria-label={t("caption")}>
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <caption className="sr-only">{t("caption")}</caption>
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="w-[24%] px-4 py-3 font-medium">
                  {t("name")}
                </th>
                {SCENARIO_COLUMNS.map((c) => (
                  <th key={c} scope="col" className="px-3 py-3 text-right font-medium">
                    {t(c)}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 font-medium">
                  {t("unit")}
                </th>
                <th scope="col" className="w-[38%] px-4 py-3 font-medium">
                  {t("source")}
                </th>
              </tr>
            </thead>
            <tbody>
              {assumptions.map((a) => (
                <tr key={a.name} className="border-b border-[#ececf0] align-top last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium">
                    {a.name}
                  </th>
                  {SCENARIO_COLUMNS.map((c) => (
                    <td
                      key={c}
                      className={`px-3 py-3 text-right whitespace-nowrap tabular-nums ${c === "central" ? "font-semibold" : "text-muted"}`}
                    >
                      {formatAssumptionValue(a[c], a.unit, words)}
                    </td>
                  ))}
                  <td className="px-3 py-3 whitespace-nowrap text-muted">{assumptionUnit(a.unit)}</td>
                  <td className="px-4 py-3 text-[13px] leading-relaxed text-muted">
                    <Source text={a.source} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-[15px]">
          <Link href="/sources" className="text-link hover:underline">
            {t("method")}
          </Link>
        </p>
      </div>
    </details>
  );
}
