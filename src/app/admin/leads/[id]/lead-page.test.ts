// The lead page's server entry points against the fake store: admins can change and upload,
// everyone else is refused, and every change lands in History (lead_events).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { getLead } from '@/lib/db';
import { setStoreForTests } from '@/lib/db/store';
import { resetFakeDb, setFakeUser } from '@/lib/db/fake/memory';
import { fakeStore } from '@/lib/db/fake/store';
import { DEMO_USERS } from '@/lib/db/fake/seed';
import { addNoteAction, changeStatusAction, fileUrlAction, reassignAction } from './actions';
import { POST } from './files/route';

const LEAD = 'L-1047';
const ctx = { params: Promise.resolve({ id: LEAD }) };

function uploadRequest(file: File) {
  const body = new FormData();
  body.append('file', file);
  return new Request(`http://localhost/admin/leads/${LEAD}/files`, { method: 'POST', body });
}

beforeEach(() => {
  setStoreForTests(fakeStore);
  resetFakeDb();
  setFakeUser(DEMO_USERS.ahmed);
});
afterEach(() => setStoreForTests(undefined));

describe('as an admin', () => {
  it('logs status and owner changes and notes in History, newest first', async () => {
    expect(await changeStatusAction(LEAD, 'quoted')).toEqual({ ok: true });
    expect(await reassignAction(LEAD, DEMO_USERS.gaith.id)).toEqual({ ok: true });
    expect(await addNoteAction(LEAD, '  Called back, board meets on 10 December.  ')).toEqual({ ok: true });

    const lead = (await getLead(LEAD))!;
    expect(lead.status).toBe('quoted');
    expect(lead.ownerId).toBe(DEMO_USERS.gaith.id);
    expect(lead.notes[0]!.body).toBe('Called back, board meets on 10 December.');
    expect(lead.events.slice(0, 3).map((e) => e.kind).sort()).toEqual(['note', 'owner', 'status']);
    const status = lead.events.find((e) => e.kind === 'status' && e.data.to === 'quoted')!;
    expect(status).toMatchObject({ actorId: DEMO_USERS.ahmed.id, data: { from: 'contacted', to: 'quoted' } });
  });

  it('returns errors instead of throwing', async () => {
    expect(await addNoteAction(LEAD, '   ')).toMatchObject({ ok: false });
    expect(await reassignAction(LEAD, DEMO_USERS.userA.id)).toMatchObject({ ok: false });
    expect(await changeStatusAction(LEAD, 'archived' as never)).toMatchObject({ ok: false });
    expect(await changeStatusAction('L-0000', 'won')).toEqual({ ok: false, error: 'Lead not found.' });
  });

  it('uploads a file, lists it, logs it and gives a download URL', async () => {
    const res = await POST(uploadRequest(new File(['%PDF-1.4 quote'], 'Installer quote.pdf', { type: 'application/pdf' })), ctx);
    expect(res.status).toBe(200);
    const lead = (await getLead(LEAD))!;
    const file = lead.files.find((f) => f.name === 'Installer quote.pdf')!;
    expect(file.uploadedBy).toBe(DEMO_USERS.ahmed.id);
    expect(lead.events[0]).toMatchObject({ kind: 'file', data: { name: 'Installer quote.pdf' } });
    expect(await fileUrlAction(file.id)).toMatch(/^data:application\/pdf;base64,/);
  });

  it('refuses files of the wrong type or size on the server', async () => {
    expect((await POST(uploadRequest(new File(['x'], 'run.exe')), ctx)).status).toBe(400);
    expect((await POST(uploadRequest(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'huge.pdf')), ctx)).status).toBe(400);
    expect((await POST(uploadRequest(new File(['x'], 'q.pdf')), { params: Promise.resolve({ id: 'L-0000' }) })).status).toBe(404);
  });
});

describe.each([
  ['a signed-in user', DEMO_USERS.userA],
  ['a visitor', null],
])('as %s', (_, user) => {
  beforeEach(() => setFakeUser(user));

  it('cannot read, change, upload or download', async () => {
    expect(await getLead(LEAD)).toBeNull();
    expect(await changeStatusAction(LEAD, 'won')).toEqual({ ok: false, error: 'Admins only.' });
    expect(await reassignAction(LEAD, DEMO_USERS.gaith.id)).toEqual({ ok: false, error: 'Admins only.' });
    expect(await addNoteAction(LEAD, 'hello')).toEqual({ ok: false, error: 'Admins only.' });
    expect((await POST(uploadRequest(new File(['x'], 'q.pdf')), ctx)).status).toBe(403);

    setFakeUser(DEMO_USERS.ahmed);
    const fileId = (await getLead(LEAD))!.files[0]!.id;
    const before = (await getLead(LEAD))!;
    setFakeUser(user);
    expect(await fileUrlAction(fileId)).toBeNull();

    setFakeUser(DEMO_USERS.ahmed);
    const after = (await getLead(LEAD))!;
    expect(after.status).toBe(before.status);
    expect(after.events).toHaveLength(before.events.length);
  });
});
