import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { NextIntlClientProvider } from 'next-intl';
import { siteConfig } from '@/config/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

// Role 3 adds <SiteHeader/> and <SiteFooter/> (src/components/layout/) and the fonts here.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang={siteConfig.locale} className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        {/* Vercel Web Analytics: cookie-free, no consent banner. Only on Vercel, where the
            /_vercel/insights script exists; elsewhere (local, CI) it would 404. */}
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  );
}
