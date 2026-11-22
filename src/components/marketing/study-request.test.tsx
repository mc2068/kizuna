// Role 3 (#20): study request schema, prefill parser and form behaviour.
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderIntl } from '../test-utils';
import { StudyRequestForm } from './StudyRequestForm';
import { parseToolSearchParams, screeningInput, studyRequestSchema, fieldErrorsOf, type StudyRequestState } from './study-request';

const valid = {
  contactName: 'Leila Ben Ali',
  email: 'leila@hotel.tn',
  phone: '',
  hotelName: 'Hotel Test',
  city: 'djerba',
  rooms: '300',
  pool: true,
  elecPrice: '',
  message: '',
  consent: true,
  website: '',
} as const;

describe('studyRequestSchema', () => {
  it('accepts a complete request and coerces numbers', () => {
    const r = studyRequestSchema.parse(valid);
    expect(r.rooms).toBe(300);
    expect(r.elecPrice).toBe('');
    expect(studyRequestSchema.parse({ ...valid, elecPrice: '0.3' }).elecPrice).toBe(0.3);
  });
  it('requires consent, a valid email, a city and rooms in range', () => {
    const r = studyRequestSchema.safeParse({ ...valid, consent: false, email: 'nope', city: 'paris', rooms: '20' });
    expect(r.success).toBe(false);
    expect(fieldErrorsOf(r.error!)).toEqual({ consent: 'consent', email: 'email', city: 'city', rooms: 'rooms' });
  });
  it('rejects electricity prices out of range', () => {
    expect(studyRequestSchema.safeParse({ ...valid, elecPrice: '5' }).success).toBe(false);
  });
  it('requires names', () => {
    const r = studyRequestSchema.safeParse({ ...valid, contactName: ' ', hotelName: '' });
    expect(fieldErrorsOf(r.error!)).toEqual({ contactName: 'required', hotelName: 'required' });
  });
});

describe('parseToolSearchParams', () => {
  it('reads the tool link and drops invalid values', () => {
    expect(parseToolSearchParams({ rooms: '300', city: 'djerba', pool: '1', price: '0.3' })).toEqual({
      rooms: 300, city: 'djerba', pool: true, elecPrice: 0.3,
    });
    expect(parseToolSearchParams({ rooms: '5', city: 'paris', pool: 'maybe', price: 'x' })).toEqual({});
    expect(parseToolSearchParams({ rooms: ['120', '130'], pool: '0' })).toEqual({ rooms: 120, pool: false });
  });
  it('only screens when rooms and city are known', () => {
    expect(screeningInput({ rooms: 120 })).toBeNull();
    expect(screeningInput({ rooms: 120, city: 'sousse' })).toEqual({ rooms: 120, city: 'sousse', pool: true, elecPrice: null });
  });
});

describe('<StudyRequestForm/>', () => {
  it('shows inline errors and does not call the action when fields are missing', async () => {
    const action = vi.fn<(p: StudyRequestState, i: unknown) => Promise<StudyRequestState>>();
    renderIntl(<StudyRequestForm action={action} prefill={{}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(await screen.findByText('Please check the fields marked in red.')).toBeInTheDocument();
    expect(screen.getAllByText('Please fill this in.').length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText('We need your consent to answer the request.')).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toHaveAttribute('aria-invalid', 'true');
    expect(action).not.toHaveBeenCalled();
  });

  it('prefills from the tool, submits, and shows the success panel', async () => {
    const action = vi.fn(async (_p: StudyRequestState, i: unknown): Promise<StudyRequestState> => {
      const v = i as typeof valid;
      return { status: 'success', leadId: 'L-2000', contactName: v.contactName, hotelName: v.hotelName };
    });
    renderIntl(<StudyRequestForm action={action} prefill={{ rooms: 420, city: 'tozeur', pool: false }} />);
    expect(screen.getByLabelText('Rooms')).toHaveValue(420);
    expect(screen.getByRole('switch', { name: 'Heated pool' })).toHaveAttribute('aria-checked', 'false');
    await userEvent.type(screen.getByLabelText('Your name'), 'Leila Ben Ali');
    await userEvent.type(screen.getByLabelText('Email'), 'leila@hotel.tn');
    await userEvent.type(screen.getByLabelText('Hotel name'), 'Oasis Test');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const sent = action.mock.calls[0][1] as Record<string, unknown>;
    expect(sent).toMatchObject({ contactName: 'Leila Ben Ali', city: 'tozeur', pool: false, consent: true });
    expect(await screen.findByRole('heading', { name: 'Thank you, Leila Ben Ali.' })).toBeInTheDocument();
    expect(screen.getByText(/Your reference is L-2000/)).toBeInTheDocument();
  });

  it('links the consent to the privacy page', () => {
    renderIntl(<StudyRequestForm action={vi.fn()} prefill={{}} />);
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  });
});
