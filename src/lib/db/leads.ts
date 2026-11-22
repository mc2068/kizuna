import { createHash } from 'node:crypto';
import { snapshot } from '@/lib/engine';
import { sendStudyRequestEmails } from '@/lib/email';
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

/** At most this many study requests per client (hashed IP) per window. */
export const STUDY_REQUEST_LIMIT = { max: 5, windowSeconds: 60 * 60 } as const;

export type SubmitOptions = {
  /**
   * The client IP for the rate limit. Default: read from the request headers (x-forwarded-for, set by
   * Vercel). Outside a request (scripts, tests) and with no ip given, the rate limit is not applied.
   */
  ip?: string | null;
};

/**
 * Public: the Request a study form. Accepts the form's FormData or a plain object.
 * Validates (consent required), drops honeypot spam, rate-limits per client, sizes the hotel on the
 * server (results from the browser are ignored), saves the lead (status new, owner = the admin with the
 * fewest open leads, a 'created' event), then emails the team and the hotel. Each email is logged as an
 * 'email' event; a failed email never fails the request.
 */
export async function submitStudyRequest(form: StudyRequestForm | FormData, options: SubmitOptions = {}): Promise<StudyRequestResult> {
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

  const ip = options.ip !== undefined ? options.ip : await requestIp();
  if (ip !== undefined && !(await allowRequest(ip))) {
    return { ok: false, error: 'Too many requests from your network. Please try again in an hour, or email us.' };
  }

  const sized = snapshot({ rooms: f.rooms, city: f.city, pool: f.pool, elecPrice: f.elecPrice });
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
    inputs: sized.inputs,
    results: sized.results,
    engineVersion: sized.engineVersion,
  });

  const logs = await sendStudyRequestEmails({
    id: leadId,
    hotelName: f.hotelName,
    city: f.city,
    rooms: f.rooms,
    pool: f.pool,
    elecPrice: f.elecPrice,
    contactName: f.contactName,
    email: f.email,
    phone: f.phone ?? null,
    message: f.message ?? null,
    results: sized.results,
    engineVersion: sized.engineVersion,
  });
  for (const log of logs) {
    if (log.status === 'failed') console.error(`[study request ${leadId}] ${log.template} email failed: ${log.error}`);
    try {
      await store().addLeadEvent(leadId, 'email', log);
    } catch (err) {
      console.error(`[study request ${leadId}] could not log the ${log.template} email`, err);
    }
  }
  return { ok: true, leadId };
}

/** The client IP from the request headers; null when the request has none; undefined outside a request. */
async function requestIp(): Promise<string | null | undefined> {
  let h: Headers;
  try {
    const { headers } = await import('next/headers');
    h = await headers();
  } catch {
    return undefined;
  }
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || null;
}

/** True when this client may send another request. Fails open: a database error never blocks a hotel. */
async function allowRequest(ip: string | null): Promise<boolean> {
  // Only a hash of the IP is stored (INPDP). Requests with no IP share one bucket.
  const key = createHash('sha256').update(`study-request:${ip ?? 'unknown'}`).digest('hex');
  try {
    return await store().takeRateLimitSlot(key, STUDY_REQUEST_LIMIT.max, STUDY_REQUEST_LIMIT.windowSeconds);
  } catch (err) {
    console.error('[study request] rate limit check failed, allowing the request', err);
    return true;
  }
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
