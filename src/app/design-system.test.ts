// Role 3: Contract 2 tokens, Tailwind mapping, and colour contrast (WCAG AA) for text pairs.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');
const root = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')));

const CONTRACT_2: Record<string, string> = {
  bg: '#fbfbfd', ink: '#1d1d1f', muted: '#6e6e73', faint: '#86868b', line: '#d2d2d7', tile: '#f5f5f7',
  link: '#0066cc', btn: '#0071e3', elec: '#f28c28', heat: '#e5484d', cool: '#0b8fc7',
  good: '#1f8a4c', maybe: '#b26b00', weak: '#8e8e93',
  'status-new': '#2563eb', 'status-contacted': '#a35f00', 'status-quoted': '#0f766e',
  'status-won': '#1d7f45', 'status-lost': '#6b6f72',
};

function token(name: string): string {
  const m = root.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!m) throw new Error(`--${name} missing from :root`);
  return m[1].toLowerCase();
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('Contract 2 tokens', () => {
  it.each(Object.entries(CONTRACT_2))('--%s is exactly %s', (name, value) => {
    expect(token(name)).toBe(value);
  });

  it('every lead status has a soft background', () => {
    for (const s of ['new', 'contacted', 'quoted', 'won', 'lost']) expect(token(`status-${s}-soft`)).toMatch(/^#/);
  });

  it('maps every Contract 2 colour into the Tailwind theme', () => {
    for (const name of Object.keys(CONTRACT_2)) expect(css).toContain(`--color-${name}: var(--${name});`);
  });

  it('maps the shadcn variables to Contract 2', () => {
    for (const [shadcn, ours] of [['background', 'bg'], ['foreground', 'ink'], ['primary', 'btn'], ['ring', 'btn'], ['border', 'line']]) {
      expect(root).toMatch(new RegExp(`--${shadcn}:\\s*var\\(--${ours}\\)`));
    }
  });

  it('sets the Keynote body text: 17px / 1.47, tabular numerals utility, reduced motion', () => {
    expect(css).toMatch(/font-size:\s*17px;\s*line-height:\s*1\.47/);
    expect(css).toContain('font-variant-numeric: tabular-nums');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});

describe('colour contrast for small text (WCAG AA, 4.5:1)', () => {
  const white = '#ffffff';
  const pairs: [string, string, string][] = [
    ['ink on bg', token('ink'), token('bg')],
    ['muted on bg', token('muted'), token('bg')],
    ['muted on tile', token('muted'), token('tile')],
    ['muted on white', token('muted'), white],
    ['link on bg', token('link'), token('bg')],
    ['white on btn', white, token('btn')],
    ['elec-text on bg', token('elec-text'), token('bg')],
    ['heat-text on bg', token('heat-text'), token('bg')],
    ['cool-text on bg', token('cool-text'), token('bg')],
    ['good-text on good-soft', token('good-text'), token('good-soft')],
    ['maybe-text on maybe-soft', token('maybe-text'), token('maybe-soft')],
    ['weak-text on weak-soft', token('weak-text'), token('weak-soft')],
    ['dark-muted on black', token('dark-muted'), '#000000'],
    ...(['new', 'contacted', 'quoted', 'won', 'lost'] as const).map(
      (s) => [`status-${s} on its soft background`, token(`status-${s}`), token(`status-${s}-soft`)] as [string, string, string],
    ),
  ];
  it.each(pairs)('%s', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('the raw energy colours are only for fills: elec fails on bg, which is why --elec-text exists', () => {
    expect(contrast(token('elec'), token('bg'))).toBeLessThan(4.5);
  });
});
