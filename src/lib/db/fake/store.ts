// The in-memory DataStore: used when Supabase is not configured, so every page has data with
// no database. It applies the same access rules as the RLS policies in supabase/migrations.
import type { DataStore, LeadQuery, NewLead, NewProject } from '../store';
import { emptyLeadCounts, type Lead, type LeadEvent, type LeadFile, type LeadStatus, type Project } from '../types';
import { safeFileName } from '../validation';
import { db, newId, now } from './memory';
import { ADMINS, toProfile } from './seed';

const OPEN: LeadStatus[] = ['new', 'contacted', 'quoted'];
const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
const isAdmin = () => db().user?.role === 'admin';

function findLead(id: string): Lead {
  const lead = db().leads.find((l) => l.id === id);
  if (!lead) throw new Error('Lead not found.');
  return lead;
}

function addEvent(leadId: string, kind: LeadEvent['kind'], actorId: string | null, data: Record<string, unknown> = {}) {
  db().events.push({ id: newId(), leadId, kind, data, actorId, createdAt: now() });
}

/** The admin with the fewest open leads (new, contacted or quoted). Ties go to the first listed. */
function nextOwner(): string {
  const open = (id: string) => db().leads.filter((l) => l.ownerId === id && OPEN.includes(l.status)).length;
  return ADMINS.reduce((best, a) => (open(a.id) < open(best.id) ? a : best)).id;
}

function nextLeadId(): string {
  const max = Math.max(1000, ...db().leads.map((l) => parseInt(l.id.slice(2), 10) || 0));
  return `L-${max + 1}`;
}

