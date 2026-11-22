// PROTOTYPE fake data for the admin dashboard. Hotels, people and emails are invented.
// Sizing results are NOT faked: admin.html runs the real v2 engine on each lead's tool inputs.

export const ME = 'mohamed';

export const TEAM = {
  mohamed: { name: 'Mohamed C.', full: 'Mohamed Chakroun', role: 'Lead, admin', color: '#0f6b5c' },
  hamza: { name: 'Hamza', full: 'Hamza', role: 'Energy engine', color: '#b5542d' },
  ahmed: { name: 'Ahmed', full: 'Ahmed', role: 'Tool and dashboard', color: '#3a5a98' },
  gaith: { name: 'Gaith', full: 'Gaith', role: 'Pages and design', color: '#7c5a2b' },
};

export const STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

export const CITY_NAMES = { djerba: 'Djerba', sousse: 'Sousse', hammamet: 'Hammamet', tozeur: 'Tozeur' };

// "today" in the prototype
export const TODAY = '2026-11-22';

const L = (id, hotel, city, rooms, pool, stars, contact, role, status, owner, received, source, extra = {}) => ({
  id, hotel, city, rooms, pool, stars, status, owner, received, source,
  contact: {
    name: contact, role,
    email: contact.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '.') + '@' + hotel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '').slice(0, 14) + '.example',
    phone: extra.phone || '+216 75 ' + String(100 + (parseInt(id.slice(2), 10) * 37) % 900) + ' ' + String(100 + (parseInt(id.slice(2), 10) * 53) % 900),
    lang: extra.lang || 'French',
  },
  ...extra,
});

