// Contract 3: data. Owned by Role 4 (Mohamed). Everyone calls the functions in
// '@/lib/db', never Supabase directly. Change only by agreement, and update the
// contract in all four role files in docs/team/ in the same PR.
import type { City, SizingInput, SizingResult } from '@/lib/engine';

export type UserRole = 'user' | 'admin';

export type CurrentUser = { id: string; email: string; role: UserRole };

export type Profile = { id: string; role: UserRole; fullName: string };

export type Project = {
  id: string;
  ownerId: string;
  hotelName: string;
  inputs: SizingInput;
  /** Always computed on the server with sizeHotel, never sent by the browser. */
  results: SizingResult;
  engineVersion: string;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
};

/** What anyone with the share link can see: no owner, no id, no email. */
export type SharedProject = Pick<Project, 'hotelName' | 'inputs' | 'results' | 'engineVersion' | 'createdAt'>;

export type SaveProjectInput = { hotelName: string; inputs: SizingInput };

export const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: string;
  projectId: string | null;
  hotelName: string;
  city: City;
  rooms: number;
  contactName: string;
  email: string;
  phone: string | null;
  message: string | null;
  consent: boolean;
  inputs: SizingInput;
  results: SizingResult;
  engineVersion: string;
  status: LeadStatus;
  /** An admin profile id. */
  ownerId: string | null;
  createdAt: string;
};

export type LeadNote = { id: string; leadId: string; authorId: string; body: string; createdAt: string };

export type LeadEventKind = 'created' | 'status' | 'owner' | 'email' | 'note' | 'file';

export type LeadEvent = {
  id: string;
  leadId: string;
  kind: LeadEventKind;
  data: Record<string, unknown>;
  /** null = the system (e.g. an email sent automatically). */
  actorId: string | null;
  createdAt: string;
};

export type LeadFile = {
  id: string;
  leadId: string;
  /** Path inside the private 'lead-files' bucket. */
  path: string;
  name: string;
  /** Bytes. */
  size: number;
  uploadedBy: string;
  createdAt: string;
};

/** One lead with everything the lead page needs. Notes, events and files are newest first. */
export type LeadDetail = Lead & {
  owner: Profile | null;
  notes: LeadNote[];
  events: LeadEvent[];
  files: LeadFile[];
};

export type LeadFilters = { status?: LeadStatus; city?: City; mine?: boolean };

export type LeadCounts = Record<LeadStatus, number>;

export const emptyLeadCounts = (): LeadCounts => ({ new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 });

/** The Request a study form. Pass this object or the form's FormData. */
export type StudyRequestForm = {
  contactName: string;
  email: string;
  phone?: string;
  hotelName: string;
  city: City;
  rooms: number;
  pool: boolean;
  elecPrice: number | null;
  message?: string;
  consent: boolean;
  projectId?: string;
  /** Honeypot: must stay empty. */
  website?: string;
};

export type StudyRequestResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
