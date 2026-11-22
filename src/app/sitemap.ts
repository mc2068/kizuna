// /sitemap.xml (#28): the public marketing pages and the tool. Sign-in, shared projects and the /twin
// placeholder are left out.
import type { MetadataRoute } from 'next';
import { ROUTES } from '@/config/routes';
import { siteConfig } from '@/config/site';

const LEFT_OUT = new Set(['/sign-in', '/twin', '/p/demo-djerba']);

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.filter((r) => r.access === 'public' && !LEFT_OUT.has(r.path)).map((r) => ({
    url: `${siteConfig.url}${r.path === '/' ? '' : r.path}`,
    changeFrequency: 'monthly',
    priority: r.path === '/' ? 1 : r.path === '/tool' ? 0.9 : 0.6,
  }));
}
