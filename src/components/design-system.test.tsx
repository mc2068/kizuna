// @vitest-environment jsdom
// Role 3: layout helpers and shared marketing blocks.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { sizeHotel } from '@/lib/engine';
import { ALL_REFERENCES as references } from './marketing/references';
import { isActive, isAdminPath, MAIN_NAV } from './layout/nav';
import { initials } from './layout/AdminShell';
import { coverage, percent } from './marketing/coverage';
import { RangeRail } from './marketing/RangeRail';
import { Rings } from './marketing/Rings';
import { Footnote } from './marketing/Footnote';
import { referenceHref, referenceNumber } from './marketing/references';
import { renderIntl, messages } from './test-utils';

const demo = sizeHotel({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });

describe('navigation helpers', () => {
  it('marks the current page and its children active', () => {
    expect(isActive('/case-study/djerba', '/case-study/djerba')).toBe(true);
    expect(isActive('/services', '/how-it-works')).toBe(false);
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/about', '/')).toBe(false);
  });
  it('recognises admin paths', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/admin/leads/L-1')).toBe(true);
    expect(isAdminPath('/administration')).toBe(false);
  });
  it('links to the five public sections in the prototype order', () => {
    expect(MAIN_NAV.map((n) => n.href)).toEqual(['/how-it-works', '/tool', '/services', '/case-study/djerba', '/about']);
  });
  it('makes initials for avatars', () => {
    expect(initials('Mohamed Chakroun')).toBe('MC');
    expect(initials('Gaith')).toBe('GA');
    expect(initials('  ')).toBe('?');
  });
});

describe('coverage (rings)', () => {
  it('matches the prototype for the Djerba demo: about 53% electricity, 58% hot water, 3% cooling', () => {
    const c = coverage(demo);
    expect(percent(c.elec)).toBe(53);
    expect(percent(c.heat)).toBe(58);
    expect(percent(c.cool)).toBe(3);
  });
  it('stays between 0 and 1 for every city and size', () => {
    for (const city of ['djerba', 'sousse', 'hammamet', 'tozeur'] as const) {
      for (const rooms of [50, 300, 800]) {
        const c = coverage(sizeHotel({ rooms, city, pool: rooms > 100, elecPrice: null }));
        for (const v of Object.values(c)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

describe('<RangeRail/>', () => {
  it('names the three values and puts the central dot at the right place', () => {
    const s = demo.scenarios;
    const { container } = renderIntl(
      <RangeRail title="Payback" favourable={s.favourable.paybackYears} central={s.central.paybackYears} unfavourable={s.unfavourable.paybackYears} unit="yrs" max={25} />,
    );
    const rail = screen.getByRole('img');
    expect(rail).toHaveAccessibleName('Payback: favourable 5 yrs, central 9 yrs, unfavourable 21.5 yrs.');
    const dot = container.querySelector('.rounded-full.ring-4') as HTMLElement;
    expect(dot.style.left).toBe('36%');
  });
  it('orders the ends low to high when favourable is the high end (savings)', () => {
    renderIntl(<RangeRail favourable={260000} central={200000} unfavourable={110000} unit="TND" max={300000} />);
    const labels = Array.from(document.querySelectorAll('[data-range-rail] span')).map((s) => s.textContent);
    expect(labels).toEqual(['110k TND', '260k TND', '200k TND']);
  });
});

describe('<Rings/>', () => {
  it('describes the three shares for screen readers and draws three arcs', () => {
    const { container } = renderIntl(<Rings elec={0.53} heat={0.58} cool={0.03} />);
    expect(screen.getByRole('img')).toHaveAccessibleName(/electricity 53%, hot water 58%, cooling 3%/);
    expect(container.querySelectorAll('[data-ring]')).toHaveLength(3);
  });
});

describe('<Footnote/> and references', () => {
  it('links to the reference anchor on /sources with its global number', () => {
    renderIntl(<Footnote id="doe-chp-engines" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/sources#ref-doe-chp-engines');
    expect(link).toHaveTextContent(String(referenceNumber('doe-chp-engines')));
    expect(link).toHaveAccessibleName(/^Source \d+: /);
  });
  it('fails loudly on an unknown id', () => {
    expect(() => referenceNumber('nope')).toThrow(/Unknown reference/);
  });
  it('has unique reference ids, and every link is https', () => {
    const ids = references.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of references) if (r.url) expect(r.url).toMatch(/^https:\/\//);
    expect(referenceHref('lowcarbonpower-tunisia')).toBe('/sources#ref-lowcarbonpower-tunisia');
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.(tsx?|json)$/.test(f) ? [p] : [];
  });
}

describe('site-wide rules', () => {
  // Role 3's files: components and the pages Gaith owns.
  const ROLE3_PAGES = ['page.tsx', 'how-it-works', 'services', 'case-study', 'about', 'sources', 'request-study', 'privacy', 'admin', 'dev'];
  const files = [
    ...sourceFiles(path.join(process.cwd(), 'src', 'components')),
    ...ROLE3_PAGES.flatMap((p) => {
      const full = path.join(process.cwd(), 'src', 'app', p);
      return p.endsWith('.tsx') ? [full] : sourceFiles(full);
    }),
  ].filter((f) => !f.endsWith('.test.tsx') && !f.endsWith('.test.ts') && !f.split(path.sep).join('/').includes('/admin/leads/'));

  it('every <Footnote id> used anywhere resolves to a reference', () => {
    const ids = new Set(references.map((r) => r.id));
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/<Footnote id="([a-z0-9-]+)"/g)) {
        expect(ids, `${path.relative(process.cwd(), f)} uses ${m[1]}`).toContain(m[1]);
      }
    }
  });

  it('the product name is written in one place only (siteConfig.name)', () => {
    const offenders = files
      .filter((f) => !f.replace(/\\/g, '/').endsWith('src/config/site.ts') && !f.replace(/\\/g, '/').endsWith('src/content/method.ts'))
      .filter((f) => readFileSync(f, 'utf8').includes('[PRODUCT NAME]'));
    expect(offenders.map((f) => path.relative(process.cwd(), f))).toEqual([]);
  });

  it('every message is a non-empty string', () => {
    const walk = (o: unknown, at: string): void => {
      if (typeof o === 'string') return void expect(o.trim(), at).not.toBe('');
      for (const [k, v] of Object.entries(o as object)) walk(v, `${at}.${k}`);
    };
    walk(messages, 'messages');
  });
});
