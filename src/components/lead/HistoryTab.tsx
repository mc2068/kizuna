// History: the lead_events timeline, newest first. Events are logged by database triggers
// (created, status, owner, note, file) and by the server (email), so this only reads them.
import { getTranslations } from 'next-intl/server';
import { LEAD_STATUSES, type LeadDetail, type LeadEvent, type LeadEventKind, type LeadStatus } from '@/lib/db/types';
import { Box } from './Box';
import { formatDateTime, STATUS_STYLE } from './format';

const ICON: Record<LeadEventKind, string> = {
  created: 'M12 5v14M5 12h14',
  status: 'M4 12h12m0 0-4-4m4 4-4 4M20 5v14',
  owner: 'M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0M2.5 20a6.5 6.5 0 0 1 13 0M17 8l2 2 3-3',
  email: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2m-2 2 9 6 9-6',
  note: 'M4 20h4L19 9l-4-4L4 16z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
};

const ICON_STYLE: Record<LeadEventKind, string> = {
  created: 'bg-[#f3f3f1] text-[#6b6f72] border-[#e4e4e0]',
  status: 'bg-[#ddf1ee] text-[#0f766e] border-transparent',
  owner: 'bg-[#f3f3f1] text-[#6b6f72] border-[#e4e4e0]',
  email: 'bg-[#e8effd] text-[#2563eb] border-transparent',
  note: 'bg-[#f3f3f1] text-[#6b6f72] border-[#e4e4e0]',
  file: 'bg-[#f4ecdf] text-[#7c5a2b] border-transparent',
};

const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
const asStatus = (v: unknown): LeadStatus | undefined => (LEAD_STATUSES.includes(v as LeadStatus) ? (v as LeadStatus) : undefined);

export async function HistoryTab({ lead, names }: { lead: LeadDetail; names: Record<string, string> }) {
  const t = await getTranslations('lead');
  const person = (id: unknown) => (str(id) && names[id as string]) || t('history.unknownPerson');
  const actor = (e: LeadEvent) => (e.actorId ? person(e.actorId) : t('history.system'));
  const pill = (s: LeadStatus | undefined) => (
    <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${s ? STATUS_STYLE[s] : ''}`}>{s ? t(`status.${s}`) : '–'}</span>
  );
  const b = (chunks: React.ReactNode) => <b className="font-semibold">{chunks}</b>;

  function describe(e: LeadEvent): React.ReactNode {
    const d = e.data;
    switch (e.kind) {
      case 'created':
        return t('history.created', { source: str(d.source) ?? 'website form' });
      case 'status':
        return t.rich('history.status', { actor: actor(e), b, from: () => pill(asStatus(d.from)), to: () => pill(asStatus(d.to)) });
      case 'owner':
        return t.rich('history.owner', { actor: actor(e), from: person(d.from), to: person(d.to), b });
      case 'email':
        return e.actorId
          ? t('history.emailBy', { actor: actor(e), to: str(d.to) ?? '', subject: str(d.subject) ?? '' })
          : t('history.email', { to: str(d.to) ?? '', subject: str(d.subject) ?? '' });
      case 'note':
        return t.rich('history.note', { actor: actor(e), b });
      case 'file':
        return t.rich('history.file', { actor: actor(e), name: str(d.name) ?? t('history.fileUnnamed'), b });
    }
  }

  return (
    <Box title={t('history.title')} subtitle={t('history.subtitle')} bodyClassName="px-[18px] py-1.5">
      {lead.events.length === 0 ? (
        <p className="py-3 text-sm text-[#6b6f72]">{t('history.empty')}</p>
      ) : (
        <ol>
          {lead.events.map((e) => (
            <li key={e.id} className="relative grid grid-cols-[32px_1fr_auto] gap-3 py-3 before:absolute before:top-11 before:-bottom-3 before:left-[15px] before:w-0.5 before:bg-[#efefec] last:before:hidden">
              <span aria-hidden="true" className={`grid h-8 w-8 place-items-center rounded-full border ${ICON_STYLE[e.kind]}`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICON[e.kind]} />
                </svg>
              </span>
              <p className="min-w-0 pt-1.5 text-sm [overflow-wrap:anywhere]">{describe(e)}</p>
              <time dateTime={e.createdAt} className="pt-2 text-xs whitespace-nowrap text-[#6b6f72]">
                {formatDateTime(e.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Box>
  );
}
