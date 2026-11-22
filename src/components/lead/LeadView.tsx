// The whole lead page under the header: tabs on the left, contact card and next step on the
// right (visible from every tab). Server Component: only the controls are client components.
import type { LeadDetail, Profile } from '@/lib/db/types';
import { LeadHeader } from './LeadHeader';
import { ContactCard, NextStepCard } from './ContactCard';
import { LeadTabs } from './LeadTabs';
import { OverviewTab } from './OverviewTab';
import { NotesTab } from './NotesTab';
import { HistoryTab } from './HistoryTab';
import { FilesTab } from './FilesTab';

export function LeadView({ lead, admins }: { lead: LeadDetail; admins: Profile[] }) {
  const names = Object.fromEntries(admins.map((a) => [a.id, a.fullName]));
  if (lead.owner) names[lead.owner.id] ??= lead.owner.fullName;

  return (
    <main className="w-full flex-1 bg-[#f3f3f1] text-[#17191a]">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-7 sm:py-7">
        <LeadHeader lead={lead} admins={admins} />
        <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <LeadTabs
            counts={{ notes: lead.notes.length, history: lead.events.length, files: lead.files.length }}
            panels={{
              overview: <OverviewTab lead={lead} names={names} />,
              notes: <NotesTab lead={lead} names={names} />,
              history: <HistoryTab lead={lead} names={names} />,
              files: <FilesTab lead={lead} names={names} />,
            }}
          />
          <aside className="grid gap-4 xl:sticky xl:top-5">
            <ContactCard lead={lead} />
            <NextStepCard lead={lead} names={names} />
          </aside>
        </div>
      </div>
    </main>
  );
}
