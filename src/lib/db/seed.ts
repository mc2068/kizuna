// Demo data for the in-memory fake, ported from prototypes/ui/admin-data.js (PR #2).
// Hotels, people and emails are invented. #6 moves the same data to supabase/seed.sql.
import { ENGINE_VERSION, sizeHotel, type City } from '@/lib/engine';
import type { CurrentUser, Lead, LeadEvent, LeadFile, LeadNote, LeadStatus, Profile } from './types';

export const ADMINS: (Profile & { email: string })[] = [
  { id: 'admin-mohamed', role: 'admin', fullName: 'Mohamed Chakroun', email: 'mohamed@team.example' },
  { id: 'admin-hamza', role: 'admin', fullName: 'Hamza', email: 'hamza@team.example' },
  { id: 'admin-ahmed', role: 'admin', fullName: 'Ahmed', email: 'ahmed@team.example' },
  { id: 'admin-gaith', role: 'admin', fullName: 'Gaith', email: 'gaith@team.example' },
];

const asUser = (p: (typeof ADMINS)[number] | { id: string; email: string; role: 'user' }): CurrentUser => ({
  id: p.id,
  email: p.email,
  role: p.role,
});

/** Users the fake can sign in as (see setFakeUser). */
export const FAKE_USERS = {
  mohamed: asUser(ADMINS[0]),
  hamza: asUser(ADMINS[1]),
  ahmed: asUser(ADMINS[2]),
  gaith: asUser(ADMINS[3]),
  userA: asUser({ id: 'user-a', email: 'a@hotel.example', role: 'user' }),
  userB: asUser({ id: 'user-b', email: 'b@hotel.example', role: 'user' }),
} as const;

type Owner = 'mohamed' | 'hamza' | 'ahmed' | 'gaith';
const ownerId = (o: Owner) => `admin-${o}`;

type Row = [id: string, hotel: string, city: City, rooms: number, pool: boolean, contact: string, status: LeadStatus, owner: Owner, received: string, fee?: number, lost?: string];

const ROWS: Row[] = [
  ['L-1052', 'Résidence Bahr Azur', 'djerba', 420, true, 'Sami Ben Salah', 'new', 'mohamed', '2026-11-21'],
  ['L-1051', 'Oasis Nefta Palms', 'tozeur', 180, true, 'Ines Gharbi', 'new', 'ahmed', '2026-11-21'],
  ['L-1050', 'Riad Yasmine', 'hammamet', 260, true, 'Karim Jaziri', 'new', 'gaith', '2026-11-20'],
  ['L-1049', 'Corniche Suites', 'sousse', 120, false, 'Mouna Chaabane', 'new', 'hamza', '2026-11-20'],
  ['L-1048', 'Les Jardins de Midoun', 'djerba', 340, true, 'Yassine Hamdi', 'new', 'mohamed', '2026-11-19'],
  ['L-1047', 'Club Ulysse Lagoon', 'djerba', 500, true, 'Rania Ferchichi', 'contacted', 'mohamed', '2026-11-14'],
  ['L-1046', 'Ksar Tozeur Hotel', 'tozeur', 300, true, 'Walid Mejri', 'contacted', 'ahmed', '2026-11-12'],
  ['L-1045', 'Marina Kantaoui Resort', 'sousse', 380, true, 'Amel Bouazizi', 'contacted', 'hamza', '2026-11-11'],
  ['L-1044', 'Golfe Bleu Yasmine', 'hammamet', 450, true, 'Nizar Khelifi', 'contacted', 'mohamed', '2026-11-08'],
  ['L-1043', 'Thalasso Sidi Mahrez', 'djerba', 600, true, 'Sonia Dridi', 'quoted', 'mohamed', '2026-10-29', 12500],
  ['L-1042', 'Palmeraie Dorée', 'tozeur', 220, true, 'Hichem Mansouri', 'quoted', 'gaith', '2026-10-24', 7800],
  ['L-1041', 'Sahel Garden Beach', 'sousse', 520, true, 'Olfa Zouari', 'quoted', 'hamza', '2026-10-20', 11000],
  ['L-1040', 'Medina Sun Hammamet', 'hammamet', 700, true, 'Anis Belhadj', 'quoted', 'ahmed', '2026-10-15', 14000],
  ['L-1039', 'Rivage d’Aghir', 'djerba', 480, true, 'Fatma Riahi', 'won', 'mohamed', '2026-09-30', 12000],
  ['L-1038', 'Chott el Djerid Lodge', 'tozeur', 260, true, 'Mehdi Jebali', 'won', 'ahmed', '2026-09-22', 8500],
  ['L-1037', 'Les Mimosas', 'sousse', 90, false, 'Nadia Kchaou', 'lost', 'hamza', '2026-09-18', undefined, 'Weak fit (about 2,400 full-load hours). We advised rooftop PV and efficient chillers instead.'],
  ['L-1036', 'Yasmine Family Club', 'hammamet', 320, true, 'Bilel Sassi', 'lost', 'gaith', '2026-09-10', undefined, 'Closed November to March, so the engine would idle half the year. Chose solar thermal for the pool.'],
];

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '');

