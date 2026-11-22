import { ENGINE_VERSION, sizeHotel } from '@/lib/engine';
import { isAdmin, requireAdmin } from './auth';
import { db, newId, now } from './fake-store';
import { ADMINS, toProfile } from './seed';
import {
  LEAD_STATUSES,
  type Lead,
  type LeadCounts,
  type LeadDetail,
  type LeadEvent,
  type LeadFile,
  type LeadFilters,
  type LeadNote,
  type LeadStatus,
  type StudyRequestForm,
  type StudyRequestResult,
} from './types';
import { studyRequestSchema } from './validation';

const OPEN: LeadStatus[] = ['new', 'contacted', 'quoted'];
const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

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

/**
 * Public: the Request a study form. Accepts the form's FormData or a plain object.
 * The sizing is computed here on the server; results from the browser are ignored.
 */
export async function submitStudyRequest(form: StudyRequestForm | FormData): Promise<StudyRequestResult> {
  const raw = form instanceof FormData ? Object.fromEntries(form.entries()) : form;
  const parsed = studyRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { ok: false, error: 'Please check the highlighted fields.', fieldErrors };
  }
  const f = parsed.data;
  // Honeypot filled: pretend it worked, store nothing.
  if (f.website) return { ok: true, leadId: newId() };

  const inputs = { rooms: f.rooms, city: f.city, pool: f.pool, elecPrice: f.elecPrice };
  // Link a saved project only if it belongs to the person sending the request.
  const me = db().user;
  const projectId = db().projects.some((p) => p.id === f.projectId && p.ownerId === me?.id) ? f.projectId! : null;
  const lead: Lead = {
    id: newId(),
    projectId,
    hotelName: f.hotelName,
    city: f.city,
    rooms: f.rooms,
    contactName: f.contactName,
    email: f.email,
    phone: f.phone ?? null,
    message: f.message ?? null,
    consent: true,
    inputs,
    results: sizeHotel(inputs),
    engineVersion: ENGINE_VERSION,
    status: 'new',
    ownerId: nextOwner(),
    createdAt: now(),
  };
  db().leads.push(lead);
  addEvent(lead.id, 'created', null, { source: projectId ? 'saved project' : 'website form' });
  return { ok: true, leadId: lead.id };
}

/** Admins only (others get []). Newest first. */
export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  if (!isAdmin()) return [];
  const me = db().user?.id;
  return db()
    .leads.filter(
      (l) =>
        (!filters.status || l.status === filters.status) &&
        (!filters.city || l.city === filters.city) &&
        (!filters.mine || l.ownerId === me),
    )
    .sort(newestFirst)
    .map((l) => structuredClone(l));
}

/** Number of leads per status (all zero for non-admins). */
export async function getLeadCounts(): Promise<LeadCounts> {
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as LeadCounts;
  if (!isAdmin()) return counts;
  for (const l of db().leads) counts[l.status] += 1;
  return counts;
}

/** Admins only (others get null). */
export async function getLead(id: string): Promise<LeadDetail | null> {
  if (!isAdmin()) return null;
  const lead = db().leads.find((l) => l.id === id);
  if (!lead) return null;
  const owner = ADMINS.find((a) => a.id === lead.ownerId);
  const store = db();
  return structuredClone({
    ...lead,
    owner: owner ? toProfile(owner) : null,
    notes: store.notes.filter((n) => n.leadId === id).sort(newestFirst),
    events: store.events.filter((e) => e.leadId === id).sort(newestFirst),
    files: store.files
      .filter((f) => f.leadId === id)
      .sort(newestFirst)
      .map(({ id, leadId, path, name, size, uploadedBy, createdAt }) => ({ id, leadId, path, name, size, uploadedBy, createdAt })),
  });
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  const actor = requireAdmin();
  if (!LEAD_STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);
  const lead = findLead(id);
  if (lead.status !== status) {
    addEvent(id, 'status', actor.id, { from: lead.status, to: status });
    lead.status = status;
  }
  return structuredClone(lead);
}

export async function assignLead(id: string, ownerId: string): Promise<Lead> {
  const actor = requireAdmin();
  if (!ADMINS.some((a) => a.id === ownerId)) throw new Error('A lead can only be owned by an admin.');
  const lead = findLead(id);
  if (lead.ownerId !== ownerId) {
    addEvent(id, 'owner', actor.id, { from: lead.ownerId, to: ownerId });
    lead.ownerId = ownerId;
  }
  return structuredClone(lead);
}

export async function addLeadNote(id: string, body: string): Promise<LeadNote> {
  const actor = requireAdmin();
  findLead(id);
  const text = body.trim();
  if (!text) throw new Error('A note cannot be empty.');
  const note: LeadNote = { id: newId(), leadId: id, authorId: actor.id, body: text, createdAt: now() };
  db().notes.push(note);
  addEvent(id, 'note', actor.id, { noteId: note.id });
  return structuredClone(note);
}

/** Stores the file in the private 'lead-files' bucket (in memory here). */
export async function uploadLeadFile(id: string, file: File): Promise<LeadFile> {
  const actor = requireAdmin();
  findLead(id);
  const fileId = newId();
  const row: LeadFile = {
    id: fileId,
    leadId: id,
    path: `${id}/${fileId}-${file.name.replace(/[^\w.-]+/g, '_')}`,
    name: file.name,
    size: file.size,
    uploadedBy: actor.id,
    createdAt: now(),
  };
  const bytes = new Uint8Array(await file.arrayBuffer());
  db().files.push({ ...row, contentType: file.type || 'application/octet-stream', bytes });
  addEvent(id, 'file', actor.id, { fileId, name: file.name });
  return { ...row };
}

/** A short-lived URL to download a lead file (a data: URL in the fake). Admins only, else null. */
export async function getLeadFileUrl(fileId: string): Promise<string | null> {
  if (!isAdmin()) return null;
  const f = db().files.find((x) => x.id === fileId);
  if (!f) return null;
  return `data:${f.contentType};base64,${Buffer.from(f.bytes).toString('base64')}`;
}
