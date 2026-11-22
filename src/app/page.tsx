// TEMPORARY (until #3/#4 merges): placeholder home; Gaith owns the real one.
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Home() {
  const t = await getTranslations("common.home");
  return (
    <section className="mx-auto max-w-[1068px] px-4 py-24 text-center sm:px-6">
      <h1 className="text-5xl font-semibold sm:text-7xl">{t("title")}</h1>
      <Link
        href="/tool"
        className="mt-10 inline-block rounded-full bg-btn px-6 py-3 text-white hover:bg-[#0077ed]"
      >
        {t("cta")}
      </Link>
    </section>
  );
}
