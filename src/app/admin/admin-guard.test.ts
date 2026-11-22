// Role 3 (#24) and #7: only admins reach /admin. The layout and the page both answer 404 for everyone
// else (layouts and pages render in parallel in Next 16, so the page checks too).
import { afterEach, describe, expect, it, vi } from 'vitest';

// Outside a request, connection() throws; here it just resolves.
vi.mock('next/server', () => ({ connection: async () => {} }));
import { resetFakeDb, setFakeUser } from '@/lib/db/fake/memory';
import { DEMO_USERS } from '@/lib/db/fake/seed';
import { AdminGate } from '@/components/layout/AdminGate';
import AdminPipelinePage from './page';

/** next/navigation's notFound() throws an error whose digest ends in the status. */
async function blocked(run: () => Promise<unknown>): Promise<boolean> {
  try {
    await run();
    return false;
  } catch (e) {
    const digest = String((e as { digest?: string }).digest ?? '');
    if (digest !== 'NEXT_HTTP_ERROR_FALLBACK;404') throw e;
    return true;
  }
}

const page = () => AdminPipelinePage({ searchParams: Promise.resolve({}) } as Parameters<typeof AdminPipelinePage>[0]);

afterEach(() => resetFakeDb());

describe('admin guard', () => {
  it('shows signed-out visitors the 404 page', async () => {
    setFakeUser(null);
    expect(await blocked(() => AdminGate({ children: null }))).toBe(true);
    expect(await blocked(page)).toBe(true);
  });

  it('shows signed-in hotel users the 404 page too', async () => {
    setFakeUser(DEMO_USERS.userA);
    expect(await blocked(() => AdminGate({ children: null }))).toBe(true);
    expect(await blocked(page)).toBe(true);
  });

  it('lets admins in', async () => {
    setFakeUser(DEMO_USERS.mohamed);
    expect(await blocked(() => AdminGate({ children: null }))).toBe(false);
  });
});
