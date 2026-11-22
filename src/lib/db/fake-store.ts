// In-memory state for the FAKE data layer (module-level arrays). Lives for one server
// process: a restart of `pnpm dev` resets it. #6 replaces it with Supabase.
// setFakeUser and resetFakeDb are for tests and local experiments only: they are not
// exported from '@/lib/db' and disappear with the fake.
import { FAKE_USERS, seedTables, type FakeTables } from './seed';
import type { CurrentUser, Project } from './types';

export { FAKE_USERS };

type Store = FakeTables & { projects: Project[]; user: CurrentUser | null };

function fresh(): Store {
  return { ...seedTables(), projects: [], user: FAKE_USERS.mohamed };
}

// Kept on globalThis so Next.js dev reloads of this module do not wipe the data.
const g = globalThis as unknown as { __kizunaFakeDb?: Store };

export function db(): Store {
  g.__kizunaFakeDb ??= fresh();
  return g.__kizunaFakeDb;
}

/** Reset to the seed data, signed in as the demo admin (Mohamed). */
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
