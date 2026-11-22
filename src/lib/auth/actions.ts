'use server';
// Sign-in and sign-out server actions (#7). The sign-in page calls these; any header can render
// <SignOutButton/> from '@/components/auth/sign-out-button'.
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { siteConfig } from '@/config/site';
import { isSupabaseConfigured } from '@/lib/db/store';
import { setFakeUser } from '@/lib/db/fake/memory';
import { createUserClient } from '@/lib/supabase/server';
import { safeNextPath } from './paths';

export type MagicLinkState =
  | { status: 'sent'; email: string }
  | { status: 'error'; error: 'invalidEmail' | 'unavailable' | 'failed' | 'rateLimited' }
  | null;

/** The site's own origin, for the links Supabase puts in emails and OAuth redirects. */
async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
    return `${proto}://${host}`;
  }
  return siteConfig.url;
}

async function callbackUrl(next: string): Promise<string> {
  return `${await origin()}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Emails a magic link. Form fields: email, next. Use with useActionState. */
export async function sendMagicLink(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const email = z.email().safeParse(String(formData.get('email') ?? '').trim());
  if (!email.success) return { status: 'error', error: 'invalidEmail' };
  if (!isSupabaseConfigured()) return { status: 'error', error: 'unavailable' };

  const next = safeNextPath(formData.get('next')?.toString());
  const sb = await createUserClient();
  const { error } = await sb.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: await callbackUrl(next), shouldCreateUser: true },
  });
  if (error) {
    console.error('[auth] magic link failed', error.status, error.code);
    return { status: 'error', error: error.status === 429 ? 'rateLimited' : 'failed' };
  }
  return { status: 'sent', email: email.data };
}

/** Starts "Continue with Google". Form field: next. */
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNextPath(formData.get('next')?.toString());
  if (!isSupabaseConfigured()) redirect(`/sign-in?error=unavailable&next=${encodeURIComponent(next)}`);

  const sb = await createUserClient();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: await callbackUrl(next) },
  });
  if (error || !data.url) {
    console.error('[auth] Google sign-in failed', error?.status, error?.code);
    redirect(`/sign-in?error=google&next=${encodeURIComponent(next)}`);
  }
  redirect(data.url);
}

/** Signs out and goes home. */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = await createUserClient();
    await sb.auth.signOut();
  } else {
    setFakeUser(null);
  }
  redirect('/');
}
