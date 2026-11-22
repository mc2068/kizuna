'use client';
import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { addNoteAction } from '@/app/admin/leads/[id]/actions';

export function NoteComposer({ leadId }: { leadId: string }) {
  const t = useTranslations('lead.notes');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const field = useRef<HTMLTextAreaElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError(t('required'));
      field.current?.focus();
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addNoteAction(leadId, body);
      if (result.ok) setBody('');
      else setError(t('failed', { error: result.error }));
    });
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="lead-note" className="sr-only">
        {t('label')}
      </label>
      <textarea
        id="lead-note"
        ref={field}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
        maxLength={5000}
        placeholder={t('placeholder')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'lead-note-error' : undefined}
        className="block min-h-[96px] w-full resize-y rounded-t-[14px] px-[18px] py-4 text-sm outline-none placeholder:text-[#9a9ea1] focus-visible:bg-[#fafaf8]"
      />
      <div className="flex flex-wrap items-center gap-3 border-t border-[#efefec] py-2.5 pr-3 pl-[18px] text-[12.5px] text-[#6b6f72]">
        <span>{t('visibility')}</span>
        {error && (
          <span id="lead-note-error" role="alert" className="text-[#c4352c]">
            {error}
          </span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto inline-flex h-9 items-center rounded-full bg-[#17191a] px-4 text-[13.5px] font-medium text-white hover:bg-[#2b2e30] disabled:opacity-60"
        >
          {pending ? t('adding') : t('add')}
        </button>
      </div>
    </form>
  );
}
