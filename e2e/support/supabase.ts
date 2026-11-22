// Helpers for the tests that need local Supabase (`pnpm db:start`). Without the Supabase variables
// the build runs on the in-memory fake, where nobody can sign in, so those tests skip themselves.
import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export const onSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SKIP_REASON = 'Needs local Supabase: set NEXT_PUBLIC_SUPABASE_URL and the keys (e2e/README.md)';

/** Mailpit, where local Supabase delivers auth emails. */
const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

/** Seeded in supabase/seed.sql. */
export const SEEDED = {
  admin: 'mohamed@team.example',
  user: 'a@hotel.example',
} as const;

/** A new address per call, so parallel tests and repeated runs never share an inbox or a user. */
export function freshEmail(label = 'e2e'): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@hotel.example`;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is needed to sign in test users');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Signs `page` in as `email` without the inbox: asks Supabase for a one-time magic link token and
 * opens /auth/callback with it, the same route the emailed link ends on. Use it to reach a role
 * quickly; auth.spec.ts covers the real email round trip.
 */
export async function signInAs(page: Page, email: string, next = '/projects'): Promise<void> {
  const { data, error } = await serviceClient().auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;
  const params = new URLSearchParams({ token_hash: data.properties.hashed_token, type: 'magiclink', next });
  await page.goto(`/auth/callback?${params}`);
  await expect(page).toHaveURL(next);
}

type MailpitSummary = { ID: string };

/** The magic link in the latest email to `email`, waiting up to 15 s for it to arrive. */
export async function magicLinkFromInbox(email: string): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
        if (!search.ok) return undefined;
        const { messages } = (await search.json()) as { messages: MailpitSummary[] };
        if (!messages.length) return undefined;
        const message = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
        const { Text, HTML } = (await message.json()) as { Text: string; HTML: string };
        const body = Text || HTML.replaceAll('&amp;', '&');
        link = body.match(/https?:\/\/[^\s"'<>)]+\/auth\/v1\/verify[^\s"'<>)]+/)?.[0];
        return link;
      },
      { message: `magic link email to ${email} in Mailpit (${MAILPIT_URL})`, timeout: 15_000 },
    )
    .toBeTruthy();
  return link!;
}
