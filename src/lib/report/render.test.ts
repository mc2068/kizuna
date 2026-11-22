import { describe, expect, it } from 'vitest';
import { snapshot } from '@/lib/engine';
import { renderReport, reportFilename, reportResponse } from './render';

const data = (inputs: Parameters<typeof snapshot>[0]) => ({
  hotelName: 'Hôtel Djerba Plage',
  createdAt: '2026-11-22T09:00:00Z',
  ...snapshot(inputs),
});

describe('renderReport', () => {
  it('renders the demo hotel to a real PDF', async () => {
    const pdf = await renderReport(data({ rooms: 300, city: 'djerba', pool: true, elecPrice: null }));
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(10_000);
  }, 30_000);

  it('renders a weak fit with warnings and a single column', async () => {
    const pdf = await renderReport(data({ rooms: 50, city: 'tozeur', pool: false, elecPrice: 0.05 }));
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  }, 30_000);
});

describe('download', () => {
  it('names the file after the hotel', () => {
    expect(reportFilename('Hôtel Djerba Plage')).toBe('hotel-djerba-plage-screening.pdf');
    expect(reportFilename('  "Résidence" / Sousse!  ')).toBe('residence-sousse-screening.pdf');
    expect(reportFilename('فندق')).toBe('hotel-screening.pdf');
  });

  it('sends a private, uncached attachment', async () => {
    const res = await reportResponse(data({ rooms: 300, city: 'djerba', pool: true, elecPrice: null }));
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="hotel-djerba-plage-screening.pdf"');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  }, 30_000);
});
