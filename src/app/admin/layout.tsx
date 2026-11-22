// Role 3: every /admin page sits inside <AdminShell/>. Only admins get here: the page-level
// redirect below backs up the middleware check (#7, Mohamed).
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/layout/AdminShell';
import { getCurrentUser, listAdmins } from '@/lib/db';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/sign-in?next=/admin');
  const profile = (await listAdmins()).find((p) => p.id === user.id);
  return <AdminShell user={{ id: user.id, name: profile?.fullName ?? user.email }}>{children}</AdminShell>;
}
