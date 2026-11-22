// POST /admin/leads/[id]/files: upload one file (multipart field "file") to the private
// 'lead-files' bucket. A Route Handler rather than a Server Action because Server Action bodies
// are capped at 1 MB by default and the Files tab accepts up to 10 MB.
import { revalidatePath } from 'next/cache';
import { getCurrentUser, uploadLeadFile } from '@/lib/db';
import { fileProblem } from '@/components/lead/file-rules';

const PROBLEM_TEXT = {
  tooBig: 'The file is larger than 10 MB.',
  badType: 'Only PDF, images, Word and Excel files are accepted.',
  empty: 'The file is empty.',
} as const;

export async function POST(request: Request, ctx: RouteContext<'/admin/leads/[id]/files'>) {
  // uploadLeadFile checks too; refusing first avoids reading a non-admin's upload body.
  if ((await getCurrentUser())?.role !== 'admin') return Response.json({ ok: false, error: 'Admins only.' }, { status: 403 });
  const { id } = await ctx.params;

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get('file');
  } catch {
    return Response.json({ ok: false, error: 'Send the file as multipart form data.' }, { status: 400 });
  }
  if (!(file instanceof File)) return Response.json({ ok: false, error: 'No file was sent.' }, { status: 400 });

  const problem = fileProblem(file);
  if (problem) return Response.json({ ok: false, error: PROBLEM_TEXT[problem] }, { status: 400 });

  try {
    const row = await uploadLeadFile(id, file);
    revalidatePath(`/admin/leads/${encodeURIComponent(id)}`);
    return Response.json({ ok: true, file: row });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Upload failed.';
    return Response.json({ ok: false, error }, { status: error === 'Lead not found.' ? 404 : 500 });
  }
}
