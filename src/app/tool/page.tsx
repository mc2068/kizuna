// /tool: the sizing tool. Server shell (heading, metadata); the configurator is a client component
// that runs the engine in the browser. Inputs come from the query string
// (/tool?rooms=300&city=djerba&pool=1&price=), so a linked result opens exactly as it was shared.
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Configurator } from "@/components/tool/Configurator";
import { ResultsSection } from "@/components/tool/ResultsSection";
import { ToolStateProvider } from "@/components/tool/ToolState";
import { DEFAULT_INPUTS, parseToolInputs } from "@/components/tool/url-state";
import type { SizingInput } from "@/lib/engine";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tool.meta");
  return { title: t("title"), description: t("description") };
}

function Tool({ initial }: { initial: SizingInput }) {
  return (
    <ToolStateProvider initial={initial}>
      <Configurator />
      <ResultsSection />
    </ToolStateProvider>
  );
}

async function ToolFromUrl({ searchParams }: { searchParams: PageProps<"/tool">["searchParams"] }) {
  return <Tool initial={parseToolInputs(await searchParams)} />;
}

export default async function ToolPage({ searchParams }: PageProps<"/tool">) {
  const t = await getTranslations("tool.page");
  return (
    <div className="mx-auto max-w-[1068px] px-4 pt-14 pb-32 sm:px-6 lg:pb-24">
      <h1 className="text-5xl font-semibold sm:text-6xl lg:text-7xl">{t("title")}</h1>
      <p className="mt-4 mb-12 max-w-2xl text-lg text-muted sm:text-xl">{t("intro")}</p>
      {/* The static shell shows the demo hotel (inert) until the URL's inputs stream in: same layout, no jump. */}
      <Suspense
        fallback={
          <div inert>
            <Tool initial={DEFAULT_INPUTS} />
          </div>
        }
      >
        <ToolFromUrl searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
