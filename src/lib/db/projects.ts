import { ENGINE_VERSION, sizeHotel } from '@/lib/engine';
import { requireUser } from './auth';
import { store } from './store';
import type { Project, SaveProjectInput, SharedProject } from './types';
import { parseSizingInput } from './validation';

/** The signed-in user's projects, newest first ([] when signed out). */
export async function getMyProjects(): Promise<Project[]> {
  return store().myProjects();
}

/** One of the signed-in user's projects, or null (also null for someone else's). */
export async function getProject(id: string): Promise<Project | null> {
  return store().project(id);
}

/** Runs the engine on the server: only the inputs are taken from the caller. */
export async function saveProject({ hotelName, inputs }: SaveProjectInput): Promise<Project> {
  await requireUser();
  const name = hotelName.trim();
  if (name.length < 1 || name.length > 160) throw new Error('Hotel name must be 1 to 160 characters.');
  const clean = parseSizingInput(inputs);
  return store().insertProject({ hotelName: name, inputs: clean, results: sizeHotel(clean), engineVersion: ENGINE_VERSION });
}

export async function deleteProject(id: string): Promise<void> {
  await requireUser();
  await store().deleteProject(id);
}

/** Public, read-only view of a project through its share link. */
export async function getSharedProject(token: string): Promise<SharedProject | null> {
  return store().sharedProject(token);
}
