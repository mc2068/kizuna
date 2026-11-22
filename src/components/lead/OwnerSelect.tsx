'use client';
// Reassign the lead to another admin. Optimistic like the status pill.
import { useOptimistic, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { Profile } from '@/lib/db/types';
import { reassignAction } from '@/app/admin/leads/[id]/actions';
import { initials } from './format';

export function OwnerSelect({ leadId, ownerId, admins }: { leadId: string; ownerId: string | null; admins: Profile[] }) {
  const t = useTranslations('lead.header');
  const [shown, setShown] = useOptimistic(ownerId ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const owner = admins.find((a) => a.id === shown);

  function change(next: string) {
    if (!next) return;
    setError(null);
    startTransition(async () => {
      setShown(next);
      const result = await reassignAction(leadId, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col">
      <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[#e4e4e0] bg-white pr-2 pl-3 text-[13px] text-[#6b6f72] focus-within:outline-2 focus-within:outline-[#0f766e]">
        {t('owner')}
        <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-[#0f766e] text-[11px] font-semibold text-white">
          {owner ? initials(owner.fullName) : '–'}
        </span>
        <select
          value={shown}
          onChange={(e) => change(e.target.value)}
          aria-busy={pending}
          className="cursor-pointer bg-transparent font-semibold text-[#17191a] outline-none"
        >
          {!shown && <option value="">{t('unassigned')}</option>}
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.fullName}
            </option>
          ))}
        </select>
      </label>
      <span role="status" className="sr-only">
        {pending ? t('saving') : ''}
      </span>
      {error && (
        <span role="alert" className="mt-1 text-xs text-[#c4352c]">
          {t('failed', { error })}
        </span>
      )}
    </div>
  );
}
