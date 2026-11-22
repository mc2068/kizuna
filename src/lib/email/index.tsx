// Transactional email with Resend (#19). Server only: '@/lib/db' calls this after a study request.
// Env: RESEND_API_KEY (unset = emails are skipped and logged as such), EMAIL_FROM ("Name <team@domain>",
// a domain verified in Resend), TEAM_NOTIFY_EMAIL (comma-separated team addresses).
import { createTranslator } from 'next-intl';
import type { ReactElement } from 'react';
import { render } from 'react-email';
import { Resend } from 'resend';
import { siteConfig } from '@/config/site';
import HotelConfirmation from '@/emails/HotelConfirmation';
import type { EmailLead, Translate } from '@/emails/shared';
import TeamNewLead from '@/emails/TeamNewLead';
import { loadMessages } from '@/i18n/request';

export type { EmailLead } from '@/emails/shared';

export type OutgoingEmail = { to: string[]; subject: string; html: string; text: string; replyTo?: string[] };

export interface Mailer {
  /** Resolves with the provider's message id; rejects when the provider refuses the email. */
  send(email: OutgoingEmail): Promise<{ id: string }>;
}

export type EmailTemplate = 'team-new-lead' | 'hotel-confirmation';

/** One send attempt, as stored in the lead's History (lead_events kind 'email'). */
export type EmailLog = {
  template: EmailTemplate;
  to: string[];
  status: 'sent' | 'failed' | 'skipped';
  providerId?: string;
  error?: string;
};

/** "a@x.tn, b@x.tn" -> ["a@x.tn", "b@x.tn"]. */
export function parseAddressList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean);
}

export const resendMailer = (apiKey: string, from: string): Mailer => {
  const resend = new Resend(apiKey);
  return {
    async send({ to, subject, html, text, replyTo }) {
      const { data, error } = await resend.emails.send({ from, to, subject, html, text, replyTo });
      if (error || !data) throw new Error(error?.message ?? 'Resend returned no message id.');
      return { id: data.id };
    },
  };
};

let mailerOverride: Mailer | null | undefined;

/** Tests only: capture emails (a Mailer), turn email off (null), or go back to the environment (undefined). */
export function setMailerForTests(mailer: Mailer | null | undefined): void {
  mailerOverride = mailer;
}

type MailerChoice = { mailer: Mailer } | { mailer: null; reason: string };

function chooseMailer(): MailerChoice {
  if (mailerOverride !== undefined) return mailerOverride ? { mailer: mailerOverride } : { mailer: null, reason: 'Email is turned off.' };
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { mailer: null, reason: 'RESEND_API_KEY is not set.' };
  const from = process.env.EMAIL_FROM;
  if (!from) return { mailer: null, reason: 'EMAIL_FROM is not set.' };
  return { mailer: resendMailer(apiKey, from) };
}

async function translator(): Promise<Translate> {
  const messages = await loadMessages(siteConfig.locale);
  return createTranslator({ locale: siteConfig.locale, messages }) as unknown as Translate;
}

async function compose(element: ReactElement, subject: string, to: string[], replyTo?: string[]): Promise<OutgoingEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { to, subject, html, text, ...(replyTo?.length ? { replyTo } : {}) };
}

/** The two emails for a new study request, ready to send. Exported for tests and previews. */
export async function composeStudyRequestEmails(lead: EmailLead, team: string[]): Promise<Record<EmailTemplate, OutgoingEmail>> {
  const t = await translator();
  const city = t(`emails.cities.${lead.city}`);
  const adminUrl = new URL(`/admin/leads/${encodeURIComponent(lead.id)}`, siteConfig.url).toString();
  const privacyUrl = new URL('/privacy', siteConfig.url).toString();
  const [teamEmail, hotelEmail] = await Promise.all([
    compose(
      <TeamNewLead lead={lead} adminUrl={adminUrl} t={t} />,
      t('emails.teamNewLead.subject', { hotel: lead.hotelName, city, rooms: lead.rooms }),
      team,
      [lead.email],
    ),
    compose(
      <HotelConfirmation lead={lead} privacyUrl={privacyUrl} productName={siteConfig.name} t={t} />,
      t('emails.hotelConfirmation.subject', { hotel: lead.hotelName }),
      [lead.email],
      team,
    ),
  ]);
  return { 'team-new-lead': teamEmail, 'hotel-confirmation': hotelEmail };
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Sends the team notification and the hotel confirmation. Never throws: each email's outcome comes back as an
 * EmailLog (sent, failed with the provider's error, or skipped when email is not configured).
 */
export async function sendStudyRequestEmails(lead: EmailLead): Promise<EmailLog[]> {
  const team = parseAddressList(process.env.TEAM_NOTIFY_EMAIL);
  const choice = chooseMailer();
  let emails: Record<EmailTemplate, OutgoingEmail>;
  try {
    emails = await composeStudyRequestEmails(lead, team);
  } catch (err) {
    const error = `Could not build the email: ${message(err)}`;
    return [
      { template: 'team-new-lead', to: team, status: 'failed', error },
      { template: 'hotel-confirmation', to: [lead.email], status: 'failed', error },
    ];
  }
  return Promise.all(
    (Object.entries(emails) as [EmailTemplate, OutgoingEmail][]).map(async ([template, email]): Promise<EmailLog> => {
      const base = { template, to: email.to };
      if (!choice.mailer) return { ...base, status: 'skipped', error: choice.reason };
      if (!email.to.length) return { ...base, status: 'skipped', error: 'TEAM_NOTIFY_EMAIL is not set.' };
      try {
        const { id } = await choice.mailer.send(email);
        return { ...base, status: 'sent', providerId: id };
      } catch (err) {
        return { ...base, status: 'failed', error: message(err) };
      }
    }),
  );
}
