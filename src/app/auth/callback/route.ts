// Where the magic link and Google send the visitor back (#7). Exchanges the one-time code for a
// session cookie, then redirects to ?next= (same-origin paths only).
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNextPath, SIGN_IN_PATH } from '@/lib/auth/paths';
import { createUserClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get('next'));
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && (code || (tokenHash && type))) {
    const sb = await createUserClient();
    const { error } = code
      ? await sb.auth.exchangeCodeForSession(code)
      : await sb.auth.verifyOtp({ token_hash: tokenHash!, type: type! });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    console.error('[auth] callback failed', error.status, error.code);
  }

  const failed = new URL(SIGN_IN_PATH, request.url);
  failed.searchParams.set('error', 'link');
  failed.searchParams.set('next', next);
  return NextResponse.redirect(failed);
}
