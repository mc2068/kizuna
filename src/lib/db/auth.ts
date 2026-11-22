import { db } from './fake-store';
import { ADMINS, toProfile } from './seed';
import type { CurrentUser, Profile } from './types';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return db().user;
}

/** Team members who can own leads. Admins only, like the RLS policy (others get []). */
export async function listAdmins(): Promise<Profile[]> {
  if (db().user?.role !== 'admin') return [];
  return ADMINS.map(toProfile);
}

export function requireUser(): CurrentUser {
  const user = db().user;
  if (!user) throw new Error('You must be signed in.');
  return user;
}

export function requireAdmin(): CurrentUser {
  const user = db().user;
  if (user?.role !== 'admin') throw new Error('Admins only.');
  return user;
}

export function isAdmin(): boolean {
  return db().user?.role === 'admin';
}
