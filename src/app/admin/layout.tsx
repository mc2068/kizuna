// /admin/** is for admins only (#7). src/proxy.ts answers 404 for everyone else before rendering;
// this is the backstop (it can only show the 404 page, not set the status). Not revealing the
// admin area matters more than a pretty error. Admins get every /admin page inside <AdminShell/>
// (Role 3).
import { connection } from 'next/server';
import { AdminGate } from '@/components/layout/AdminGate';

// Block on the server: the check must finish before any byte is sent, so the 404 status is real.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await connection();
  return <AdminGate>{children}</AdminGate>;
}
