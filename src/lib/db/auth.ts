import { store } from './store';
import type { CurrentUser, Profile } from './types';

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return store().currentUser();
}

/** Team members who can own leads. Admins only, like the RLS policy (others get []). */
export async function listAdmins(): Promise<Profile[]> {
  return store().listAdmins();
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('You must be signed in.');
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') throw new Error('Admins only.');
  return user;
}

/** The signed-in admin, or null for everyone else. */
export async function currentAdmin(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.role === 'admin' ? user : null;
}
