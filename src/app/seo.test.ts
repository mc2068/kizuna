import { describe, expect, it } from 'vitest';
import robots from './robots';
import sitemap from './sitemap';

describe('robots and sitemap', () => {
  it('lists the public pages only', () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(urls).toContain('/tool');
    expect(urls).toContain('/case-study/djerba');
    for (const hidden of ['/admin', '/projects', '/sign-in', '/twin']) expect(urls).not.toContain(hidden);
  });

  it('keeps private paths out of search and points at the sitemap', () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.disallow).toEqual(expect.arrayContaining(['/admin', '/projects', '/p/']));
    expect(r.sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
