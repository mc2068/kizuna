// Which OAuth providers the Supabase project has turned on (#28). The sign-in page shows "Continue with
// Google" only when Google is enabled, so a project without it never sends visitors to Supabase's raw
// "provider is not enabled" error. Read from Supabase's public auth settings, cached for a few minutes.

const TTL_MS = 5 * 60 * 1000;
let cached: { google: boolean; at: number } | undefined;

/** True when the Supabase project has Google sign-in enabled. False on the fake (no Supabase). */
export async function isGoogleEnabled(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.google;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    // Settings unreadable: keep the button; Supabase then reports any problem itself.
    if (!res.ok) return true;
    const body = (await res.json()) as { external?: { google?: boolean } };
    cached = { google: body.external?.google === true, at: Date.now() };
    return cached.google;
  } catch {
    return true;
  }
}

/** Tests only: forget the cached answer. */
export function resetProviderCacheForTests(): void {
  cached = undefined;
}
