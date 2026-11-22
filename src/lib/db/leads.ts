import { ENGINE_VERSION, sizeHotel } from '@/lib/engine';
import { currentAdmin, requireAdmin } from './auth';
import { store } from './store';
import {
  emptyLeadCounts,
  LEAD_STATUSES,
  type Lead,
  type LeadCounts,
  type LeadDetail,
  type LeadFile,
  type LeadFilters,
  type LeadNote,
  type LeadStatus,
  type StudyRequestForm,
  type StudyRequestResult,
} from './types';
import { studyRequestSchema } from './validation';

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
  if (f.website) return { ok: true, leadId: `L-${1000 + Math.floor(Math.random() * 9000)}` };

  const inputs = { rooms: f.rooms, city: f.city, pool: f.pool, elecPrice: f.elecPrice };
  // Link a saved project only if it belongs to the person sending the request.
  const projectId = f.projectId && (await store().ownsProject(f.projectId)) ? f.projectId : null;
  const leadId = await store().insertLead({
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
  });
  return { ok: true, leadId };
}

/** Admins only (others get []). Newest first. */
export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const admin = await currentAdmin();
  if (!admin) return [];
  const { mine, ...rest } = filters;
  return store().listLeads({ ...rest, ownerId: mine ? admin.id : undefined });
}

/** Number of leads per status (all zero for non-admins). */
export async function getLeadCounts(): Promise<LeadCounts> {
  if (!(await currentAdmin())) return emptyLeadCounts();
  return store().leadCounts();
}

/** Admins only (others get null). Notes, events and files newest first. */
export async function getLead(id: string): Promise<LeadDetail | null> {
  if (!(await currentAdmin())) return null;
  return store().lead(id);
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  const actor = await requireAdmin();
  if (!LEAD_STATUSES.includes(status)) throw new Error(`Unknown status: ${status}`);
  return store().setLeadStatus(id, status, actor.id);
}

export async function assignLead(id: string, ownerId: string): Promise<Lead> {
  const actor = await requireAdmin();
  return store().assignLead(id, ownerId, actor.id);
}

export async function addLeadNote(id: string, body: string): Promise<LeadNote> {
  const actor = await requireAdmin();
  const text = body.trim();
  if (!text) throw new Error('A note cannot be empty.');
  return store().addLeadNote(id, text, actor.id);
}

/** Stores the file in the private 'lead-files' bucket. */
export async function uploadLeadFile(id: string, file: File): Promise<LeadFile> {
  const actor = await requireAdmin();
  return store().uploadLeadFile(id, file, actor.id);
}

/** A short-lived URL to download a lead file. Admins only, else null. */
export async function getLeadFileUrl(fileId: string): Promise<string | null> {
  if (!(await currentAdmin())) return null;
  return store().leadFileUrl(fileId);
}