const at = (day: string, time: string, plusDays = 0) => {
  const d = new Date(`${day}T${time}:00Z`);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d.toISOString();
};

export type FakeTables = {
  leads: Lead[];
  notes: LeadNote[];
  events: LeadEvent[];
  files: (LeadFile & { contentType: string; bytes: Uint8Array })[];
};

export function seedTables(): FakeTables {
  const t: FakeTables = { leads: [], notes: [], events: [], files: [] };
  let n = 0;
  const id = (p: string) => `${p}-${++n}`;
  const event = (leadId: string, kind: LeadEvent['kind'], when: string, actorId: string | null, data: Record<string, unknown> = {}) =>
    t.events.push({ id: id('ev'), leadId, kind, data, actorId, createdAt: when });
  const note = (leadId: string, authorId: string, when: string, body: string) =>
    t.notes.push({ id: id('note'), leadId, authorId, body, createdAt: when });
  const file = (leadId: string, name: string, size: number, by: string, when: string) => {
    const zip = name.endsWith('.zip');
    t.files.push({
      id: id('file'), leadId, path: `${leadId}/${slug(name)}.${zip ? 'zip' : 'pdf'}`, name, size, uploadedBy: by, createdAt: when,
      contentType: zip ? 'application/zip' : 'application/pdf',
      bytes: new TextEncoder().encode(zip ? 'demo file' : '%PDF-1.4 demo file'),
    });
  };

  for (const [leadId, hotel, city, rooms, pool, contact, status, owner, received, fee, lost] of ROWS) {
    const inputs = { rooms, city, pool, elecPrice: null };
    const num = parseInt(leadId.slice(2), 10);
    const who = ownerId(owner);
    t.leads.push({
      id: leadId,
      projectId: null,
      hotelName: hotel,
      city,
      rooms,
      contactName: contact,
      email: `${contact.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '.')}@${slug(hotel).slice(0, 14)}.example`,
      phone: `+216 75 ${100 + ((num * 37) % 900)} ${100 + ((num * 53) % 900)}`,
      message: null,
      consent: true,
      inputs,
      results: sizeHotel(inputs),
      engineVersion: ENGINE_VERSION,
      status,
      ownerId: who,
      createdAt: at(received, '20:14'),
    });

    if (leadId === 'L-1047') {
      seedClubUlysse(leadId, event, note, file);
      continue;
    }

    event(leadId, 'created', at(received, '20:14'), null, { source: 'sizing tool' });
    event(leadId, 'email', at(received, '20:15'), null, { to: contact, subject: 'We received your study request' });
    const step = ['new', 'contacted', 'quoted', 'won'].indexOf(status);
    if (step >= 1 || status === 'lost') event(leadId, 'status', at(received, '11:05', 2), who, { from: 'new', to: 'contacted' });
    if (step >= 1 || status === 'lost')
      note(leadId, who, at(received, '11:00', 2), `First call with ${contact.split(' ')[0]}. ${pool ? 'Heated pool, ' : ''}${rooms} rooms. Asked for 12 months of STEG bills.`);
    if (step >= 2 && fee) {
      event(leadId, 'status', at(received, '15:30', 9), who, { from: 'contacted', to: 'quoted' });
      event(leadId, 'email', at(received, '15:32', 9), who, { to: contact, subject: `Feasibility study, ${fee.toLocaleString('en-GB')} TND before VAT` });
      note(leadId, who, at(received, '15:25', 9), `Bills received. Quoted the study at ${fee.toLocaleString('en-GB')} TND before VAT (two installer quotes included).`);
      file(leadId, 'STEG bills, 12 months.pdf', 3_900_000, who, at(received, '10:00', 8));
      file(leadId, `Quote Q-00${leadId.slice(-2)}, feasibility study.pdf`, 212_000, who, at(received, '10:00', 9));
    }
    if (step >= 3) {
      event(leadId, 'status', at(received, '09:40', 20), who, { from: 'quoted', to: 'won' });
      file(leadId, 'Signed study agreement.pdf', 388_000, who, at(received, '10:00', 20));
    }
    if (status === 'lost' && lost) {
      event(leadId, 'status', at(received, '17:20', 6), who, { from: 'contacted', to: 'lost' });
      note(leadId, who, at(received, '17:15', 6), lost);
    }
  }
  return t;
}

