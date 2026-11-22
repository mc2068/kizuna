'use server';

// Role 3 (#20): server action for the study request form. Validates again on the server, drops
// bot submissions (honeypot), then calls submitStudyRequest (Contract 3, Mohamed's #19).
import { submitStudyRequest } from '@/lib/db';
import {
  fieldErrorsOf, studyRequestSchema, type StudyRequestInput, type StudyRequestState,
} from '@/components/marketing/study-request';

export async function submitStudyRequestAction(
  _prev: StudyRequestState,
  input: StudyRequestInput,
): Promise<StudyRequestState> {
  const parsed = studyRequestSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', fieldErrors: fieldErrorsOf(parsed.error) };
  const v = parsed.data;

  // A filled honeypot means a bot: answer like a success, store nothing.
  if (v.website) return { status: 'success', leadId: 'L-0', contactName: v.contactName, hotelName: v.hotelName };

  try {
    const res = await submitStudyRequest({
      contactName: v.contactName,
      email: v.email,
      phone: v.phone || null,
      hotelName: v.hotelName,
      city: v.city,
      rooms: v.rooms,
      pool: v.pool,
      elecPrice: v.elecPrice === '' ? null : v.elecPrice,
      message: v.message,
      consent: v.consent,
    });
    if (!res.ok) {
      return res.error === 'consent'
        ? { status: 'error', fieldErrors: { consent: 'consent' } }
        : { status: 'error', fieldErrors: {}, formError: 'server' };
    }
    return { status: 'success', leadId: res.leadId, contactName: v.contactName, hotelName: v.hotelName };
  } catch {
    return { status: 'error', fieldErrors: {}, formError: 'server' };
  }
}
