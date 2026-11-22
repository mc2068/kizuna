import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/config/routes';
import { loadMessages } from './request';
import { NAMESPACES } from './namespaces';

describe('messages/en', () => {
  it('loads every namespace, merged by name', async () => {
    const messages = await loadMessages('en');
    expect(Object.keys(messages).sort()).toEqual([...NAMESPACES].sort());
  });

  it('has a title for every page', async () => {
    const { common } = await loadMessages('en');
    for (const r of ROUTES) expect(common.pages[r.key], r.path).toBeTruthy();
  });
});
