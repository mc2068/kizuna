'use client';
// Asks the server for a short-lived URL (a 60 s signed Storage URL with Supabase, a data: URL in
// the fake store) only when clicked, then downloads it.
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { fileUrlAction } from '@/app/admin/leads/[id]/actions';

export function DownloadButton({ fileId, name }: { fileId: string; name: string }) {
  const t = useTranslations('lead.files');
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function download() {
    setFailed(false);
    startTransition(async () => {
      const url = await fileUrlAction(fileId);
      if (!url) {
        setFailed(true);
        return;
      }
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.rel = 'noopener';
      document.body.append(a);
      a.click();
      a.remove();
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={download}
        disabled={pending}
        aria-label={t('downloadLabel', { name })}
        className="inline-flex h-[30px] items-center rounded-[9px] border border-[#e4e4e0] bg-white px-3 text-[13px] font-medium hover:border-[#cfcfca] disabled:opacity-60"
      >
        {pending ? t('preparing') : t('download')}
      </button>
      {failed && (
        <span role="alert" className="mt-1 text-xs text-[#c4352c]">
          {t('downloadFailed')}
        </span>
      )}
    </span>
  );
}
