// Pieces shared by the study request emails (#19): the data they need, the translator type and the
// screening summary table. Inline styles only: email clients ignore stylesheets.
import { Column, Row, Section, Text } from 'react-email';
import type { City, SizingResult } from '@/lib/engine';
import { formatRange, verdictKey } from '@/lib/present';

/** What both emails show about one study request. Results are the server's snapshot. */
export type EmailLead = {
  id: string;
  hotelName: string;
  city: City;
  rooms: number;
  pool: boolean;
  elecPrice: number | null;
  contactName: string;
  email: string;
  phone: string | null;
  message: string | null;
  results: SizingResult;
  engineVersion: string;
};

/** A next-intl translator over all namespaces: t('emails.yes'), t('engine.verdicts.goodFit'). */
export type Translate = (key: string, values?: Record<string, string | number>) => string;

export const styles = {
  body: { backgroundColor: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', margin: 0, padding: '24px 0' },
  container: { backgroundColor: '#ffffff', borderRadius: '12px', margin: '0 auto', maxWidth: '560px', padding: '32px' },
  heading: { color: '#1d1d1f', fontSize: '24px', fontWeight: 600, lineHeight: '30px', margin: '0 0 16px' },
  subheading: { color: '#1d1d1f', fontSize: '17px', fontWeight: 600, margin: '24px 0 8px' },
  text: { color: '#1d1d1f', fontSize: '15px', lineHeight: '22px', margin: '0 0 12px' },
  muted: { color: '#6e6e73', fontSize: '13px', lineHeight: '19px', margin: '12px 0 0' },
  label: { color: '#6e6e73', fontSize: '14px', lineHeight: '20px', margin: '4px 0' },
  value: { color: '#1d1d1f', fontSize: '14px', lineHeight: '20px', margin: '4px 0', fontWeight: 500 },
  button: { backgroundColor: '#0071e3', borderRadius: '980px', color: '#ffffff', display: 'inline-block', fontSize: '15px', fontWeight: 500, padding: '12px 22px', textDecoration: 'none' },
  link: { color: '#0066cc' },
} as const;

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Row>
      <Column style={{ width: '40%', verticalAlign: 'top' }}>
        <Text style={styles.label}>{label}</Text>
      </Column>
      <Column>
        <Text style={styles.value}>{value}</Text>
      </Column>
    </Row>
  );
}

/** Verdict, plant and the three headline ranges, formatted by src/lib/present (never by hand). */
export function ScreeningSummary({ lead, t }: { lead: EmailLead; t: Translate }) {
  const r = lead.results;
  const plant = r.chillerKwc > 0
    ? t('emails.summary.plantValue', { engineKwe: r.engineKwe, chillerKwc: r.chillerKwc })
    : t('emails.summary.noChiller', { engineKwe: r.engineKwe });
  return (
    <Section>
      <DetailRow label={t('emails.summary.verdict')} value={t(`engine.${verdictKey(r.verdict)}`)} />
      <DetailRow label={t('emails.summary.plant')} value={plant} />
      <DetailRow label={t('emails.summary.payback')} value={formatRange(r, 'paybackYears').text} />
      <DetailRow label={t('emails.summary.savings')} value={formatRange(r, 'annualSavingsTnd').text} />
      <DetailRow label={t('emails.summary.capex')} value={formatRange(r, 'capexTnd').text} />
    </Section>
  );
}
