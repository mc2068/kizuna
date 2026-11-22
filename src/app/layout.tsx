import { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { siteConfig } from '@/config/site';
import { SiteHeaderView } from '@/components/layout/SiteHeader';
import { SiteHeaderWithUser } from '@/components/layout/SiteHeaderWithUser';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { fontClassName } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { siteName: siteConfig.name, type: 'website', locale: siteConfig.locale },
};

export const viewport: Viewport = { themeColor: '#fbfbfd' };

// Role 3: fonts (src/app/fonts.ts), <SiteHeader/> and <SiteFooter/> (hidden on /admin, where
// <AdminShell/> takes over), tooltips and toasts. The header's signed-in part streams in
// (cacheComponents), so every page keeps a static shell.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang={siteConfig.locale} className={`h-full antialiased ${fontClassName}`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <TooltipProvider>
            <Suspense fallback={<SiteHeaderView user={null} pathname="" />}>
              <SiteHeaderWithUser />
            </Suspense>
            <div className="flex-1">{children}</div>
            <Suspense fallback={null}>
              <SiteFooter />
            </Suspense>
            <Toaster />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
