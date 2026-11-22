import { getTranslations } from 'next-intl/server';
import type { LeadDetail } from '@/lib/db/types';
import { Avatar, Box } from './Box';
import { NoteComposer } from './NoteComposer';
import { formatDateTime, initials } from './format';

/** Notes: composer on top, then every note newest first (the data layer sorts them). */
export async function NotesTab({ lead, names }: { lead: LeadDetail; names: Record<string, string> }) {
  const t = await getTranslations('lead');
  return (
    <Box bodyClassName="">
      <NoteComposer leadId={lead.id} />
      <ol className="border-t border-[#e4e4e0]">
        {lead.notes.length === 0 && <li className="px-[18px] py-4 text-sm text-[#6b6f72]">{t('notes.empty')}</li>}
        {lead.notes.map((n) => {
          const who = names[n.authorId] ?? t('history.unknownPerson');
          return (
            <li key={n.id} className="flex gap-3 border-t border-[#efefec] px-[18px] py-4 first:border-t-0">
              <Avatar label={initials(who)} />
              <div className="min-w-0">
                <p className="text-[12.5px] text-[#6b6f72]">
                  <span className="mr-1.5 font-semibold text-[#17191a]">{who}</span>
                  <time dateTime={n.createdAt}>{formatDateTime(n.createdAt)}</time>
                </p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{n.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Box>
  );
}
