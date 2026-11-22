import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// STAND-IN for #3 (Mohamed owns this file).
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
