import { beforeEach, describe, expect, it } from 'vitest';
import {
  addLeadNote,
  assignLead,
  deleteProject,
  getCurrentUser,
  getLead,
  getLeadCounts,
  getLeadFileUrl,
  getMyProjects,
  getProject,
  getSharedProject,
  listAdmins,
  listLeads,
  saveProject,
  setLeadStatus,
  submitStudyRequest,
  uploadLeadFile,
} from '@/lib/db';
import { FAKE_USERS, resetFakeDb, setFakeUser } from '@/lib/db/fake-store';
import { ENGINE_VERSION, type SizingInput } from '@/lib/engine';

const demoInputs: SizingInput = { rooms: 300, city: 'djerba', pool: true, elecPrice: null };

const validRequest = {
  contactName: 'Leila Trabelsi',
  email: 'leila@hotel.example',
  hotelName: 'Hotel Test',
  city: 'sousse' as const,
  rooms: 250,
  pool: true,
  elecPrice: null,
  consent: true,
};

beforeEach(() => resetFakeDb());

describe('getCurrentUser', () => {
  it('defaults to the demo admin so every page has data in development', async () => {
    expect(await getCurrentUser()).toMatchObject({ role: 'admin' });
  });
  it('returns null when signed out', async () => {
    setFakeUser(null);
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('listAdmins', () => {
  it('lists the four team members', async () => {
    expect((await listAdmins()).map((a) => a.fullName)).toEqual(['Mohamed Chakroun', 'Hamza', 'Ahmed', 'Gaith']);
  });
});

describe('projects', () => {
  it('saves a project with results computed on the server', async () => {
    setFakeUser(FAKE_USERS.userA);
    const forged = { ...demoInputs, results: { engineKwe: 9999 } } as unknown as SizingInput;
    const p = await saveProject({ hotelName: 'Hotel A', inputs: forged });
    expect(p.results.engineKwe).toBe(200);
    expect(p.engineVersion).toBe(ENGINE_VERSION);
    expect(p.inputs).toEqual(demoInputs);
    expect(p.ownerId).toBe(FAKE_USERS.userA.id);
    expect(p.shareToken.length).toBeGreaterThanOrEqual(16);
  });

  it('rejects invalid inputs', async () => {
    setFakeUser(FAKE_USERS.userA);
    await expect(saveProject({ hotelName: 'X', inputs: { ...demoInputs, rooms: 5 } })).rejects.toThrow();
  });

  it('requires a signed-in user to save', async () => {
    setFakeUser(null);
    await expect(saveProject({ hotelName: 'X', inputs: demoInputs })).rejects.toThrow(/signed in/i);
  });

  it('users see only their own projects', async () => {
    setFakeUser(FAKE_USERS.userA);
    const a = await saveProject({ hotelName: 'Hotel A', inputs: demoInputs });
    setFakeUser(FAKE_USERS.userB);
    expect(await getMyProjects()).toEqual([]);
    expect(await getProject(a.id)).toBeNull();
    await expect(deleteProject(a.id)).rejects.toThrow();
    setFakeUser(FAKE_USERS.userA);
    expect((await getMyProjects()).map((p) => p.id)).toEqual([a.id]);
    expect(await getProject(a.id)).toMatchObject({ hotelName: 'Hotel A' });
  });

  it('deletes own project', async () => {
    setFakeUser(FAKE_USERS.userA);
    const a = await saveProject({ hotelName: 'Hotel A', inputs: demoInputs });
    await deleteProject(a.id);
    expect(await getMyProjects()).toEqual([]);
  });

  it('anyone with the share token reads the project, without owner or id', async () => {
    setFakeUser(FAKE_USERS.userA);
    const a = await saveProject({ hotelName: 'Hotel A', inputs: demoInputs });
    setFakeUser(null);
    const shared = await getSharedProject(a.shareToken);
    expect(shared).toMatchObject({ hotelName: 'Hotel A', engineVersion: ENGINE_VERSION });
    expect(Object.keys(shared!).sort()).toEqual(['createdAt', 'engineVersion', 'hotelName', 'inputs', 'results']);
    expect(await getSharedProject('nope')).toBeNull();
  });
});

describe('submitStudyRequest', () => {
  it('saves a lead with status new, server-side results and a created event', async () => {
    setFakeUser(null);
    const r = await submitStudyRequest(validRequest);
    expect(r.ok).toBe(true);
    setFakeUser(FAKE_USERS.mohamed);
    const lead = await getLead((r as { leadId: string }).leadId);
    expect(lead).toMatchObject({ status: 'new', hotelName: 'Hotel Test', city: 'sousse', rooms: 250 });
    expect(lead!.results.engineKwe).toBeGreaterThan(0);
    expect(lead!.engineVersion).toBe(ENGINE_VERSION);
    expect(lead!.events.map((e) => e.kind)).toEqual(['created']);
  });

  it('assigns the admin with the fewest open leads', async () => {
    const counts = new Map<string, number>();
    setFakeUser(FAKE_USERS.mohamed);
    for (const l of await listLeads()) {
      if (['new', 'contacted', 'quoted'].includes(l.status)) counts.set(l.ownerId!, (counts.get(l.ownerId!) ?? 0) + 1);
    }
    const fewest = [...counts.entries()].sort((a, b) => a[1] - b[1])[0][0];
    const r = await submitStudyRequest(validRequest);
    expect((await getLead((r as { leadId: string }).leadId))!.ownerId).toBe(fewest);
  });

  it('accepts FormData from the form', async () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ ...validRequest, elecPrice: '', pool: 'on', consent: 'on', rooms: '250' })) {
      fd.set(k, String(v));
    }
    expect((await submitStudyRequest(fd)).ok).toBe(true);
  });

  it('returns field errors without consent or with a bad email', async () => {
    const r = await submitStudyRequest({ ...validRequest, consent: false, email: 'nope' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.fieldErrors ?? {}).sort()).toEqual(['consent', 'email']);
  });

  it('silently drops spam that fills the honeypot', async () => {
    setFakeUser(FAKE_USERS.mohamed);
    const before = (await listLeads()).length;
    const r = await submitStudyRequest({ ...validRequest, website: 'http://spam.example' });
    expect(r.ok).toBe(true);
    expect((await listLeads()).length).toBe(before);
  });
});

