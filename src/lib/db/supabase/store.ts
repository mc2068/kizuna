// The Supabase DataStore. Every read and write runs as the signed-in visitor, so the RLS policies in
// supabase/migrations decide what they see. Only the two inserts whose rows carry server-computed
// results use the service role: insertProject (for the verified user) and insertLead.
// Lead events (created, status, owner, note, file) are written by database triggers.
import type { PostgrestError } from '@supabase/supabase-js';
import type { City, SizingInput, SizingResult } from '@/lib/engine';
import { createServiceClient, createUserClient } from '@/lib/supabase/server';
import type { Tables, TablesUpdate } from '@/lib/supabase/types';
import type { DataStore } from '../store';
import { emptyLeadCounts, LEAD_STATUSES, type Lead, type LeadEvent, type LeadFile, type LeadNote, type Profile, type Project } from '../types';
import { isUuid, safeFileName } from '../validation';

const BUCKET = 'lead-files';
/** Signed download links live this long (seconds). */
const FILE_URL_TTL = 60;

function fail(error: PostgrestError | Error, fallback?: string): never {
  // 23503 = foreign key violation (the lead does not exist).
  if ('code' in error && error.code === '23503' && fallback) throw new Error(fallback);
  throw new Error(error.message);
}

const toProfile = (r: Pick<Tables<'profiles'>, 'id' | 'role' | 'full_name'>): Profile => ({ id: r.id, role: r.role, fullName: r.full_name });

