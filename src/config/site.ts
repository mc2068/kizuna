// The product name is not decided. Read it from here, never hard-code it, so it is swapped once.
export const siteConfig = {
  name: '[PRODUCT NAME]',
  description: 'Make your own energy. Only if it pays. Free trigeneration screening for Tunisian hotels.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'en',
} as const;
