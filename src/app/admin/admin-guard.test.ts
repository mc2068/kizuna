// Role 3 (#24): only admins reach /admin. The layout and the page both send everyone else to
// /sign-in (layouts and pages render in parallel in Next 16, so the page checks too).
import { afterEach, describe, expect, it, vi } from 'vitest';

// Outside a request, connection() throws; here it just resolves.
vi.mock('next/server', () => ({ connection: async () => {} }));
import { resetFakeDb, setFakeUser } from '@/lib/db/fake/memory';
import { DEMO_USERS } from '@/lib/db/fake/seed';
import { AdminGate } from '@/components/layout/AdminGate';
import AdminPipelinePage from './page';

/** next/navigation's redirect() throws an error whose digest carries the target URL. */
async function redirectTarget(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (e) {
    const digest = String((e as { digest?: string }).digest ?? '');
    if (!digest.startsWith('NEXT_REDIRECT')) throw e;
    return digest.split(';')[2] ?? '';
  }
}

const page = () => AdminPipelinePage({ searchParams: Promise.resolve({}) } as Parameters<typeof AdminPipelinePage>[0]);

afterEach(() => resetFakeDb());

describe('admin guard', () => {
  it('sends signed-out visitors to sign in', async () => {
    setFakeUser(null);
    expect(await redirectTarget(() => AdminGate({ children: null }))).toBe('/sign-in?next=/admin');
    expect(await redirectTarget(page)).toBe('/sign-in?next=/admin');
  });

  it('sends signed-in hotel users to sign in too', async () => {
    setFakeUser(DEMO_USERS.userA);
    expect(await redirectTarget(() => AdminGate({ children: null }))).toBe('/sign-in?next=/admin');
    expect(await redirectTarget(page)).toBe('/sign-in?next=/admin');
  });

  it('lets admins in', async () => {
    setFakeUser(DEMO_USERS.mohamed);
    expect(await redirectTarget(() => AdminGate({ children: null }))).toBeNull();
  });
});
