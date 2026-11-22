// TEMPORARY (until #3/#4 merges): minimal root layout; Mohamed's scaffold and Gaith's
// <SiteHeader/>/<SiteFooter/> replace this file.
import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("common");
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          {t("skipToContent")}
        </a>
        <header className="sticky top-0 z-20 h-13 border-b border-black/10 bg-bg/80 backdrop-blur-xl">
          <nav className="mx-auto flex h-full max-w-[1068px] items-center justify-between px-4 text-sm sm:px-6">
            <Link href="/" className="font-display font-semibold text-ink">
              {siteConfig.name}
            </Link>
            <Link href="/tool" className="text-ink hover:text-link">
              {t("nav.tool")}
            </Link>
          </nav>
        </header>
        <NextIntlClientProvider>
          <main id="main">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
