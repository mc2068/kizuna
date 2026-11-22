// GET /api/share/:token/report: the PDF report for anyone with the share link (#23), from the stored snapshot.
import { getSharedProject } from '@/lib/db';
import { reportResponse } from '@/lib/report/render';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const project = await getSharedProject(token);
  if (!project) return new Response('Not found', { status: 404 });
  return reportResponse(project);
}
