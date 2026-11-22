// Helpers for the tests that run against local Supabase (`pnpm test:db`). They are skipped by a
// plain `pnpm test`, so the suite stays green with no database.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import type { DemoUser } from '@/lib/db/contract.suite';
import { DEMO_USERS } from '@/lib/db/fake/seed';
import type { Supabase } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

/** True under `pnpm test:db`. */
export const runSupabaseTests = process.env.SUPABASE_TESTS === '1';

const PASSWORD = 'local-test-password';

type Local = { url: string; anonKey: string; serviceKey: string; dbUrl: string };

let local: Local | undefined;

/** Reads the URLs and keys of the running local stack and exposes them to the app code. */
export function localSupabase(): Local {
  if (local) return local;
  const s = JSON.parse(execSync('pnpm exec supabase status -o json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  local = { url: s.API_URL, anonKey: s.ANON_KEY, serviceKey: s.SERVICE_ROLE_KEY, dbUrl: s.DB_URL };
  process.env.NEXT_PUBLIC_SUPABASE_URL = local.url;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = local.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = local.serviceKey;
  return local;
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

export function anonClient(): Supabase {
  const { url, anonKey } = localSupabase();
  return createClient<Database>(url, anonKey, noSession);
}

export function serviceClient(): Supabase {
  const { url, serviceKey } = localSupabase();
  return createClient<Database>(url, serviceKey, noSession);
}

const clients = new Map<DemoUser, Supabase>();

/** A client signed in as a seeded demo user (the test gives them a password first). */
export async function clientFor(user: DemoUser): Promise<Supabase> {
  const cached = clients.get(user);
  if (cached) return cached;
  const { id, email } = DEMO_USERS[user];
  const { error: pwError } = await serviceClient().auth.admin.updateUserById(id, { password: PASSWORD });
  if (pwError) throw pwError;
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  clients.set(user, client);
  return client;
}

/** Back to supabase/seed.sql: drops every project and lead (and their notes, events and files). */
export async function resetData(): Promise<void> {
  const { dbUrl } = localSupabase();
  const db = new pg.Client({ connectionString: dbUrl });
  await db.connect();
  try {
    const { rows } = await db.query<{ name: string }>("select name from storage.objects where bucket_id = 'lead-files'");
    if (rows.length) await serviceClient().storage.from('lead-files').remove(rows.map((r) => r.name));
    await db.query('truncate public.projects, public.leads, public.study_request_attempts cascade');
    await db.query(readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8'));
  } finally {
    await db.end();
  }
}
