// /robots.txt (#28): index the public pages, keep private and per-visitor paths out of search.
import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/projects', '/p/', '/api/', '/auth/', '/dev/'] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
