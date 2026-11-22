// Contract 3: the data layer. Call these from Server Components, Server Actions and
// Route Handlers, never from the browser and never Supabase directly.
// IN-MEMORY FAKE until #6 swaps the bodies for Supabase; the signatures stay the same.
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
