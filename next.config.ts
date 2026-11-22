import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // react-pdf runs on the server only (#23): keep it out of the bundle and
  // ship the report fonts with the two report routes.
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/projects/*/report': ['./src/lib/report/fonts/**'],
    '/api/share/*/report': ['./src/lib/report/fonts/**'],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
