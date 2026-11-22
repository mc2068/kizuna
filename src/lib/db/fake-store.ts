// In-memory state for the FAKE data layer (module-level arrays). Lives for one server
// process: a restart of `pnpm dev` resets it. #6 replaces it with Supabase.
// setFakeUser and resetFakeDb are for tests and local experiments only: they are not
// exported from '@/lib/db' and disappear with the fake.
import { FAKE_USERS, seedTables, type FakeTables } from './seed';
import type { CurrentUser } from './types';

export { FAKE_USERS };

type Store = FakeTables & { user: CurrentUser | null };

/**
 * Who is signed in at start. FAKE_DB_USER=admin | user | none overrides it. Default: the demo
 * admin in development and tests, nobody in production builds (a Vercel preview must not show
 * the admin area to every visitor).
 */
function initialUser(): CurrentUser | null {
  const choice = process.env.FAKE_DB_USER ?? (process.env.NODE_ENV === 'production' ? 'none' : 'admin');
  if (choice === 'admin') return FAKE_USERS.mohamed;
  if (choice === 'user') return FAKE_USERS.userA;
  return null;
}

function fresh(): Store {
  const tables = seedTables();
  return { ...tables, user: initialUser() };
}

// Kept on globalThis so Next.js dev reloads of this module do not wipe the data.
const g = globalThis as unknown as { __kizunaFakeDb?: Store };

export function db(): Store {
  g.__kizunaFakeDb ??= fresh();
  return g.__kizunaFakeDb;
}

/** Reset to the seed data and the initial user (see initialUser). */
export function resetFakeDb(): void {
  g.__kizunaFakeDb = fresh();
}

/** Who the fake thinks is signed in. Default: the demo admin, so every page has data. */
export function setFakeUser(user: CurrentUser | null): void {
  db().user = user;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
