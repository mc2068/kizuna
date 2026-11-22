// Files: drop zone, then the lead's files in the private 'lead-files' bucket. Downloads go
// through a short-lived signed URL, created on demand for an admin.
import { getTranslations } from 'next-intl/server';
import type { LeadDetail } from '@/lib/db/types';
import { Avatar, Box } from './Box';
import { FileDropzone } from './FileDropzone';
import { DownloadButton } from './DownloadButton';
import { extension, formatBytes, formatDate, initials } from './format';

const BADGE: Record<string, string> = {
  pdf: 'bg-[#d9483b]',
  xlsx: 'bg-[#1d7f45]',
  docx: 'bg-[#2b5fb8]',
  png: 'bg-[#7c5a2b]',
  jpg: 'bg-[#7c5a2b]',
  jpeg: 'bg-[#7c5a2b]',
  webp: 'bg-[#7c5a2b]',
  heic: 'bg-[#7c5a2b]',
};

export async function FilesTab({ lead, names }: { lead: LeadDetail; names: Record<string, string> }) {
  const t = await getTranslations('lead');
  return (
    <Box
      title={t('files.title')}
      subtitle={t('files.subtitle')}
      bodyClassName=""
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f3f1] px-2.5 py-1 text-xs text-[#6b6f72]">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          {t('files.private')}
        </span>
      }
    >
      <div className="p-[18px]">
        <FileDropzone leadId={lead.id} />
      </div>
      {lead.files.length === 0 ? (
        <p className="border-t border-[#efefec] px-[18px] py-4 text-sm text-[#6b6f72]">{t('files.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-y border-[#efefec] text-left text-xs text-[#6b6f72]">
                <th scope="col" className="px-[18px] py-2.5 font-medium">{t('files.name')}</th>
                <th scope="col" className="px-[18px] py-2.5 font-medium">{t('files.size')}</th>
                <th scope="col" className="px-[18px] py-2.5 font-medium">{t('files.by')}</th>
                <th scope="col" className="px-[18px] py-2.5 font-medium">{t('files.date')}</th>
                <th scope="col" className="px-[18px] py-2.5"><span className="sr-only">{t('files.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {lead.files.map((f) => {
                const ext = extension(f.name);
                const who = names[f.uploadedBy] ?? t('history.unknownPerson');
                return (
                  <tr key={f.id} className="border-b border-[#efefec] last:border-b-0">
                    <td className="px-[18px] py-3">
                      <span className="flex items-center gap-2.5 font-medium">
                        <span aria-hidden="true" className={`grid h-[34px] w-[30px] flex-none place-items-center rounded-[5px] text-[8.5px] font-bold text-white uppercase ${BADGE[ext] ?? 'bg-[#6b6f72]'}`}>
                          {ext.slice(0, 4) || '?'}
                        </span>
                        <span className="[overflow-wrap:anywhere]">{f.name}</span>
                      </span>
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap text-[#6b6f72] tabular-nums">{formatBytes(f.size)}</td>
                    <td className="px-[18px] py-3">
                      <span className="inline-flex items-center gap-2">
                        <Avatar label={initials(who)} />
                        {who}
                      </span>
                    </td>
                    <td className="px-[18px] py-3 whitespace-nowrap text-[#6b6f72]">
                      <time dateTime={f.createdAt}>{formatDate(f.createdAt)}</time>
                    </td>
                    <td className="px-[18px] py-3 text-right">
                      <DownloadButton fileId={f.id} name={f.name} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Box>
  );
}
