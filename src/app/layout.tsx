// STAND-IN for #3 (Mohamed owns this file). Uses Role 3's fonts, header and footer.
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site';
import { getCurrentUser } from '@/lib/db';
import { fontClassName } from './fonts';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common.meta');
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: t('title', { name: siteConfig.name }), template: `%s · ${siteConfig.name}` },
    description: t('description'),
    openGraph: { siteName: siteConfig.name, type: 'website', locale: 'en' },
  };
}

export const viewport: Viewport = { themeColor: '#fbfbfd' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={fontClassName}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <TooltipProvider>
            <SiteHeader user={user} />
            {children}
            <SiteFooter />
            <Toaster />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