export const LEADS = [
  L('L-1052', 'Résidence Bahr Azur', 'djerba', 420, true, 4, 'Sami Ben Salah', 'Technical director', 'new', 'mohamed', '2026-11-21', 'Sizing tool', { next: 'First call', due: '2026-11-24' }),
  L('L-1051', 'Oasis Nefta Palms', 'tozeur', 180, true, 4, 'Ines Gharbi', 'General manager', 'new', 'ahmed', '2026-11-21', 'Sizing tool', { next: 'First call', due: '2026-11-24' }),
  L('L-1050', 'Riad Yasmine', 'hammamet', 260, true, 4, 'Karim Jaziri', 'Owner', 'new', 'gaith', '2026-11-20', 'Website form', { next: 'First call', due: '2026-11-23' }),
  L('L-1049', 'Corniche Suites', 'sousse', 120, false, 3, 'Mouna Chaabane', 'Operations manager', 'new', 'hamza', '2026-11-20', 'Sizing tool', { next: 'Reply: weak fit, suggest PV', due: '2026-11-23' }),
  L('L-1048', 'Les Jardins de Midoun', 'djerba', 340, true, 4, 'Yassine Hamdi', 'Chief engineer', 'new', 'mohamed', '2026-11-19', 'Referral', { next: 'First call', due: '2026-11-22' }),
  L('L-1047', 'Club Ulysse Lagoon', 'djerba', 500, true, 4, 'Rania Ferchichi', 'Technical director', 'contacted', 'mohamed', '2026-11-14', 'Sizing tool', {
    next: 'Site visit, plant room and gas meter', due: '2026-11-26', phone: '+216 75 650 214', lang: 'French, English',
    open: 'All year (winter occupancy about 55%)', gas: 'Connected, STEG medium pressure', bills: '12 months received',
    notes: [
      { by: 'mohamed', at: '2026-11-21T16:40', text: 'Rania sent all 12 STEG bills (Nov 2025 to Oct 2026). Average 0.231 TND/kWh before VAT, peak demand 1.1 MW in August. Uploaded under Files.' },
      { by: 'hamza', at: '2026-11-18T10:05', text: 'Re-ran the engine with their real winter occupancy (55%). Central payback moves from 8 to about 7.5 years. Worth asking for the heated indoor pool hours too: they run it 7:00 to 22:00 all winter.' },
      { by: 'mohamed', at: '2026-11-17T11:20', text: 'First call with Rania (technical director). Open all year, 500 rooms, heated indoor + outdoor pool, gas already on site for the kitchens and boilers. Two old 400 kW screw chillers due for replacement in 2028. Very interested in the CHP-only first step. Wants a study price before the board meets on 10 December.' },
    ],
    history: [
      { t: 'file', by: 'mohamed', at: '2026-11-21T16:42', text: 'uploaded <b>STEG bills Nov 2025 – Oct 2026.pdf</b>' },
      { t: 'email', by: 'system', at: '2026-11-19T09:00', text: 'Email sent to Rania Ferchichi: <b>What we need for your study</b> (bills checklist)' },
      { t: 'note', by: 'hamza', at: '2026-11-18T10:05', text: 'added a note' },
      { t: 'status', by: 'mohamed', at: '2026-11-17T11:30', text: 'moved status <span class="pill s-new">New</span> → <span class="pill s-contacted">Contacted</span>' },
      { t: 'owner', by: 'hamza', at: '2026-11-15T08:12', text: 'reassigned the lead from <b>Hamza</b> to <b>Mohamed C.</b>' },
      { t: 'email', by: 'system', at: '2026-11-14T21:03', text: 'Confirmation email sent to Rania Ferchichi: <b>We received your study request</b>' },
      { t: 'email', by: 'system', at: '2026-11-14T21:03', text: 'Team alert sent to team@[product].example' },
      { t: 'created', by: 'system', at: '2026-11-14T21:02', text: 'Study request received from the sizing tool (saved project <b>Club Ulysse, 500 rooms</b>)' },
    ],
    files: [
      { name: 'STEG bills Nov 2025 – Oct 2026.pdf', size: '4.8 MB', by: 'mohamed', at: '2026-11-21', kind: 'pdf' },
      { name: 'Plant room photos.zip', size: '23.1 MB', by: 'mohamed', at: '2026-11-17', kind: 'zip' },
      { name: 'Site plan, ground floor.pdf', size: '1.2 MB', by: 'mohamed', at: '2026-11-17', kind: 'pdf' },
    ],
  }),
  L('L-1046', 'Ksar Tozeur Hotel', 'tozeur', 300, true, 4, 'Walid Mejri', 'General manager', 'contacted', 'ahmed', '2026-11-12', 'Sizing tool', { next: 'Waiting for STEG bills', due: '2026-11-25' }),
  L('L-1045', 'Marina Kantaoui Resort', 'sousse', 380, true, 5, 'Amel Bouazizi', 'Energy manager', 'contacted', 'hamza', '2026-11-11', 'Referral', { next: 'Send study proposal', due: '2026-11-23' }),
  L('L-1044', 'Golfe Bleu Yasmine', 'hammamet', 450, true, 4, 'Nizar Khelifi', 'Technical director', 'contacted', 'mohamed', '2026-11-08', 'Sizing tool', { next: 'Call back after board meeting', due: '2026-11-28' }),
  L('L-1043', 'Thalasso Sidi Mahrez', 'djerba', 600, true, 5, 'Sonia Dridi', 'General manager', 'quoted', 'mohamed', '2026-10-29', 'Sizing tool', { fee: 12500, next: 'Follow up on quote Q-0019', due: '2026-11-24' }),
  L('L-1042', 'Palmeraie Dorée', 'tozeur', 220, true, 4, 'Hichem Mansouri', 'Owner', 'quoted', 'gaith', '2026-10-24', 'Website form', { fee: 7800, next: 'Quote expires 30 Nov', due: '2026-11-30' }),
  L('L-1041', 'Sahel Garden Beach', 'sousse', 520, true, 4, 'Olfa Zouari', 'Financial director', 'quoted', 'hamza', '2026-10-20', 'Sizing tool', { fee: 11000, next: 'Answer FTE eligibility question', due: '2026-11-22' }),
  L('L-1040', 'Medina Sun Hammamet', 'hammamet', 700, true, 5, 'Anis Belhadj', 'Chief engineer', 'quoted', 'ahmed', '2026-10-15', 'Referral', { fee: 14000, next: 'Meeting with their bank', due: '2026-12-02' }),
  L('L-1039', 'Rivage d’Aghir', 'djerba', 480, true, 4, 'Fatma Riahi', 'Technical director', 'won', 'mohamed', '2026-09-30', 'Sizing tool', { fee: 12000, next: 'Study kick-off on site', due: '2026-12-01' }),
  L('L-1038', 'Chott el Djerid Lodge', 'tozeur', 260, true, 4, 'Mehdi Jebali', 'Owner', 'won', 'ahmed', '2026-09-22', 'Website form', { fee: 8500, next: 'Deliver study report', due: '2026-12-15' }),
  L('L-1037', 'Les Mimosas', 'sousse', 90, false, 3, 'Nadia Kchaou', 'Owner', 'lost', 'hamza', '2026-09-18', 'Sizing tool', { lost: 'Weak fit (about 2,400 full-load hours). We advised rooftop PV and efficient chillers instead.' }),
  L('L-1036', 'Yasmine Family Club', 'hammamet', 320, true, 3, 'Bilel Sassi', 'General manager', 'lost', 'gaith', '2026-09-10', 'Sizing tool', { lost: 'Closed November to March, so the engine would idle half the year. Chose solar thermal for the pool.' }),
];

