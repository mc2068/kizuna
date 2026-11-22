'use server';
// Server Actions for the lead page. Each one goes through '@/lib/db', which checks that the caller
// is an admin (and Supabase RLS checks again), then refreshes the page so History shows the event
// the change just logged. Errors are returned, not thrown, so the page can show them.
import { revalidatePath } from 'next/cache';
import { addLeadNote, assignLead, getLeadFileUrl, LEAD_STATUSES, setLeadStatus, type LeadStatus } from '@/lib/db';

export type ActionResult = { ok: true } | { ok: false; error: string };

const leadPath = (id: string) => `/admin/leads/${encodeURIComponent(id)}`;

async function run(id: string, change: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await change();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Something went wrong.' };
  }
  revalidatePath(leadPath(id));
  return { ok: true };
}

export async function changeStatusAction(id: string, status: LeadStatus): Promise<ActionResult> {
  if (!LEAD_STATUSES.includes(status)) return { ok: false, error: 'Unknown status.' };
  return run(id, () => setLeadStatus(id, status));
}

export async function reassignAction(id: string, ownerId: string): Promise<ActionResult> {
  return run(id, () => assignLead(id, ownerId));
}

export async function addNoteAction(id: string, body: string): Promise<ActionResult> {
  if (typeof body !== 'string' || !body.trim()) return { ok: false, error: 'A note cannot be empty.' };
  if (body.length > 5000) return { ok: false, error: 'A note can be at most 5,000 characters.' };
  return run(id, () => addLeadNote(id, body));
}

/** A short-lived download URL (a 60 s signed Storage URL with Supabase). null for non-admins. */
export async function fileUrlAction(fileId: string): Promise<string | null> {
  if (typeof fileId !== 'string') return null;
  return getLeadFileUrl(fileId);
}
