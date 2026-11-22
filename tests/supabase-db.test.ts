// Contract 3 against local Supabase: the same suite the fake passes. Run with `pnpm test:db`.
import { afterAll, beforeAll, describe } from 'vitest';
import { describeDataLayer } from '@/lib/db/contract';
import { setStoreForTests } from '@/lib/db/store';
import { supabaseStore } from '@/lib/db/supabase/store';
import { setUserClientForTests } from '@/lib/supabase/server';
import { anonClient, clientFor, localSupabase, resetData, runSupabaseTests } from './supabase/local';

describe.runIf(runSupabaseTests)('supabase store', () => {
  beforeAll(() => {
    localSupabase();
    setStoreForTests(supabaseStore);
  });
  afterAll(() => {
    setStoreForTests(undefined);
    setUserClientForTests(undefined);
  });

  describeDataLayer({
    reset: resetData,
    async signIn(user) {
      const client = user ? await clientFor(user) : anonClient();
      setUserClientForTests(() => client);
    },
    fileUrl: /^http:\/\/127\.0\.0\.1:54321\/storage\/v1\/object\/sign\/lead-files\//,
  });
});
