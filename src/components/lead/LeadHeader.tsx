// Photo-style header after Ramotion's Carbon Solutions: an illustration band with the ID card
// (hotel, status pill, verdict, facts) on top, and the owner bar underneath.
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { verdictTone } from '@/lib/present';
import type { LeadDetail, Profile } from '@/lib/db/types';
import { CoastScene } from './CoastScene';
import { StatusSelect } from './StatusSelect';
import { OwnerSelect } from './OwnerSelect';
import { formatDate } from './format';

export const VERDICT_STYLE = {
  good: 'bg-[#e2f3e8] text-[#1f8a4c]',
  maybe: 'bg-[#fbefd9] text-[#b26b00]',
  weak: 'bg-[#ececea] text-[#6b6f72]',
} as const;

export async function LeadHeader({ lead, admins }: { lead: LeadDetail; admins: Profile[] }) {
  const t = await getTranslations('lead');
  const tone = verdictTone(lead.results.verdict);
  const facts = [
    [t('header.rooms'), String(lead.rooms)],
    [t('header.city'), t(`cities.${lead.city}`)],
    [t('header.pool'), lead.inputs.pool ? t('header.poolYes') : t('header.poolNo')],
    [t('header.received'), formatDate(lead.createdAt)],
  ];

  return (
    <header>
      <nav aria-label={t('header.crumbs')} className="mb-4 flex items-center gap-2 text-[13px] text-[#6b6f72]">
        <Link href="/admin" className="hover:text-[#17191a]">
          {t('header.crumbs')}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-semibold text-[#17191a]">
          {lead.hotelName}
        </span>
      </nav>

      <div className="relative flex min-h-[330px] flex-col justify-between overflow-hidden rounded-[18px] bg-[#cfe7ef] p-3 sm:min-h-[250px] sm:p-5">
        <CoastScene city={lead.city} />
        <Link
          href="/admin"
          className="relative inline-flex h-[34px] w-fit items-center gap-1.5 rounded-[9px] bg-white/90 px-3 text-[13px] font-medium backdrop-blur hover:bg-white"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M15 18 9 12l6-6" />
          </svg>
          {t('header.back')}
        </Link>

        <div className="relative mt-6 w-full max-w-[520px] rounded-[14px] bg-white px-[18px] py-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,.35)]">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">{lead.hotelName}</h1>
          <p className="mt-0.5 text-[13px] text-[#6b6f72]">
            {t('header.subtitle', { city: t(`cities.${lead.city}`), rooms: lead.rooms })}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <StatusSelect leadId={lead.id} status={lead.status} />
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${VERDICT_STYLE[tone]}`}>{t(`verdict.${tone}`)}</span>
            <span className="rounded-full border border-[#e4e4e0] px-2.5 py-0.5 text-xs text-[#6b6f72]">{t('header.id', { id: lead.id })}</span>
          </div>
          <dl className="mt-3.5 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#efefec] bg-[#efefec] sm:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-white px-3 py-2">
                <dt className="text-xs text-[#6b6f72]">{k}</dt>
                <dd className="text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-3">
        <OwnerSelect leadId={lead.id} ownerId={lead.ownerId} admins={admins} />
      </div>
    </header>
  );
}
