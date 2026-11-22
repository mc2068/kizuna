// Render a stored snapshot to PDF bytes, and the HTTP response the two report routes send (#23).
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { buildReport, type ReportData } from './model';
import { ReportDocument, registerFonts } from './Report';

export async function renderReport(data: ReportData): Promise<Buffer> {
  registerFonts();
  const doc = createElement(ReportDocument, { model: buildReport(data) }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(doc);
}

/** "Hôtel Djerba Plage" -> "hotel-djerba-plage-screening.pdf". */
export function reportFilename(hotelName: string): string {
  const slug = hotelName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${slug || 'hotel'}-screening.pdf`;
}

/** The PDF as a download. Never cached: owner reports are private and share links can be revoked. */
export async function reportResponse(data: ReportData): Promise<Response> {
  const pdf = await renderReport(data);
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${reportFilename(data.hotelName)}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
