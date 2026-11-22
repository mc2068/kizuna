import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { listAdmins } from '@/lib/db';
import { currentAdmin } from '@/lib/db/auth';
import { AdminShell } from './AdminShell';

/** Checks the user at request time (admins only, everyone else gets the 404 page, #7), then renders
 *  the admin shell around the page. Used by src/app/admin/layout.tsx. */
export async function AdminGate({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await currentAdmin().catch(() => null);
  if (!user) notFound();
  const profile = (await listAdmins()).find((p) => p.id === user.id);
  return <AdminShell user={{ id: user.id, name: profile?.fullName ?? user.email }}>{children}</AdminShell>;
}
