// Admin lead detail (#25, ADR 0004): photo-style header, status and owner, contact card, and the
// Overview / Notes / History / Files tabs. Admins only: the data layer returns nothing to anyone
// else (and Supabase RLS refuses too), so a non-admin never receives lead data.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, getLead, listAdmins } from '@/lib/db';
import { LeadView } from '@/components/lead/LeadView';
import { AdminsOnly } from '@/components/lead/AdminsOnly';

export async function generateMetadata({ params }: PageProps<'/admin/leads/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('lead');
  return { title: t('meta.title', { id: decodeURIComponent(id) }), robots: { index: false, follow: false } };
}

export default function Page(props: PageProps<'/admin/leads/[id]'>) {
  return (
    <Suspense fallback={<LeadSkeleton />}>
      <LeadPage {...props} />
    </Suspense>
  );
}

async function LeadPage({ params }: PageProps<'/admin/leads/[id]'>) {
  await connection();
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/admin/leads/${rawId}`)}`);
  if (user.role !== 'admin') return <AdminsOnly />;

  const [lead, admins] = await Promise.all([getLead(id), listAdmins()]);
  if (!lead) notFound();

  return <LeadView lead={lead} admins={admins} />;
}

async function LeadSkeleton() {
  const t = await getTranslations('lead');
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-7" aria-busy="true">
      <div className="h-[250px] animate-pulse rounded-[18px] bg-[#e6eef1]" />
      <p className="mt-6 text-sm text-[#6b6f72]">{t('meta.loading')}</p>
    </main>
  );
}
