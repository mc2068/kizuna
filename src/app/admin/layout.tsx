// /admin/** is for admins only (#7). src/proxy.ts answers 404 for everyone else before rendering;
// this is the backstop (it can only show the 404 page, not set the status). Not revealing the
// admin area matters more than a pretty error. Role 3 wraps {children} in <AdminShell/> here.
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { currentAdmin } from '@/lib/db/auth';

// Block on the server: the check must finish before any byte is sent, so the 404 status is real.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await connection();
  if (!(await currentAdmin())) notFound();
  return children;
}
