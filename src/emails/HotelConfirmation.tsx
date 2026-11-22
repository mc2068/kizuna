// Sent to the hotel contact after a study request (#19): thanks, what happens next, their screening, privacy.
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Text } from 'react-email';
import { ScreeningSummary, styles, type EmailLead, type Translate } from './shared';

export type HotelConfirmationProps = { lead: EmailLead; privacyUrl: string; productName: string; t: Translate };

export default function HotelConfirmation({ lead, privacyUrl, productName, t }: HotelConfirmationProps) {
  const e = (key: string, values?: Record<string, string | number>) => t(`emails.hotelConfirmation.${key}`, values);
  return (
    <Html lang="en">
      <Head />
      <Preview>{e('preview', { contact: lead.contactName })}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>{e('heading', { contact: lead.contactName })}</Heading>
          <Text style={styles.text}>{e('intro', { hotel: lead.hotelName, id: lead.id })}</Text>

          <Text style={styles.subheading}>{e('nextHeading')}</Text>
          <Text style={styles.text}>1. {e('next1')}</Text>
          <Text style={styles.text}>2. {e('next2')}</Text>
          <Text style={styles.text}>3. {e('next3')}</Text>

          <Text style={styles.subheading}>{e('summaryHeading')}</Text>
          <ScreeningSummary lead={lead} t={t} />
          <Text style={styles.muted}>{e('summaryNote', { rooms: lead.rooms, city: t(`emails.cities.${lead.city}`) })}</Text>

          <Hr style={{ margin: '24px 0 12px' }} />
          <Text style={styles.muted}>
            {e('privacy')}{' '}
            <Link href={privacyUrl} style={styles.link}>
              {privacyUrl}
            </Link>
          </Text>
          <Text style={styles.muted}>{e('signature', { product: productName })}</Text>
        </Container>
      </Body>
    </Html>
  );
}