function seedClubUlysse(
  leadId: string,
  event: (l: string, k: LeadEvent['kind'], w: string, a: string | null, d?: Record<string, unknown>) => void,
  note: (l: string, a: string, w: string, b: string) => void,
  file: (l: string, name: string, size: number, by: string, when: string) => void,
) {
  const m = ownerId('mohamed');
  const h = ownerId('hamza');
  event(leadId, 'created', '2026-11-14T21:02:00.000Z', null, { source: 'sizing tool', project: 'Club Ulysse, 500 rooms' });
  event(leadId, 'email', '2026-11-14T21:03:00.000Z', null, { to: 'team', subject: 'New study request' });
  event(leadId, 'email', '2026-11-14T21:03:00.000Z', null, { to: 'Rania Ferchichi', subject: 'We received your study request' });
  event(leadId, 'owner', '2026-11-15T08:12:00.000Z', h, { from: h, to: m });
  event(leadId, 'status', '2026-11-17T11:30:00.000Z', m, { from: 'new', to: 'contacted' });
  event(leadId, 'note', '2026-11-18T10:05:00.000Z', h, {});
  event(leadId, 'email', '2026-11-19T09:00:00.000Z', null, { to: 'Rania Ferchichi', subject: 'What we need for your study' });
  event(leadId, 'file', '2026-11-21T16:42:00.000Z', m, { name: 'STEG bills Nov 2025 – Oct 2026.pdf' });
  note(leadId, m, '2026-11-17T11:20:00.000Z', 'First call with Rania (technical director). Open all year, 500 rooms, heated indoor + outdoor pool, gas already on site for the kitchens and boilers. Two old 400 kW screw chillers due for replacement in 2028. Very interested in the CHP-only first step. Wants a study price before the board meets on 10 December.');
  note(leadId, h, '2026-11-18T10:05:00.000Z', 'Re-ran the engine with their real winter occupancy (55%). Central payback moves from 8 to about 7.5 years. Worth asking for the heated indoor pool hours too: they run it 7:00 to 22:00 all winter.');
  note(leadId, m, '2026-11-21T16:40:00.000Z', 'Rania sent all 12 STEG bills (Nov 2025 to Oct 2026). Average 0.231 TND/kWh before VAT, peak demand 1.1 MW in August. Uploaded under Files.');
  file(leadId, 'Site plan, ground floor.pdf', 1_200_000, m, '2026-11-17T10:00:00.000Z');
  file(leadId, 'Plant room photos.zip', 23_100_000, m, '2026-11-17T10:01:00.000Z');
  file(leadId, 'STEG bills Nov 2025 – Oct 2026.pdf', 4_800_000, m, '2026-11-21T16:42:00.000Z');
}