const toProject = (r: Tables<'projects'>): Project => ({
  id: r.id,
  ownerId: r.owner_id,
  hotelName: r.hotel_name,
  inputs: r.inputs as SizingInput,
  results: r.results as SizingResult,
  engineVersion: r.engine_version,
  shareToken: r.share_token,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toLead = (r: Tables<'leads'>): Lead => ({
  id: r.id,
  projectId: r.project_id,
  hotelName: r.hotel_name,
  city: r.city as City,
  rooms: r.rooms,
  contactName: r.contact_name,
  email: r.email,
  phone: r.phone,
  message: r.message,
  consent: r.consent,
  inputs: r.inputs as SizingInput,
  results: r.results as SizingResult,
  engineVersion: r.engine_version,
  status: r.status,
  ownerId: r.owner_id,
  createdAt: r.created_at,
});

const toNote = (r: Tables<'lead_notes'>): LeadNote => ({ id: r.id, leadId: r.lead_id, authorId: r.author_id, body: r.body, createdAt: r.created_at });

const toEvent = (r: Tables<'lead_events'>): LeadEvent => ({
  id: r.id,
  leadId: r.lead_id,
  kind: r.kind,
  data: (r.data ?? {}) as Record<string, unknown>,
  actorId: r.actor_id,
  createdAt: r.created_at,
});

const toFile = (r: Tables<'lead_files'>): LeadFile => ({
  id: r.id,
  leadId: r.lead_id,
  path: r.path,
  name: r.name,
  size: r.size,
  uploadedBy: r.uploaded_by,
  createdAt: r.created_at,
});

/** The two columns an admin may change (see the column grants in the migration). */
async function updateLead(id: string, patch: Pick<TablesUpdate<'leads'>, 'status' | 'owner_id'>): Promise<Lead> {
  const sb = await createUserClient();
  const { data, error } = await sb.from('leads').update(patch).eq('id', id).select('*').maybeSingle();
  if (error) fail(error);
  if (!data) throw new Error('Lead not found.');
  return toLead(data);
}

const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export const supabaseStore: DataStore = {
  async currentUser() {
    const sb = await createUserClient();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
    return { id: data.user.id, email: data.user.email ?? '', role: profile?.role ?? 'user' };
  },

  async listAdmins() {
    const sb = await createUserClient();
    const { data, error } = await sb.from('profiles').select('id, role, full_name').eq('role', 'admin').order('created_at').order('id');
    if (error) fail(error);
    return data.map(toProfile);
  },

  async myProjects() {
    const sb = await createUserClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return [];
    const { data, error } = await sb.from('projects').select('*').eq('owner_id', auth.user.id).order('created_at', { ascending: false });
    if (error) fail(error);
    return data.map(toProject);
  },

  async project(id) {
    if (!isUuid(id)) return null;
    const sb = await createUserClient();
    const { data, error } = await sb.from('projects').select('*').eq('id', id).maybeSingle();
    if (error) fail(error);
    return data ? toProject(data) : null;
  },

  async insertProject({ hotelName, inputs, results, engineVersion }) {
    const sb = await createUserClient();
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) throw new Error('You must be signed in.');
    const { data, error } = await createServiceClient()
      .from('projects')
      .insert({ owner_id: auth.user.id, hotel_name: hotelName, inputs, results, engine_version: engineVersion })
      .select('*')
      .single();
    if (error) fail(error);
    return toProject(data);
  },

  async deleteProject(id) {
    if (!isUuid(id)) throw new Error('Project not found.');
    const sb = await createUserClient();
    const { data, error } = await sb.from('projects').delete().eq('id', id).select('id');
    if (error) fail(error);
    if (data.length === 0) throw new Error('Project not found.');
  },

  async sharedProject(token) {
    const sb = await createUserClient();
    const { data, error } = await sb.rpc('get_shared_project', { token });
    if (error) fail(error);
    const row = data[0];
    if (!row) return null;
    return {
      hotelName: row.hotel_name,
      inputs: row.inputs as SizingInput,
      results: row.results as SizingResult,
      engineVersion: row.engine_version,
      createdAt: row.created_at,
    };
  },

  async ownsProject(id) {
    // RLS returns the row only to its owner.
    return (await this.project(id)) !== null;
  },

  async insertLead(row) {
    const { data, error } = await createServiceClient()
      .from('leads')
      .insert({
        project_id: row.projectId,
        hotel_name: row.hotelName,
        city: row.city,
        rooms: row.rooms,
        contact_name: row.contactName,
        email: row.email,
        phone: row.phone,
        message: row.message,
        consent: row.consent,
        inputs: row.inputs,
        results: row.results,
        engine_version: row.engineVersion,
      })
      .select('id')
      .single();
    if (error) fail(error);
    return data.id;
  },

  async listLeads({ status, city, ownerId }) {
    const sb = await createUserClient();
    let q = sb.from('leads').select('*');
    if (status) q = q.eq('status', status);
    if (city) q = q.eq('city', city);
    if (ownerId) q = q.eq('owner_id', ownerId);
    const { data, error } = await q.order('created_at', { ascending: false }).order('id', { ascending: false });
    if (error) fail(error);
    return data.map(toLead);
  },

  async leadCounts() {
    const sb = await createUserClient();
    const counts = emptyLeadCounts();
    // One count per status (exact, so it never stops at the API's row limit).
    await Promise.all(
      LEAD_STATUSES.map(async (status) => {
        const { count, error } = await sb.from('leads').select('id', { count: 'exact', head: true }).eq('status', status);
        if (error) fail(error);
        counts[status] = count ?? 0;
      }),
    );
    return counts;
  },

  async lead(id) {
    const sb = await createUserClient();
    const { data, error } = await sb
      .from('leads')
      .select('*, owner:profiles!leads_owner_id_fkey(id, role, full_name), lead_notes(*), lead_events(*), lead_files(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) fail(error);
    if (!data) return null;
    const { owner, lead_notes, lead_events, lead_files, ...lead } = data;
    return {
      ...toLead(lead),
      owner: owner ? toProfile(owner) : null,
      notes: lead_notes.map(toNote).sort(newestFirst),
      events: lead_events.map(toEvent).sort(newestFirst),
      files: lead_files.map(toFile).sort(newestFirst),
    };
  },

  // actorId is not needed: the triggers log auth.uid() as the actor.
  async setLeadStatus(id, status) {
    return updateLead(id, { status });
  },

  async assignLead(id, ownerId) {
    if (!isUuid(ownerId)) throw new Error('A lead can only be owned by an admin.');
    return updateLead(id, { owner_id: ownerId });
  },

  async addLeadNote(id, body, actorId) {
    const sb = await createUserClient();
    const { data, error } = await sb.from('lead_notes').insert({ lead_id: id, body, author_id: actorId }).select('*').single();
    if (error) fail(error, 'Lead not found.');
    return toNote(data);
  },

  async uploadLeadFile(id, file, actorId) {
    const sb = await createUserClient();
    const { data: lead } = await sb.from('leads').select('id').eq('id', id).maybeSingle();
    if (!lead) throw new Error('Lead not found.');
    const fileId = crypto.randomUUID();
    const path = `${id}/${fileId}-${safeFileName(file.name)}`;
    const upload = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (upload.error) fail(upload.error);
    const { data, error } = await sb
      .from('lead_files')
      .insert({ id: fileId, lead_id: id, path, name: file.name, size: file.size, uploaded_by: actorId })
      .select('*')
      .single();
    if (error) {
      await sb.storage.from(BUCKET).remove([path]);
      fail(error);
    }
    return toFile(data);
  },

  async leadFileUrl(fileId) {
    if (!isUuid(fileId)) return null;
    const sb = await createUserClient();
    const { data: row } = await sb.from('lead_files').select('path').eq('id', fileId).maybeSingle();
    if (!row) return null;
    const { data } = await sb.storage.from(BUCKET).createSignedUrl(row.path, FILE_URL_TTL);
    return data?.signedUrl ?? null;
  },
};
