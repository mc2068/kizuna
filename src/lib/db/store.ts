// The storage seam behind Contract 3. The public functions in projects.ts, leads.ts and auth.ts
// do the validation, the engine run and the role checks once; a DataStore only reads and writes.
// Two adapters: Supabase (when NEXT_PUBLIC_SUPABASE_URL is set) and the in-memory fake (otherwise,
// so the site runs with no database). Both enforce the same access rules: the fake by hand,
// Supabase through row-level security.
import type { SizingInput, SizingResult } from '@/lib/engine';
import { fakeStore } from './fake/store';
import { supabaseStore } from './supabase/store';
import type {
  CurrentUser,
  Lead,
  LeadDetail,
  LeadFile,
  LeadFilters,
  LeadCounts,
  LeadEventKind,
  LeadNote,
  LeadStatus,
  Profile,
  Project,
  SharedProject,
} from './types';

export type NewProject = { hotelName: string; inputs: SizingInput; results: SizingResult; engineVersion: string };

export type NewLead = Omit<Lead, 'id' | 'status' | 'ownerId' | 'createdAt'>;

export type LeadQuery = Omit<LeadFilters, 'mine'> & { ownerId?: string };

export interface DataStore {
  currentUser(): Promise<CurrentUser | null>;
  /** Admins in the order they joined ([] for non-admins). */
  listAdmins(): Promise<Profile[]>;

  myProjects(): Promise<Project[]>;
  /** null when missing or not the signed-in user's. */
  project(id: string): Promise<Project | null>;
  /** Saves for the signed-in user; throws when signed out. */
  insertProject(row: NewProject): Promise<Project>;
  /** Throws 'Project not found.' when missing or not the signed-in user's. */
  deleteProject(id: string): Promise<void>;
  sharedProject(token: string): Promise<SharedProject | null>;
  /** True only when the project exists and belongs to the signed-in user. */
  ownsProject(id: string): Promise<boolean>;

  /** Server-side insert (no user policy); picks the owner and logs a 'created' event. Returns the lead id. */
  insertLead(row: NewLead): Promise<string>;
  /** Newest first. Admins only, [] otherwise. */
  listLeads(query: LeadQuery): Promise<Lead[]>;
  /** Leads per status. Admins only, all zero otherwise. */
  leadCounts(): Promise<LeadCounts>;
  lead(id: string): Promise<LeadDetail | null>;
  /** The mutations below log their own events; actorId is the signed-in admin. */
  setLeadStatus(id: string, status: LeadStatus, actorId: string): Promise<Lead>;
  assignLead(id: string, ownerId: string, actorId: string): Promise<Lead>;
  addLeadNote(id: string, body: string, actorId: string): Promise<LeadNote>;
  uploadLeadFile(id: string, file: File, actorId: string): Promise<LeadFile>;
  leadFileUrl(fileId: string): Promise<string | null>;
  /** Server-side: a History event written by the system (actor null), e.g. an email sent automatically. */
  addLeadEvent(leadId: string, kind: LeadEventKind, data: Record<string, unknown>): Promise<void>;

  /**
   * Server-side rate limit: records one attempt for `key` and returns true, or returns false (recording
   * nothing) when `key` already made `limit` attempts in the last `windowSeconds`.
   */
  takeRateLimitSlot(key: string, limit: number, windowSeconds: number): Promise<boolean>;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

let chosen: DataStore | undefined;

export function store(): DataStore {
  chosen ??= pick();
  return chosen;
}

function pick(): DataStore {
  if (isSupabaseConfigured()) return supabaseStore;
  // A production deploy with a missing variable must not quietly keep study requests in memory.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_FAKE_DB !== '1') {
    throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL (or ALLOW_FAKE_DB=1 for a demo build).');
  }
  return fakeStore;
}

/** Tests only: force one adapter (undefined = choose from the environment again). */
export function setStoreForTests(s: DataStore | undefined): void {
  chosen = s;
}
