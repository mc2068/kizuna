import { describe, expect, it } from 'vitest';
import { accessFor, DEFAULT_AFTER_SIGN_IN, safeNextPath, signInPath } from './paths';

describe('safeNextPath', () => {
  it.each([
    ['/projects', '/projects'],
    ['/tool?city=djerba&rooms=200', '/tool?city=djerba&rooms=200'],
    ['/admin/leads/L-1047#files', '/admin/leads/L-1047#files'],
  ])('keeps the same-origin path %s', (raw, expected) => {
    expect(safeNextPath(raw)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['projects'],
    ['https://evil.example/'],
    ['//evil.example/'],
    ['/\\evil.example'],
    ['/\t/evil.example'],
    ['javascript:alert(1)'],
    ['/sign-in?next=/projects'],
    ['/auth/callback?code=x'],
  ])('falls back for %j', (raw) => {
    expect(safeNextPath(raw)).toBe(DEFAULT_AFTER_SIGN_IN);
  });
});

describe('signInPath', () => {
  it('carries a safe next path', () => {
    expect(signInPath('/tool?rooms=200')).toBe('/sign-in?next=%2Ftool%3Frooms%3D200');
  });
  it('drops an unsafe or missing next', () => {
    expect(signInPath('https://evil.example')).toBe('/sign-in');
    expect(signInPath()).toBe('/sign-in');
  });
});

describe('accessFor', () => {
  it.each([
    ['/', 'public'],
    ['/tool', 'public'],
    ['/p/demo-djerba', 'public'],
    ['/projects', 'signed-in'],
    ['/admin', 'admin'],
    ['/admin/leads/L-1047', 'admin'],
    ['/administrator', 'public'],
    ['/projectsx', 'public'],
  ])('%s is %s', (path, access) => {
    expect(accessFor(path)).toBe(access);
  });
});
