// /sign-in (#7): email magic link and "Continue with Google". Accepts ?next= (same-origin path to
// return to) and ?error= (set by the callback or the Google action). Plain Tailwind for now:
// swap in Role 3's Button/Input/Card once the design system (#4) lands.
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { signInWithGoogle } from '@/lib/auth/actions';
import { safeNextPath } from '@/lib/auth/paths';
import { getCurrentUser } from '@/lib/db';
import { MagicLinkForm } from './magic-link-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('title') };
}

// Reads ?next= and the session, so it renders per request (it is a small page, no shell needed).
export const instant = false;

const ERRORS = ['link', 'google', 'unavailable'] as const;

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNextPath(first(params.next));
  const errorParam = first(params.error);
  const error = ERRORS.find((e) => e === errorParam);
  const t = await getTranslations('auth');
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-24">
      <h1 className="text-5xl font-semibold tracking-tight">{t('title')}</h1>

      {user ? (
        <div className="mt-8 space-y-4">
          <p className="text-lg text-neutral-600">{t('signedInAs', { email: user.email })}</p>
          <Link href={next} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 px-6 font-medium text-white hover:bg-neutral-700">
            {t('continue')}
          </Link>
          <SignOutButton />
        </div>
      ) : (
        <>
          <p className="mt-4 text-lg text-neutral-600">{t('lead')}</p>
          {error && (
            <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {t(`errors.${error}`)}
            </p>
          )}

          <MagicLinkForm next={next} />

          <div className="my-6 flex items-center gap-4 text-sm text-neutral-500">
            <span className="h-px flex-1 bg-neutral-200" />
            {t('or')}
            <span className="h-px flex-1 bg-neutral-200" />
          </div>

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-neutral-300 bg-white px-6 font-medium hover:bg-neutral-50">
              <GoogleMark />
              {t('google')}
            </button>
          </form>

          <p className="mt-8 text-sm text-neutral-500">
            {t.rich('consent', {
              privacy: (chunks) => (
                <Link href="/privacy" className="underline underline-offset-4">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </>
      )}
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}
