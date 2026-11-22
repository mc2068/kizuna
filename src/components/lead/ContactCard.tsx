import { getTranslations } from 'next-intl/server';
import type { LeadDetail } from '@/lib/db/types';
import { Avatar, Box } from './Box';
import { initials } from './format';

export async function ContactCard({ lead }: { lead: LeadDetail }) {
  const t = await getTranslations('lead.contact');
  return (
    <Box title={t('title')}>
      <div className="mb-4 flex items-center gap-3">
        <Avatar label={initials(lead.contactName)} size="lg" tone="bg-[#3d4a4a]" />
        <p className="font-semibold">{lead.contactName}</p>
      </div>
      <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2.5 text-[13px]">
        <dt className="text-[#6b6f72]">{t('email')}</dt>
        <dd className="min-w-0 font-medium [overflow-wrap:anywhere]">
          <a href={`mailto:${lead.email}`} className="text-[#0066cc] hover:underline">
            {lead.email}
          </a>
        </dd>
        <dt className="text-[#6b6f72]">{t('phone')}</dt>
        <dd className="font-medium tabular-nums">
          {lead.phone ? (
            <a href={`tel:${lead.phone.replace(/\s+/g, '')}`} className="text-[#0066cc] hover:underline">
              {lead.phone}
            </a>
          ) : (
            <span className="text-[#6b6f72]">{t('noPhone')}</span>
          )}
        </dd>
        <dt className="text-[#6b6f72]">{t('consent')}</dt>
        <dd className="font-medium">{t('consentYes')}</dd>
        {lead.projectId && (
          <>
            <dt className="text-[#6b6f72]">{t('project')}</dt>
            <dd className="font-medium">{t('projectLinked')}</dd>
          </>
        )}
        {lead.message && (
          <>
            <dt className="text-[#6b6f72]">{t('message')}</dt>
            <dd className="whitespace-pre-line">{lead.message}</dd>
          </>
        )}
      </dl>
    </Box>
  );
}

export async function NextStepCard({ lead, names }: { lead: LeadDetail; names: Record<string, string> }) {
  const t = await getTranslations('lead');
  const owner = lead.ownerId ? names[lead.ownerId] : undefined;
  return (
    <Box title={t('overview.nextStep')}>
      <p className="text-sm leading-relaxed">{t(`overview.next.${lead.status}`)}</p>
      <p className="mt-2 text-[12.5px] text-[#6b6f72]">
        {t('overview.ownerLine', { name: owner ?? t('header.unassigned') })}
      </p>
    </Box>
  );
}
