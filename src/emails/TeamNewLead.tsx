// Sent to the team (TEAM_NOTIFY_EMAIL) for every study request (#19).
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'react-email';
import { verdictKey } from '@/lib/present';
import { DetailRow, ScreeningSummary, styles, type EmailLead, type Translate } from './shared';

export type TeamNewLeadProps = { lead: EmailLead; adminUrl: string; t: Translate };

export default function TeamNewLead({ lead, adminUrl, t }: TeamNewLeadProps) {
  const e = (key: string, values?: Record<string, string | number>) => t(`emails.teamNewLead.${key}`, values);
  const city = t(`emails.cities.${lead.city}`);
  const price = lead.elecPrice == null ? t('emails.stegTariff') : t('emails.pricePerKwh', { price: lead.elecPrice });
  return (
    <Html lang="en">
      <Head />
      <Preview>{e('preview', { contact: lead.contactName, verdict: t(`engine.${verdictKey(lead.results.verdict)}`) })}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>{e('heading')}</Heading>
          <Text style={styles.text}>{e('intro', { contact: lead.contactName, hotel: lead.hotelName })}</Text>

          <Text style={styles.subheading}>{e('contact')}</Text>
          <Section>
            <DetailRow label={e('name')} value={lead.contactName} />
            <DetailRow label={e('email')} value={lead.email} />
            <DetailRow label={e('phone')} value={lead.phone ?? t('emails.notGiven')} />
          </Section>

          <Text style={styles.subheading}>{e('hotel')}</Text>
          <Section>
            <DetailRow label={e('hotel')} value={lead.hotelName} />
            <DetailRow label={e('city')} value={city} />
            <DetailRow label={e('rooms')} value={String(lead.rooms)} />
            <DetailRow label={e('pool')} value={t(lead.pool ? 'emails.yes' : 'emails.no')} />
            <DetailRow label={e('elecPrice')} value={price} />
          </Section>

          {lead.message ? (
            <>
              <Text style={styles.subheading}>{e('message')}</Text>
              <Text style={{ ...styles.text, whiteSpace: 'pre-wrap' }}>{lead.message}</Text>
            </>
          ) : null}

          <Text style={styles.subheading}>{e('screening')}</Text>
          <ScreeningSummary lead={lead} t={t} />

          <Section style={{ margin: '24px 0 8px' }}>
            <Button href={adminUrl} style={styles.button}>
              {e('open', { id: lead.id })}
            </Button>
          </Section>
          <Hr />
          <Text style={styles.muted}>{e('footer', { version: lead.engineVersion })}</Text>
        </Container>
      </Body>
    </Html>
  );
}

