'use client';
// The status pill: a native select styled as a pill. Optimistic: the pill changes at once, the
// Server Action saves and refreshes the page (History gets the new event), and on failure the
// pill falls back to the saved status with an error.
import { useOptimistic, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { LEAD_STATUSES, type LeadStatus } from '@/lib/db/types';
import { changeStatusAction } from '@/app/admin/leads/[id]/actions';
import { STATUS_STYLE } from './format';

export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const t = useTranslations('lead');
  const [shown, setShown] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: LeadStatus) {
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await changeStatusAction(leadId, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <span className="inline-flex flex-col">
      <span className="relative inline-flex items-center">
        <select
          aria-label={t('header.status')}
          value={shown}
          onChange={(e) => change(e.target.value as LeadStatus)}
          aria-busy={pending}
          className={`h-7 cursor-pointer appearance-none rounded-full border-0 py-0 pr-7 pl-3 text-xs font-semibold outline-offset-2 transition-colors ${STATUS_STYLE[shown]}`}
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" className="pointer-events-none absolute right-2.5 h-2 w-2.5" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
      <span role="status" className="sr-only">
        {pending ? t('header.saving') : ''}
      </span>
      {error && (
        <span role="alert" className="mt-1 text-xs text-[#c4352c]">
          {t('header.failed', { error })}
        </span>
      )}
    </span>
  );
}
