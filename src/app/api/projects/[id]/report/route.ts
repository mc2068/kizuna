// GET /api/projects/:id/report: the owner's PDF report (#23), from the stored snapshot.
// getProject only returns the signed-in owner's project, so anyone else gets a 404.
import { getProject } from '@/lib/db';
import { reportResponse } from '@/lib/report/render';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return new Response('Not found', { status: 404 });
  return reportResponse(project);
}
