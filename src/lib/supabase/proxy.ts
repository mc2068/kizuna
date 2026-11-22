// Session refresh for src/proxy.ts. Supabase access tokens last an hour; Server Components cannot
// write cookies, so the proxy refreshes them on every request and passes them on to the render.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { CurrentUser } from '@/lib/db/types';
import type { Database } from './types';

export async function updateSession(request: NextRequest): Promise<{
  /** Pass this on (or copy its cookies): it carries the refreshed session. */
  response: NextResponse;
  /** Who is signed in, with the role from profiles (only looked up when `withRole`). */
  user: CurrentUser | null;
}> {
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });
  // getUser() validates the token with Supabase Auth (and refreshes it); never trust getSession() here.
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { response, user: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return { response, user: { id: data.user.id, email: data.user.email ?? '', role: profile?.role ?? 'user' } };
}
