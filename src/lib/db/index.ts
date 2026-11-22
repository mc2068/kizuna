// Contract 3: the data layer. Call these from Server Components, Server Actions and
// Route Handlers, never from the browser and never Supabase directly.
// Backed by Supabase when NEXT_PUBLIC_SUPABASE_URL is set, else by an in-memory fake with the
// same rules and demo data (see store.ts).
export { getCurrentUser, listAdmins } from './auth';
export { getMyProjects, getProject, saveProject, deleteProject, getSharedProject } from './projects';
export {
  submitStudyRequest,
  listLeads,
  getLeadCounts,
  getLead,
  setLeadStatus,
  assignLead,
  addLeadNote,
  uploadLeadFile,
  getLeadFileUrl,
} from './leads';
export * from './types';
