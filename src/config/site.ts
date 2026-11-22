// The product name is not decided. Read it from here, never hard-code it, so it is swapped once.
export const siteConfig = {
  name: '[PRODUCT NAME]',
  description: 'Make your own energy. Only if it pays. Free trigeneration screening for Tunisian hotels.',
  url: siteUrl(),
  locale: 'en',
} as const;

/**
 * The site's absolute origin, for metadata, the sitemap and links in emails. NEXT_PUBLIC_SITE_URL wins (set it
 * once there is a custom domain); on Vercel it falls back to the project's production URL, else localhost.
 */
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : 'http://localhost:3000';
}
