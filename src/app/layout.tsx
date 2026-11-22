import type { Metadata } from 'next';
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
      </body>
    </html>
  );
}
