// /projects needs a signed-in visitor (#7). src/proxy.ts redirects first when Supabase is
// configured and on the fake; this is the backstop in case the proxy is skipped.
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { signInPath } from '@/lib/auth/paths';
import { getCurrentUser } from '@/lib/db';

// Block on the server: the check must finish before any byte is sent, so the redirect is a real 307.
export const instant = false;

export default async function ProjectsLayout({ children }: LayoutProps<'/projects'>) {
  await connection();
  if (!(await getCurrentUser())) redirect(signInPath('/projects'));
  return children;
}
