import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getCurrentUser, listAdmins } from '@/lib/db';
import { AdminShell } from './AdminShell';

/** Checks the user at request time (admins only, everyone else to /sign-in), then renders the
 *  admin shell around the page. Used by src/app/admin/layout.tsx inside <Suspense>. */
export async function AdminGate({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await getCurrentUser().catch(() => null);
  if (!user || user.role !== 'admin') redirect('/sign-in?next=/admin');
  const profile = (await listAdmins()).find((p) => p.id === user.id);
  return <AdminShell user={{ id: user.id, name: profile?.fullName ?? user.email }}>{children}</AdminShell>;
}
