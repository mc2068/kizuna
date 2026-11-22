// Server-side Supabase clients. Only src/lib/db and src/lib/auth use these; pages call '@/lib/db'.
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type Supabase = SupabaseClient<Database>;

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. See .env.example.`);
  return value;
}

const url = () => env('NEXT_PUBLIC_SUPABASE_URL');

let userClientOverride: (() => Supabase) | undefined;

/**
 * A client acting as the signed-in visitor (from the auth cookies), so every query runs under RLS.
 * In Server Components cookies cannot be written; the session refresh in src/proxy.ts handles that.
 */
export async function createUserClient(): Promise<Supabase> {
  if (userClientOverride) return userClientOverride();
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return createServerClient<Database>(url(), env('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: ignore, src/proxy.ts refreshes the session.
        }
      },
    },
  });
}

let serviceClient: Supabase | undefined;

/** Bypasses RLS. Only for writes no visitor may make directly: rows holding server-computed results. */
export function createServiceClient(): Supabase {
  serviceClient ??= createClient<Database>(url(), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

/** Tests only: act as a given client (signed in as a test user, or anonymous). */
export function setUserClientForTests(factory: (() => Supabase) | undefined): void {
  userClientOverride = factory;
}
