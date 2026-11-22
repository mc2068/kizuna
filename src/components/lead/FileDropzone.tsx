'use client';
// Drag-and-drop (or pick) files to upload. Each file is checked here for instant feedback, sent
// to the upload route one at a time, and the page is refreshed so the list and History update.
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ACCEPT_ATTRIBUTE, fileProblem } from './file-rules';

type Message = { tone: 'info' | 'ok' | 'error'; text: string };

export function FileDropzone({ leadId }: { leadId: string }) {
  const t = useTranslations('lead.files');
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  async function upload(list: FileList | null) {
    const files = list ? Array.from(list) : [];
    if (!files.length || busy) return;
    setBusy(true);
    const out: Message[] = [];
    let uploaded = 0;
    for (const file of files) {
      const problem = fileProblem(file);
      if (problem) {
        out.push({ tone: 'error', text: t(problem === 'empty' ? 'emptyFile' : problem, { name: file.name }) });
        continue;
      }
      setMessages([...out, { tone: 'info', text: t('uploading', { name: file.name }) }]);
      const body = new FormData();
      body.append('file', file);
      try {
        const res = await fetch(`/admin/leads/${encodeURIComponent(leadId)}/files`, { method: 'POST', body });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (res.ok && json.ok) {
          uploaded += 1;
          out.push({ tone: 'ok', text: t('uploaded', { name: file.name }) });
        } else {
          out.push({ tone: 'error', text: t('failed', { name: file.name, error: json.error ?? res.statusText }) });
        }
      } catch (e) {
        out.push({ tone: 'error', text: t('failed', { name: file.name, error: e instanceof Error ? e.message : '' }) });
      }
    }
    setMessages(out);
    setBusy(false);
    if (input.current) input.current.value = '';
    if (uploaded) router.refresh();
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={`rounded-[14px] border-[1.5px] border-dashed px-6 py-7 text-center transition-colors ${
          over ? 'border-[#0f766e] bg-[#e9f5f3]' : 'border-[#c9cbc6] bg-[#fafaf8]'
        }`}
      >
        <svg aria-hidden="true" className="mx-auto" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round">
          <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
        <p className="mt-2 font-semibold">{t('drop')}</p>
        <p className="mt-0.5 text-[12.5px] text-[#6b6f72]">{t('dropHint')}</p>
        <label className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-full bg-[#17191a] px-4 text-[13.5px] font-medium text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0f766e] hover:bg-[#2b2e30]">
          {t('choose')}
          <input
            ref={input}
            type="file"
            multiple
            accept={ACCEPT_ATTRIBUTE}
            disabled={busy}
            onChange={(e) => void upload(e.target.files)}
            className="sr-only"
          />
        </label>
      </div>
      <ul aria-live="polite" className="mt-2 grid gap-1 text-[12.5px]">
        {messages.map((m, i) => (
          <li key={i} className={m.tone === 'error' ? 'text-[#c4352c]' : m.tone === 'ok' ? 'text-[#1d7f45]' : 'text-[#6b6f72]'}>
            {m.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