// Fill in generic notes, history and files for the leads without hand-written ones.
for (const l of LEADS) {
  if (l.history) continue;
  const h = [];
  const d = (days, time = '10:00') => {
    const x = new Date(l.received + 'T00:00');
    x.setDate(x.getDate() + days);
    return x.toISOString().slice(0, 10) + 'T' + time;
  };
  h.push({ t: 'created', by: 'system', at: l.received + 'T20:14', text: `Study request received from the ${l.source.toLowerCase()}` });
  h.push({ t: 'email', by: 'system', at: l.received + 'T20:15', text: `Confirmation email sent to ${l.contact.name}: <b>We received your study request</b>` });
  const order = ['new', 'contacted', 'quoted', 'won'];
  const idx = order.indexOf(l.status);
  if (idx >= 1 || l.status === 'lost') h.push({ t: 'status', by: l.owner, at: d(2, '11:05'), text: 'moved status <span class="pill s-new">New</span> → <span class="pill s-contacted">Contacted</span>' });
  if (idx >= 2) {
    h.push({ t: 'status', by: l.owner, at: d(9, '15:30'), text: 'moved status <span class="pill s-contacted">Contacted</span> → <span class="pill s-quoted">Quoted</span>' });
    h.push({ t: 'email', by: l.owner, at: d(9, '15:32'), text: `Quote sent to ${l.contact.name}: <b>Feasibility study, ${l.fee.toLocaleString('en-US')} TND before VAT</b>` });
  }
  if (idx >= 3) h.push({ t: 'status', by: l.owner, at: d(20, '09:40'), text: 'moved status <span class="pill s-quoted">Quoted</span> → <span class="pill s-won">Won</span>' });
  if (l.status === 'lost') h.push({ t: 'status', by: l.owner, at: d(6, '17:20'), text: 'moved status <span class="pill s-contacted">Contacted</span> → <span class="pill s-lost">Lost</span>' });
  l.history = h.reverse();
  l.notes = [];
  if (l.status !== 'new') l.notes.push({ by: l.owner, at: d(2, '11:00'), text: `First call with ${l.contact.name.split(' ')[0]} (${l.contact.role.toLowerCase()}). ${l.pool ? 'Heated pool, ' : ''}${l.rooms} rooms. Asked for 12 months of STEG bills.` });
  if (l.lost) l.notes.unshift({ by: l.owner, at: d(6, '17:15'), text: l.lost });
  if (l.status === 'quoted' || l.status === 'won') l.notes.unshift({ by: l.owner, at: d(9, '15:25'), text: `Bills received. Quoted the study at ${l.fee.toLocaleString('en-US')} TND before VAT (two installer quotes included).` });
  l.files = [];
  if (idx >= 2) l.files.push({ name: `Quote Q-00${l.id.slice(-2)}, feasibility study.pdf`, size: '212 KB', by: l.owner, at: d(9).slice(0, 10), kind: 'pdf' }, { name: 'STEG bills, 12 months.pdf', size: '3.9 MB', by: l.owner, at: d(8).slice(0, 10), kind: 'pdf' });
  if (idx >= 3) l.files.unshift({ name: 'Signed study agreement.pdf', size: '388 KB', by: l.owner, at: d(20).slice(0, 10), kind: 'pdf' });
}