describe('admin leads', () => {
  it('seeds about 15 demo leads across all statuses', async () => {
    const leads = await listLeads();
    expect(leads.length).toBeGreaterThanOrEqual(15);
    const counts = await getLeadCounts();
    for (const n of Object.values(counts)) expect(n).toBeGreaterThan(0);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(leads.length);
  });

  it('lists newest first and filters by status, city and mine', async () => {
    const all = await listLeads();
    expect([...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))).toEqual(all);
    expect((await listLeads({ status: 'won' })).every((l) => l.status === 'won')).toBe(true);
    expect((await listLeads({ city: 'tozeur' })).every((l) => l.city === 'tozeur')).toBe(true);
    const mine = await listLeads({ mine: true });
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((l) => l.ownerId === FAKE_USERS.mohamed.id)).toBe(true);
  });

  it('non-admins see no leads and cannot change them', async () => {
    const [lead] = await listLeads();
    for (const user of [FAKE_USERS.userA, null]) {
      setFakeUser(user);
      expect(await listLeads()).toEqual([]);
      expect(await getLead(lead.id)).toBeNull();
      expect(await getLeadCounts()).toEqual({ new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 });
      expect(await listAdmins()).toEqual([]);
      await expect(setLeadStatus(lead.id, 'won')).rejects.toThrow(/admin/i);
      await expect(addLeadNote(lead.id, 'hi')).rejects.toThrow(/admin/i);
    }
  });

  it('changing status writes a status event', async () => {
    const [lead] = await listLeads({ status: 'new' });
    await setLeadStatus(lead.id, 'contacted');
    const d = await getLead(lead.id);
    expect(d!.status).toBe('contacted');
    expect(d!.events[0]).toMatchObject({ kind: 'status', data: { from: 'new', to: 'contacted' }, actorId: FAKE_USERS.mohamed.id });
  });

  it('reassigning writes an owner event and only accepts admins', async () => {
    const [lead] = await listLeads({ mine: true });
    await assignLead(lead.id, FAKE_USERS.hamza.id);
    const d = await getLead(lead.id);
    expect(d!.owner?.fullName).toBe('Hamza');
    expect(d!.events[0]).toMatchObject({ kind: 'owner', data: { from: FAKE_USERS.mohamed.id, to: FAKE_USERS.hamza.id } });
    await expect(assignLead(lead.id, FAKE_USERS.userA.id)).rejects.toThrow();
  });

  it('adds a note, newest first, with a note event', async () => {
    const [lead] = await listLeads();
    const note = await addLeadNote(lead.id, 'Called the GM.');
    const d = await getLead(lead.id);
    expect(d!.notes[0]).toEqual(note);
    expect(d!.events[0].kind).toBe('note');
    await expect(addLeadNote(lead.id, '   ')).rejects.toThrow();
  });

  it('uploads a file and returns a URL for it', async () => {
    const [lead] = await listLeads();
    const f = await uploadLeadFile(lead.id, new File(['%PDF-1.4 quote'], 'Quote.pdf', { type: 'application/pdf' }));
    expect(f).toMatchObject({ name: 'Quote.pdf', size: 14, uploadedBy: FAKE_USERS.mohamed.id });
    const d = await getLead(lead.id);
    expect(d!.files[0].id).toBe(f.id);
    expect(d!.events[0].kind).toBe('file');
    expect(await getLeadFileUrl(f.id)).toMatch(/^data:application\/pdf;base64,/);
    setFakeUser(FAKE_USERS.userA);
    expect(await getLeadFileUrl(f.id)).toBeNull();
  });

  it('the hand-written demo lead keeps its notes, history and files', async () => {
    const d = await getLead('L-1047');
    expect(d).toMatchObject({ hotelName: 'Club Ulysse Lagoon', status: 'contacted' });
    expect(d!.notes.length).toBe(3);
    expect(d!.files.length).toBe(3);
    expect(d!.events.length).toBeGreaterThanOrEqual(5);
  });
});
