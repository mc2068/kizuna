import { connection } from 'next/server';
import { getCurrentUser } from '@/lib/db';
import { SiteHeader } from './SiteHeader';

/**
 * The header with the signed-in user, read at request time. Render it inside <Suspense> with
 * <SiteHeaderView user={null} pathname=""/> as the fallback (cacheComponents): the static shell shows "Sign in",
 * then this swaps in "My projects" / "Admin". A missing database (CI build) counts as signed out.
 */
export async function SiteHeaderWithUser() {
  await connection();
  const user = await getCurrentUser().catch(() => null);
  return <SiteHeader user={user} />;
}
