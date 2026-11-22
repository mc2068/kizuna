'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { sendMagicLink } from '@/lib/auth/actions';

export function MagicLinkForm({ next }: { next: string }) {
  const t = useTranslations('auth');
  const [state, action, pending] = useActionState(sendMagicLink, null);

  if (state?.status === 'sent') {
    return (
      <div role="status" className="mt-8 rounded-3xl bg-neutral-100 px-6 py-5">
        <p className="text-xl font-semibold">{t('sent.title')}</p>
        <p className="mt-1 text-neutral-600">{t('sent.body', { email: state.email })}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-3" noValidate>
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email" className="block text-sm font-medium">
        {t('email')}
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        aria-invalid={state?.status === 'error' && state.error === 'invalidEmail'}
        aria-describedby={state?.status === 'error' ? 'email-error' : undefined}
        className="h-12 w-full rounded-2xl border border-neutral-300 px-4 text-base outline-none focus:border-neutral-900"
      />
      {state?.status === 'error' && (
        <p id="email-error" role="alert" className="text-sm text-red-700">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button type="submit" disabled={pending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 px-6 font-medium text-white hover:bg-neutral-700 disabled:opacity-60">
        {pending ? t('sending') : t('sendLink')}
      </button>
    </form>
  );
}
