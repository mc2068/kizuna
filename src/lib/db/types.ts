// Contract 3 types (Role 4, Mohamed). STAND-IN until #6 lands.
import type { City, SizingInput, SizingResult } from '@/lib/engine';

export type Role = 'user' | 'admin';
export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';
export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost'];

export type CurrentUser = { id: string; email: string; role: Role };
export type Profile = { id: string; role: Role; fullName: string };

export type Project = {
  id: string;
  ownerId: string;
  hotelName: string;
  inputs: SizingInput;
  results: SizingResult;
  engineVersion: string;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  projectId: string | null;
  hotelName: string;
  city: City;
  rooms: number;
  contactName: string;
  email: string;
  phone: string | null;
  message: string;
  consent: boolean;
  inputs: SizingInput;
  results: SizingResult;
  engineVersion: string;
  status: LeadStatus;
  ownerId: string;
  createdAt: string;
  /** When the status last changed. Not in Contract 3 yet: the KPI "won this quarter" needs it
   *  (or a query on lead_events). */
  statusChangedAt: string;
};

export type LeadNote = { id: string; leadId: string; authorId: string; body: string; createdAt: string };
export type LeadEvent = {
  id: string;
  leadId: string;
  kind: 'created' | 'status' | 'owner' | 'email' | 'note' | 'file';
  data: Record<string, unknown>;
  actorId: string | null;
  createdAt: string;
};
export type LeadFile = {
  id: string;
  leadId: string;
  path: string;
  name: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
};

export type StudyRequestForm = {
  contactName: string;
  email: string;
  phone?: string | null;
  hotelName: string;
  city: City;
  rooms: number;
  pool: boolean;
  elecPrice?: number | null;
  message?: string;
  consent: boolean;
  projectId?: string | null;
};

export type SubmitResult = { ok: true; leadId: string } | { ok: false; error: string };
export type LeadFilters = { status?: LeadStatus; city?: City; mine?: boolean };
