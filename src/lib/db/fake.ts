// STAND-IN for #3/#6 (Mohamed owns src/lib/db). In-memory fake with every Contract 3 signature and
// 17 seeded demo leads from prototypes/ui/admin-data.js. Hotels and people are invented. Sizing
// results are not faked: they come from sizeHotel, computed here on the "server".
import { ENGINE_VERSION, sizeHotel, type City, type SizingInput } from '@/lib/engine';
import type { Lead, LeadEvent, LeadFile, LeadFilters, LeadNote, LeadStatus, Profile, Project, StudyRequestForm, SubmitResult } from './types';

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString();

export const TEAM: Profile[] = [
  { id: 'mohamed', role: 'admin', fullName: 'Mohamed Chakroun' },
  { id: 'hamza', role: 'admin', fullName: 'Hamza' },
  { id: 'ahmed', role: 'admin', fullName: 'Ahmed' },
  { id: 'gaith', role: 'admin', fullName: 'Gaith' },
];

// id, hotel, city, rooms, pool, contact, status, owner, received (days ago), status changed (days ago)
type Seed = [string, string, City, number, boolean, string, LeadStatus, string, number, number];
const SEEDS: Seed[] = [
  ['L-1052', 'Résidence Bahr Azur', 'djerba', 420, true, 'Sami Ben Salah', 'new', 'mohamed', 1, 1],
  ['L-1051', 'Oasis Nefta Palms', 'tozeur', 180, true, 'Ines Gharbi', 'new', 'ahmed', 1, 1],
  ['L-1050', 'Riad Yasmine', 'hammamet', 260, true, 'Karim Jaziri', 'new', 'gaith', 2, 2],
  ['L-1049', 'Corniche Suites', 'sousse', 120, false, 'Mouna Chaabane', 'new', 'hamza', 2, 2],
  ['L-1048', 'Les Jardins de Midoun', 'djerba', 340, true, 'Yassine Hamdi', 'new', 'mohamed', 3, 3],
  ['L-1047', 'Club Ulysse Lagoon', 'djerba', 500, true, 'Rania Ferchichi', 'contacted', 'mohamed', 8, 5],
  ['L-1046', 'Ksar Tozeur Hotel', 'tozeur', 300, true, 'Walid Mejri', 'contacted', 'ahmed', 10, 7],
  ['L-1045', 'Marina Kantaoui Resort', 'sousse', 380, true, 'Amel Bouazizi', 'contacted', 'hamza', 11, 9],
  ['L-1044', 'Golfe Bleu Yasmine', 'hammamet', 450, true, 'Nizar Khelifi', 'contacted', 'mohamed', 14, 12],
  ['L-1043', 'Thalasso Sidi Mahrez', 'djerba', 600, true, 'Sonia Dridi', 'quoted', 'mohamed', 24, 10],
  ['L-1042', 'Palmeraie Dorée', 'tozeur', 220, true, 'Hichem Mansouri', 'quoted', 'gaith', 29, 14],
  ['L-1041', 'Sahel Garden Beach', 'sousse', 520, true, 'Olfa Zouari', 'quoted', 'hamza', 33, 18],
  ['L-1040', 'Medina Sun Hammamet', 'hammamet', 700, true, 'Anis Belhadj', 'quoted', 'ahmed', 38, 20],
  ['L-1039', 'Rivage d’Aghir', 'djerba', 480, true, 'Fatma Riahi', 'won', 'mohamed', 53, 30],
  ['L-1038', 'Chott el Djerid Lodge', 'tozeur', 260, true, 'Mehdi Jebali', 'won', 'ahmed', 61, 40],
  ['L-1037', 'Les Mimosas', 'sousse', 90, false, 'Nadia Kchaou', 'lost', 'hamza', 65, 45],
  ['L-1036', 'Yasmine Family Club', 'hammamet', 320, true, 'Bilel Sassi', 'lost', 'gaith', 73, 50],
];

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '');

type Store = {
  leads: Lead[];
  notes: LeadNote[];
  events: LeadEvent[];
  files: LeadFile[];
  projects: Project[];
  nextLead: number;
};

function seed(now = Date.now()): Store {
  const leads: Lead[] = SEEDS.map(([id, hotel, city, rooms, pool, contact, status, owner, rec, changed]) => {
    const inputs: SizingInput = { rooms, city, pool, elecPrice: null };
    return {
      id,
      projectId: null,
      hotelName: hotel,
      city,
      rooms,
      contactName: contact,
      email: `${contact.split(' ')[0].toLowerCase()}@${slug(hotel).slice(0, 14)}.example`,
      phone: '+216 75 000 000',
      message: '',
      consent: true,
      inputs,
      results: sizeHotel(inputs),
      engineVersion: ENGINE_VERSION,
      status,
      ownerId: owner,
      createdAt: iso(now - rec * DAY),
      statusChangedAt: iso(now - changed * DAY),
    };
  });
  const events: LeadEvent[] = leads.map((l) => ({
    id: `e-${l.id}`,
    leadId: l.id,
    kind: 'created',
    data: {},
    actorId: null,
    createdAt: l.createdAt,
  }));
  return { leads, notes: [], events, files: [], projects: [], nextLead: 1053 };
}

const g = globalThis as unknown as { __kizunaFakeDb?: Store };
export function store(): Store {
  return (g.__kizunaFakeDb ??= seed());
}
/** Test helper: start again from the seed. */
export function resetFakeDb(now?: number) {
  g.__kizunaFakeDb = seed(now);
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

export function fakeListLeads(filters: LeadFilters, me: string | null): Lead[] {
  return store()
    .leads.filter((l) => !filters.status || l.status === filters.status)
    .filter((l) => !filters.city || l.city === filters.city)
    .filter((l) => !filters.mine || l.ownerId === me)
    .sort(byNewest);
}

export function fakeLeadCounts(): Record<LeadStatus, number> {
  const c: Record<LeadStatus, number> = { new: 0, contacted: 0, quoted: 0, won: 0, lost: 0 };
  for (const l of store().leads) c[l.status]++;
  return c;
}

export function fakeSubmit(form: StudyRequestForm): SubmitResult {
  if (!form.consent) return { ok: false, error: 'consent' };
  const s = store();
  const inputs: SizingInput = { rooms: form.rooms, city: form.city, pool: form.pool, elecPrice: form.elecPrice ?? null };
  // Round-robin owner, so every lead has one owner the moment it arrives.
  const owner = TEAM[s.nextLead % TEAM.length].id;
  const now = iso(Date.now());
  const lead: Lead = {
    id: `L-${s.nextLead++}`,
    projectId: form.projectId ?? null,
    hotelName: form.hotelName,
    city: form.city,
    rooms: form.rooms,
    contactName: form.contactName,
    email: form.email,
    phone: form.phone || null,
    message: form.message ?? '',
    consent: true,
    inputs,
    results: sizeHotel(inputs),
    engineVersion: ENGINE_VERSION,
    status: 'new',
    ownerId: owner,
    createdAt: now,
    statusChangedAt: now,
  };
  s.leads.push(lead);
  s.events.push({ id: `e-${lead.id}`, leadId: lead.id, kind: 'created', data: {}, actorId: null, createdAt: now });
  return { ok: true, leadId: lead.id };
}
