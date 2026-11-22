import { afterEach, describe, expect, it } from 'vitest';
import { sizeHotel, ENGINE_VERSION } from '@/lib/engine';
import { formatRange } from '@/lib/present';
import { composeStudyRequestEmails, parseAddressList, sendStudyRequestEmails, setMailerForTests, type EmailLead } from '.';

const results = sizeHotel({ rooms: 300, city: 'djerba', pool: true, elecPrice: null });

const lead: EmailLead = {
  id: 'L-1042',
  hotelName: 'Hotel Les Dunes',
  city: 'djerba',
  rooms: 300,
  pool: true,
  elecPrice: null,
  contactName: 'Leila Trabelsi',
  email: 'leila@hotel.example',
  phone: null,
  message: 'Open all year.\nWe also have a spa.',
  results,
  engineVersion: ENGINE_VERSION,
};

afterEach(() => {
  setMailerForTests(undefined);
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.TEAM_NOTIFY_EMAIL;
});

describe('study request emails', () => {
  it('tells the team who asked, the screening and where to open the lead', async () => {
    const { 'team-new-lead': team } = await composeStudyRequestEmails(lead, ['team@kizuna.example']);
    expect(team.subject).toBe('New study request: Hotel Les Dunes (Djerba, 300 rooms)');
    expect(team.to).toEqual(['team@kizuna.example']);
    expect(team.replyTo).toEqual(['leila@hotel.example']);
    expect(team.html).toContain('http://localhost:3000/admin/leads/L-1042');
    for (const s of ['Leila Trabelsi', 'leila@hotel.example', 'Not given', 'STEG time-of-use tariff', 'We also have a spa.']) {
      expect(team.text).toContain(s);
    }
    expect(team.text).toContain(formatRange(results, 'paybackYears').text);
    expect(team.text).toContain(ENGINE_VERSION);
  });

  it('thanks the hotel with what happens next, its screening and the privacy notice', async () => {
    const { 'hotel-confirmation': hotel } = await composeStudyRequestEmails(lead, ['team@kizuna.example']);
    expect(hotel.subject).toBe('We received your study request for Hotel Les Dunes');
    expect(hotel.to).toEqual(['leila@hotel.example']);
    expect(hotel.replyTo).toEqual(['team@kizuna.example']);
    expect(hotel.text).toMatch(/Thank you, Leila Trabelsi/i);
    expect(hotel.text).toContain('L-1042');
    expect(hotel.text).toContain('What happens next');
    expect(hotel.text).toContain(formatRange(results, 'annualSavingsTnd').text);
    expect(hotel.html).toContain('http://localhost:3000/privacy');
    expect(hotel.text).toContain('[PRODUCT NAME]');
    // The hotel never sees internal links.
    expect(hotel.html).not.toContain('/admin');
  });

  it('escapes what the visitor typed', async () => {
    const { 'team-new-lead': team } = await composeStudyRequestEmails(
      { ...lead, hotelName: '<script>x</script>', message: '<img src=x onerror=alert(1)>' },
      [],
    );
    expect(team.html).not.toContain('<script>x</script>');
    expect(team.html).not.toContain('<img src=x');
  });

  it('skips both emails when Resend is not configured', async () => {
    const logs = await sendStudyRequestEmails(lead);
    expect(logs.map((l) => [l.template, l.status, l.error])).toEqual([
      ['team-new-lead', 'skipped', 'RESEND_API_KEY is not set.'],
      ['hotel-confirmation', 'skipped', 'RESEND_API_KEY is not set.'],
    ]);
  });

  it('needs EMAIL_FROM with a Resend key', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const logs = await sendStudyRequestEmails(lead);
    expect(logs.every((l) => l.status === 'skipped' && l.error === 'EMAIL_FROM is not set.')).toBe(true);
  });

  it('reports each email on its own: one can fail while the other is sent', async () => {
    process.env.TEAM_NOTIFY_EMAIL = 'team@kizuna.example';
    setMailerForTests({
      send: async (email) => {
        if (email.to.includes('leila@hotel.example')) throw new Error('Invalid recipient');
        return { id: 'msg-1' };
      },
    });
    const logs = await sendStudyRequestEmails(lead);
    expect(logs).toEqual([
      { template: 'team-new-lead', to: ['team@kizuna.example'], status: 'sent', providerId: 'msg-1' },
      { template: 'hotel-confirmation', to: ['leila@hotel.example'], status: 'failed', error: 'Invalid recipient' },
    ]);
  });
});

describe('parseAddressList', () => {
  it('splits and trims a comma-separated list', () => {
    expect(parseAddressList(' a@x.tn, b@x.tn ,,')).toEqual(['a@x.tn', 'b@x.tn']);
    expect(parseAddressList(undefined)).toEqual([]);
  });
});
