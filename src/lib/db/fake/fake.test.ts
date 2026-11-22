import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getCurrentUser } from '@/lib/db';
import { describeDataLayer } from '../contract.suite';
import { setStoreForTests } from '../store';
import { resetFakeDb, setFakeUser } from './memory';
import { DEMO_USERS } from './seed';
import { renderSeedSql } from './seed-sql';
import { fakeStore } from './store';

describe('fake store', () => {
  describeDataLayer({
    async reset() {
      setStoreForTests(fakeStore);
      resetFakeDb();
    },
    async signIn(user) {
      setFakeUser(user ? DEMO_USERS[user] : null);
    },
    fileUrl: /^data:application\/pdf;base64,/,
  });

  it('starts signed in as the demo admin so every page has data in development', async () => {
    setStoreForTests(fakeStore);
    resetFakeDb();
    expect(await getCurrentUser()).toMatchObject({ id: DEMO_USERS.mohamed.id, role: 'admin' });
  });
});

describe('supabase/seed.sql', () => {
  it('matches the demo data (run `pnpm db:seed` after changing seed.ts or the engine)', () => {
    const onDisk = readFileSync(new URL('../../../../supabase/seed.sql', import.meta.url), 'utf8');
    expect(onDisk === renderSeedSql(), 'supabase/seed.sql is stale: run `pnpm db:seed`').toBe(true);
  });
});
