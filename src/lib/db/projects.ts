import { ENGINE_VERSION, sizeHotel } from '@/lib/engine';
import { requireUser } from './auth';
import { db, newId, now } from './fake-store';
import type { Project, SaveProjectInput, SharedProject } from './types';
import { parseSizingInput } from './validation';

/** The signed-in user's projects, newest first ([] when signed out). */
export async function getMyProjects(): Promise<Project[]> {
  const user = db().user;
  if (!user) return [];
  return db()
    .projects.filter((p) => p.ownerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => structuredClone(p));
}

/** One of the signed-in user's projects, or null (also null for someone else's). */
export async function getProject(id: string): Promise<Project | null> {
  const user = db().user;
  const p = db().projects.find((x) => x.id === id && x.ownerId === user?.id);
  return p ? structuredClone(p) : null;
}

/** Runs the engine on the server: only the inputs are taken from the caller. */
export async function saveProject({ hotelName, inputs }: SaveProjectInput): Promise<Project> {
  const user = requireUser();
  const name = hotelName.trim();
  if (name.length < 1 || name.length > 160) throw new Error('Hotel name must be 1 to 160 characters.');
  const clean = parseSizingInput(inputs);
  const at = now();
  const project: Project = {
    id: newId(),
    ownerId: user.id,
    hotelName: name,
    inputs: clean,
    results: sizeHotel(clean),
    engineVersion: ENGINE_VERSION,
    shareToken: newId().replace(/-/g, ''),
    createdAt: at,
    updatedAt: at,
  };
  db().projects.push(project);
  return structuredClone(project);
}

export async function deleteProject(id: string): Promise<void> {
  const user = requireUser();
  const store = db();
  const i = store.projects.findIndex((p) => p.id === id && p.ownerId === user.id);
  if (i === -1) throw new Error('Project not found.');
  store.projects.splice(i, 1);
}

/** Public, read-only view of a project through its share link. */
export async function getSharedProject(token: string): Promise<SharedProject | null> {
  const p = db().projects.find((x) => x.shareToken === token);
  if (!p) return null;
  const { hotelName, inputs, results, engineVersion, createdAt } = structuredClone(p);
  return { hotelName, inputs, results, engineVersion, createdAt };
}
