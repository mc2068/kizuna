'use server';
// My projects (#22): rename, delete and re-run. Each goes through '@/lib/db', which checks the
// signed-in owner (Supabase RLS on top), so a visitor can only change their own projects.
import { revalidatePath } from 'next/cache';
import { cleanHotelName } from '@/components/tool/pending-project';
import { deleteProject, renameProject, rerunProject } from '@/lib/db';

export type ProjectActionResult = { ok: true } | { ok: false; error: 'invalidName' | 'failed' };

async function run(fn: () => Promise<unknown>): Promise<ProjectActionResult> {
  try {
    await fn();
    revalidatePath('/projects');
    return { ok: true };
  } catch (error) {
    console.error('project action failed', error);
    return { ok: false, error: 'failed' };
  }
}

export async function renameProjectAction(id: string, hotelName: string): Promise<ProjectActionResult> {
  const name = cleanHotelName(String(hotelName ?? ''));
  if (!name) return { ok: false, error: 'invalidName' };
  return run(() => renameProject(String(id), name));
}

export async function deleteProjectAction(id: string): Promise<ProjectActionResult> {
  return run(() => deleteProject(String(id)));
}

export async function rerunProjectAction(id: string): Promise<ProjectActionResult> {
  return run(() => rerunProject(String(id)));
}
