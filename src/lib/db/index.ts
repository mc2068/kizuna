// Contract 3 functions (Role 4, Mohamed). STAND-IN: an in-memory fake with the same signatures,
// until the Supabase backend (#6) lands. Server only.
import 'server-only';
import { cookies } from 'next/headers';
import { ENGINE_VERSION, sizeHotel, type SizingInput } from '@/lib/engine';
import { fakeLeadCounts, fakeListLeads, fakeSubmit, store, TEAM } from './fake';
import type { CurrentUser, Lead, LeadFilters, LeadStatus, Profile, Project, StudyRequestForm, SubmitResult } from './types';

export * from './types';

/** Fake sign-in: the cookie "kz-fake-user" picks who you are ("none", "user", or a team id).
 *  Defaults to Mohamed (admin) so the admin pages can be demoed before sign-in (#7) lands. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const who = (await cookies()).get('kz-fake-user')?.value ?? 'mohamed';
  if (who === 'none') return null;
  if (who === 'user') return { id: 'user-1', email: 'leila@example.com', role: 'user' };
  const p = TEAM.find((t) => t.id === who) ?? TEAM[0];
  return { id: p.id, email: `${p.id}@example.com`, role: 'admin' };
}

async function requireAdmin(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u || u.role !== 'admin') throw new Error('Admins only');
  return u;
}

export async function listAdmins(): Promise<Profile[]> {
  return TEAM;
}

export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const me = await requireAdmin();
  return fakeListLeads(filters, me.id);
}

export async function getLeadCounts(): Promise<Record<LeadStatus, number>> {
  await requireAdmin();
  return fakeLeadCounts();
}

export async function getLead(id: string): Promise<Lead | null> {
  await requireAdmin();
  return store().leads.find((l) => l.id === id) ?? null;
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<void> {
  await requireAdmin();
  const l = store().leads.find((x) => x.id === id);
  if (l) Object.assign(l, { status, statusChangedAt: new Date().toISOString() });
}

export async function assignLead(id: string, ownerId: string): Promise<void> {
  await requireAdmin();
  const l = store().leads.find((x) => x.id === id);
  if (l) l.ownerId = ownerId;
}

export async function addLeadNote(id: string, body: string): Promise<void> {
  const me = await requireAdmin();
  store().notes.push({ id: crypto.randomUUID(), leadId: id, authorId: me.id, body, createdAt: new Date().toISOString() });
}

export async function uploadLeadFile(id: string, file: File): Promise<void> {
  const me = await requireAdmin();
  store().files.push({
    id: crypto.randomUUID(),
    leadId: id,
    path: `lead-files/${id}/${file.name}`,
    name: file.name,
    size: file.size,
    uploadedBy: me.id,
    createdAt: new Date().toISOString(),
  });
}

export async function getLeadFileUrl(fileId: string): Promise<string | null> {
  await requireAdmin();
  return store().files.some((f) => f.id === fileId) ? `#file-${fileId}` : null;
}

export async function submitStudyRequest(form: StudyRequestForm): Promise<SubmitResult> {
  return fakeSubmit(form);
}

export async function getMyProjects(): Promise<Project[]> {
  const u = await getCurrentUser();
  return u ? store().projects.filter((p) => p.ownerId === u.id) : [];
}

export async function getProject(id: string): Promise<Project | null> {
  const u = await getCurrentUser();
  return store().projects.find((p) => p.id === id && p.ownerId === u?.id) ?? null;
}

export async function saveProject({ hotelName, inputs }: { hotelName: string; inputs: SizingInput }): Promise<Project> {
  const u = await getCurrentUser();
  if (!u) throw new Error('Sign in first');
  const now = new Date().toISOString();
  const p: Project = {
    id: crypto.randomUUID(),
    ownerId: u.id,
    hotelName,
    inputs,
    results: sizeHotel(inputs),
    engineVersion: ENGINE_VERSION,
    shareToken: null,
    createdAt: now,
    updatedAt: now,
  };
  store().projects.push(p);
  return p;
}

export async function deleteProject(id: string): Promise<void> {
  const u = await getCurrentUser();
  const s = store();
  s.projects = s.projects.filter((p) => !(p.id === id && p.ownerId === u?.id));
}

export async function getSharedProject(token: string): Promise<Project | null> {
  return store().projects.find((p) => p.shareToken === token) ?? null;
}