export const fakeStore: DataStore = {
  async currentUser() {
    return db().user;
  },

  async listAdmins() {
    return isAdmin() ? ADMINS.map(toProfile) : [];
  },

  async myProjects() {
    const user = db().user;
    if (!user) return [];
    return db()
      .projects.filter((p) => p.ownerId === user.id)
      .sort(newestFirst)
      .map((p) => structuredClone(p));
  },

  async project(id) {
    const user = db().user;
    const p = db().projects.find((x) => x.id === id && x.ownerId === user?.id);
    return p ? structuredClone(p) : null;
  },

  async insertProject(row: NewProject) {
    const user = db().user;
    if (!user) throw new Error('You must be signed in.');
    const at = now();
    const project: Project = { id: newId(), ownerId: user.id, ...row, shareToken: newId().replace(/-/g, ''), createdAt: at, updatedAt: at };
    db().projects.push(project);
    return structuredClone(project);
  },

  async deleteProject(id) {
    const store = db();
    const i = store.projects.findIndex((p) => p.id === id && p.ownerId === store.user?.id);
    if (i === -1) throw new Error('Project not found.');
    store.projects.splice(i, 1);
  },

  async renameProject(id, hotelName) {
    const p = db().projects.find((x) => x.id === id && x.ownerId === db().user?.id);
    if (!p) throw new Error('Project not found.');
    p.hotelName = hotelName;
    p.updatedAt = now();
    return structuredClone(p);
  },

  async updateProjectResults(id, results, engineVersion) {
    const p = db().projects.find((x) => x.id === id && x.ownerId === db().user?.id);
    if (!p) throw new Error('Project not found.');
    p.results = results;
    p.engineVersion = engineVersion;
    p.updatedAt = now();
    return structuredClone(p);
  },

  async sharedProject(token) {
    const p = db().projects.find((x) => x.shareToken === token);
    if (!p) return null;
    const { hotelName, inputs, results, engineVersion, createdAt } = structuredClone(p);
    return { hotelName, inputs, results, engineVersion, createdAt };
  },

  async ownsProject(id) {
    const user = db().user;
    return Boolean(user && db().projects.some((p) => p.id === id && p.ownerId === user.id));
  },

  async insertLead(row: NewLead) {
    const lead: Lead = { ...row, id: nextLeadId(), status: 'new', ownerId: nextOwner(), createdAt: now() };
    db().leads.push(lead);
    addEvent(lead.id, 'created', null, { source: row.projectId ? 'saved project' : 'website form' });
    return lead.id;
  },

  async listLeads({ status, city, ownerId }: LeadQuery) {
    if (!isAdmin()) return [];
    return db()
      .leads.filter((l) => (!status || l.status === status) && (!city || l.city === city) && (!ownerId || l.ownerId === ownerId))
      .sort(newestFirst)
      .map((l) => structuredClone(l));
  },

  async leadCounts() {
    const counts = emptyLeadCounts();
    if (isAdmin()) for (const l of db().leads) counts[l.status] += 1;
    return counts;
  },

  async lead(id) {
    if (!isAdmin()) return null;
    const store = db();
    const lead = store.leads.find((l) => l.id === id);
    if (!lead) return null;
    const owner = ADMINS.find((a) => a.id === lead.ownerId);
    return structuredClone({
      ...lead,
      owner: owner ? toProfile(owner) : null,
      notes: store.notes.filter((n) => n.leadId === id).sort(newestFirst),
      events: store.events.filter((e) => e.leadId === id).sort(newestFirst),
      files: store.files
        .filter((f) => f.leadId === id)
        .sort(newestFirst)
        .map(({ id, leadId, path, name, size, uploadedBy, createdAt }): LeadFile => ({ id, leadId, path, name, size, uploadedBy, createdAt })),
    });
  },

  async setLeadStatus(id, status, actorId) {
    const lead = findLead(id);
    if (lead.status !== status) {
      addEvent(id, 'status', actorId, { from: lead.status, to: status });
      lead.status = status;
    }
    return structuredClone(lead);
  },

  async assignLead(id, ownerId, actorId) {
    if (!ADMINS.some((a) => a.id === ownerId)) throw new Error('A lead can only be owned by an admin.');
    const lead = findLead(id);
    if (lead.ownerId !== ownerId) {
      addEvent(id, 'owner', actorId, { from: lead.ownerId, to: ownerId });
      lead.ownerId = ownerId;
    }
    return structuredClone(lead);
  },

  async addLeadNote(id, body, actorId) {
    findLead(id);
    const note = { id: newId(), leadId: id, authorId: actorId, body, createdAt: now() };
    db().notes.push(note);
    addEvent(id, 'note', actorId, { noteId: note.id });
    return structuredClone(note);
  },

  async uploadLeadFile(id, file, actorId) {
    findLead(id);
    const fileId = newId();
    const row: LeadFile = {
      id: fileId,
      leadId: id,
      path: `${id}/${fileId}-${safeFileName(file.name)}`,
      name: file.name,
      size: file.size,
      uploadedBy: actorId,
      createdAt: now(),
    };
    const bytes = new Uint8Array(await file.arrayBuffer());
    db().files.push({ ...row, contentType: file.type || 'application/octet-stream', bytes });
    addEvent(id, 'file', actorId, { fileId, name: file.name });
    return { ...row };
  },

  /** A data: URL in the fake (Supabase returns a signed Storage URL). */
  async addLeadEvent(leadId, kind, data) {
    findLead(leadId);
    addEvent(leadId, kind, null, data);
  },

  async takeRateLimitSlot(key, limit, windowSeconds) {
    const attempts = db().rateLimit;
    const since = Date.now() - windowSeconds * 1000;
    const recent = attempts.filter((a) => a.key === key && a.at > since).length;
    if (recent >= limit) return false;
    attempts.push({ key, at: Date.now() });
    return true;
  },

  async leadFileUrl(fileId) {
    if (!isAdmin()) return null;
    const f = db().files.find((x) => x.id === fileId);
    if (!f) return null;
    return `data:${f.contentType};base64,${Buffer.from(f.bytes).toString('base64')}`;
  },
};
