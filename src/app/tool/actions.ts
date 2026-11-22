'use server';
// "Save this project" on /tool (#21). Only the hotel name and the inputs come from the browser:
// saveProject validates the inputs again and runs the engine on the server.
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { cleanHotelName } from '@/components/tool/pending-project';
import { getCurrentUser, saveProject } from '@/lib/db';
import type { SizingInput } from '@/lib/engine';

export type SaveProjectResult =
  | { ok: true; id: string }
  | { ok: false; error: 'signedOut' | 'invalidName' | 'invalidInputs' | 'failed' };

export async function saveToolProject(input: { hotelName: string; inputs: SizingInput }): Promise<SaveProjectResult> {
  if (!(await getCurrentUser())) return { ok: false, error: 'signedOut' };
  const hotelName = cleanHotelName(String(input?.hotelName ?? ''));
  if (!hotelName) return { ok: false, error: 'invalidName' };
  try {
    const project = await saveProject({ hotelName, inputs: input.inputs });
    revalidatePath('/projects');
    return { ok: true, id: project.id };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: 'invalidInputs' };
    console.error('saveToolProject failed', error);
    return { ok: false, error: 'failed' };
  }
}
