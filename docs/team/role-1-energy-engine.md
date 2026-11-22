# Role 1: Energy engine & reports

**Owner:** Hamza (`@Boomerang128`)

You own the numbers. The website's whole promise is honest, cited estimates, so the engine has to match the v2 reference model exactly, be tested, and feed every page, the saved projects and the PDF from one place. You port `engine/model.mjs` to TypeScript, write the helpers that turn engine output into text, make sure saved results are computed on the server with a version stamp, write the method content behind Sources and the case study, and build the PDF report.

**Your files:** `src/lib/engine/**`, `src/lib/present/**`, `src/lib/report/**`, `src/app/api/projects/[id]/report/**`, `src/app/api/share/[token]/report/**`, `src/content/method.ts`, `messages/en/{engine,method}.json`, `docs/engine/**`

**You depend on:** Contract 1 (you publish it), Contract 3 (you use `getProject`/`getSharedProject` for the PDF). Until your port merges, everyone runs on `src/lib/engine/fake.ts` from Mohamed's scaffold, so nobody waits for you, but the port is the most important merge of the first days.

## Start here: paste this into your Claude first

Use **Claude Code** in your clone of `github.com/mc2068/kizuna` (it can read the prototypes and edit files). Paste the whole block as your first message, then use the prompts below one at a time. Each prompt is one GitHub issue.

```
You are helping me build part of a real product website. Here is the full context. Keep it in mind
for everything I ask in this chat. Repo: github.com/mc2068/kizuna. Decisions: CONTEXT.md and docs/adr/.

PRODUCT: [PRODUCT NAME], a Tunisian startup that sizes and sells trigeneration (CCHP) plants for hotels.
Trigeneration = one gas engine on site makes electricity; its waste heat makes hot water and, through an
absorption chiller, cold water for air conditioning. The website explains the offer, runs a free sizing
tool, saves hotel projects, and turns visitors into paid feasibility-study leads.
POSITIONING: the sizing tool is a SCREENING tool. It finds the hotels where trigeneration pays (large, open
all year, heated pool or spa, gas connection) and honestly says "weak fit" elsewhere. Hero line from the
prototype: "Make your own energy. Only if it pays." Never promise blackout cover (island mode is not modelled).

NAME: not decided. Always write the literal placeholder [PRODUCT NAME]. In code, read it from
siteConfig.name in src/config/site.ts, never hard-code it, so it is swapped once.

STACK (decided, ADR 0001-0004): Next.js App Router + TypeScript (strict), src/ directory, pnpm.
Supabase: Postgres, Auth (email magic link + Google OAuth), row-level security, Storage. Tailwind CSS +
shadcn/ui; Framer Motion for motion (later pass, respect prefers-reduced-motion). next-intl WITHOUT locale
routing: English only at launch, every user-facing string in messages/en/<namespace>.json so French can be
added later. Resend for transactional email. react-pdf (@react-pdf/renderer) for the PDF report, server side.
Vitest (unit, engine) + Playwright (key flows) in GitHub Actions on every PR. Vercel (preview per PR) + one
Supabase cloud project; local Supabase via the CLI. Cookie-free Vercel Analytics. Tunisian data protection
law (INPDP) applies: privacy page and a consent checkbox on every form.

DESIGN (ADR 0003): prototype "Keynote", Apple-inspired: huge type, one idea per screen, store-style
configurator with a sticky summary, three rings (electricity, hot water, cooling) as the hero object,
footnoted claims. Admin (ADR 0004): Integrate-style status tiles + filterable lead cards; lead page after
Ramotion's Carbon Solutions dashboard (photo header, status pill, tabs). Reference HTML prototypes:
prototypes/ui/landing.html and prototypes/ui/admin.html (PR #2), screenshots in prototypes/ui/screenshots/.

DOMAIN: customer = Tunisian coastal hotels. Demo hotel everywhere: 300-room, 4-star beach hotel in Djerba
with a pool. Tool inputs: rooms (50-800, default 300), city (djerba | sousse | hammamet | tozeur, default
djerba), pool (default true), electricity price (optional flat TND/kWh; default null = STEG medium-voltage
time-of-use tariff, before VAT). All prices before VAT. Every money and CO2 output is a RANGE
(favourable / central / unfavourable), central marked; the FTE subsidy payback is labelled "eligibility
unconfirmed" and is never the headline. Verdicts: "good fit" (central payback <= 6 yrs), "possible fit, needs a
study" (<= 10), "weak fit". The tool shows the trigeneration option and, when it pays back faster, a CHP-only
option (hot water and pool heat, no chiller).
FROZEN DEMO NUMBERS (engine v2, docs/engine/spec.md, read as favourable / central / unfavourable):
trigeneration 200 kWe + 64 kWc, capex 1.2 / 1.75 / 2.4 M TND, savings 260k / 200k / 110k TND/yr,
payback 5 / 9 / 21.5 yrs (with FTE 3.5 / 6 / 15), CO2 avoided 260 / 210 / 70 t/yr, full-load hours
6,100 / 5,700 / 4,900, peak grid relief ~220 kW. CHP-only: 100 kWe, payback 4.5 / 7.5 / 15.5 yrs.
Cooling coverage is only ~3%: the value is year-round hot water and pool heat, not summer cooling.

PAGES (14) AND OWNERS:
/                      Home ........................................ Gaith
/how-it-works          How it works ................................ Gaith
/tool                  Sizing tool ................................. Ahmed
/services              Services and pricing ........................ Gaith
/case-study/djerba     Djerba case study ........................... Gaith
/about                 About (team) ................................ Gaith
/sources               Sources and method .......................... Gaith (content from Hamza)
/request-study         Request a study / Contact ................... Gaith (backend: Mohamed)
/privacy               Privacy ..................................... Gaith
/projects              My projects (signed in) ..................... Ahmed
/p/[token]             Shared project (read-only, public link) ..... Ahmed
/sign-in               Sign in (magic link + Google) ............... Mohamed
/admin                 Admin leads pipeline (admins only) .......... Gaith (data: Mohamed)
/admin/leads/[id]      Admin lead detail: Overview/Notes/History/Files .. Ahmed (data: Mohamed)
Services: paid feasibility study and installer referral now; shared-savings (ESCO) "coming soon";
prices "on request".

FILE OWNERS (4 roles; only edit files you own, ask the owner for anything else):
Role 1 Energy engine & reports (Hamza): src/lib/engine/** (TS port + *.test.ts), src/lib/present/**,
  src/lib/report/**, the report routes src/app/api/projects/[id]/report/** and
  src/app/api/share/[token]/report/**, src/content/method.ts, messages/en/{engine,method}.json, docs/engine/**
Role 2 Tool & projects (Ahmed): src/app/tool/**, src/components/tool/**, src/app/projects/**,
  src/app/p/**, src/app/admin/leads/[id]/**, src/components/lead/**, messages/en/{tool,projects,lead}.json
Role 3 Pages & design (Gaith): src/app/globals.css, tailwind config, src/components/ui/** (shadcn),
  src/components/layout/**, src/components/marketing/**, src/components/admin/pipeline/**, public/**,
  src/app/page.tsx, how-it-works, services, case-study, about, sources, request-study, privacy,
  src/app/admin/page.tsx, messages/en/{common,marketing,forms,admin}.json
Role 4 Platform, integration & QA (Mohamed): package.json, next.config.ts, src/middleware.ts,
  src/app/layout.tsx, src/i18n/**, src/config/site.ts, supabase/** (migrations, seed, policies),
  src/lib/supabase/**, src/lib/db/**, src/lib/engine/fake.ts, src/app/sign-in/**, src/app/auth/**,
  src/app/api/** (except the report routes), src/emails/**, .github/workflows/**, e2e/**, README.md

CONTRACT 1, engine (src/lib/engine/index.ts; src/lib/engine/fake.ts exports the same until the port lands):
type City = 'djerba' | 'sousse' | 'hammamet' | 'tozeur';
type Scenario = 'unfavourable' | 'central' | 'favourable';
type SizingInput = { rooms: number; city: City; pool: boolean; elecPrice: number | null };
type ScenarioResult = { capexTnd; annualSavingsTnd; demandChargeSavingTnd; co2AvoidedTonnes; paybackYears;
  paybackYearsWithFte; fullLoadHours; primaryEnergySaving; peakGridReliefKw }   // all numbers, rounded
type PlantOption = { engineKwe: number; chillerKwc: number; verdict: Verdict; warnings: Warning[];
  scenarios: Record<Scenario, ScenarioResult> };
type Warning =                                 // never shown raw: warningText(w, t) -> messages/en/engine.json
  | { code: 'lowFullLoadHours'; params: { hours; threshold } }
  | { code: 'lowPrimaryEnergySaving'; params: { pes; threshold } }
  | { code: 'longPayback'; params: { years; threshold } };
type Verdict = 'good fit' | 'possible fit, needs a study' | 'weak fit';
type HourRow = { hour; elecDemand; heatDemand; coolDemand; engineElec; recoveredHeat; chillerCool; gridImport };
type SizingResult = PlantOption & {            // headline = trigeneration option if any, else best
  options: { best: PlantOption | null; trigeneration: PlantOption | null };
  hourly: { summer: HourRow[]; winter: HourRow[] };   // 24 rows each, headline option, central case
  assumptions: { name; unfavourable; central; favourable; unit; source }[] };
export function sizeHotel(input: SizingInput): SizingResult;   // pure: no I/O, deterministic, < 20 ms
export const ENGINE_VERSION: string;                           // e.g. '2.0.0', stored with every saved run
It must match the reference model engine/model.mjs and pass the ported engine/model.test.mjs.
Presentation helpers (src/lib/present/index.ts, Role 1): formatTnd, formatYears, formatKw, formatTonnes,
formatPercent, formatHours, formatRange(option, key) -> { favourable, central, unfavourable, values, text,
favourableEnd }, verdictTone(verdict) -> 'good' | 'maybe' | 'weak', verdictKey(verdict),
warningText(w, useTranslations('engine')). Numbers shown exactly as the engine rounds them. UI never formats
engine numbers itself.

CONTRACT 2, design tokens (Role 3, src/app/globals.css as CSS variables + Tailwind theme; shadcn variables
mapped to them): --bg #fbfbfd, --ink #1d1d1f, --muted #6e6e73, --faint #86868b, --line #d2d2d7,
--tile #f5f5f7, --link #0066cc, --btn #0071e3; energy colours --elec #f28c28 (electricity),
--heat #e5484d (hot water), --cool #0b8fc7 (cooling); verdicts --good #1f8a4c, --maybe #b26b00,
--weak #8e8e93; lead status: new #2563eb, contacted #a35f00, quoted #0f766e, won #1d7f45, lost #6b6f72
(each with a soft background). Fonts: "Inter Tight" for display, "Inter" for text (next/font).
Pill buttons (radius 999px), tabular numerals for all numbers. Shared <SiteHeader/> and <SiteFooter/>
in src/components/layout/ (Role 3), used by src/app/layout.tsx; <AdminShell/> for /admin.

CONTRACT 3, data (Role 4, Supabase; typed functions in src/lib/db/*.ts; everyone calls these, never
Supabase directly). Tables: profiles(id = auth uid, role 'user' | 'admin', full_name);
projects(id, owner_id, hotel_name, inputs jsonb, results jsonb, engine_version, share_token unique,
created_at, updated_at); leads(id, project_id null, hotel_name, city, rooms, contact_name, email, phone,
message, consent bool, inputs jsonb, results jsonb, status 'new'|'contacted'|'quoted'|'won'|'lost',
owner_id -> admin profile, created_at); lead_notes(id, lead_id, author_id, body, created_at);
lead_events(id, lead_id, kind 'created'|'status'|'owner'|'email'|'note'|'file', data jsonb, actor_id,
created_at); lead_files(id, lead_id, path, name, size, uploaded_by, created_at). Private Storage bucket
'lead-files', admins only. RLS: users see only their own projects; anyone can read a project by its
share_token through getSharedProject; leads, notes, events, files: admins only (insert of a lead is open
via the server action). Functions: getMyProjects(), getProject(id), saveProject({hotelName, inputs}),
deleteProject(id), getSharedProject(token), submitStudyRequest(form) -> {ok, leadId} | {ok:false, error},
listLeads({status?, city?, mine?}), getLeadCounts(), getLead(id), setLeadStatus(id, status),
assignLead(id, ownerId), addLeadNote(id, body), uploadLeadFile(id, file), getLeadFileUrl(fileId),
listAdmins(), getCurrentUser() -> {id, email, role} | null. Results are always computed on the SERVER with
sizeHotel (never trusted from the browser) and stored with ENGINE_VERSION. Until the real backend lands,
src/lib/db/ ships an in-memory fake with the same signatures and seeded demo leads.

GIT: one branch per ticket, named <member>/<issue-number>-<short-name> (e.g. ahmed/9-tool-configurator),
small PRs to the default branch, "Closes #N" in the PR body. Mohamed reviews and merges. CI (typecheck,
lint, Vitest, Playwright) must be green. Each task is a GitHub issue titled "[Member] ..."; an issue lists
the issues it is blocked by. Work your issues in order.

MY ROLE: Energy engine & reports (Hamza). I own: src/lib/engine/**, src/lib/present/**, src/lib/report/**, src/app/api/projects/[id]/report/**, src/app/api/share/[token]/report/**, src/content/method.ts, messages/en/{engine,method}.json, docs/engine/**.
Reply "Ready" and wait for my first task.
```

## Your issues, in order

| # | Issue | Blocked by |
|---|---|---|
| 1 | [#5 Port the sizing engine to TypeScript with Vitest](https://github.com/mc2068/kizuna/issues/5) | #3 (Mohamed) |
| 2 | [#12 Write the presentation helpers for ranges, verdicts and warnings](https://github.com/mc2068/kizuna/issues/12) | #5 (Hamza) |
| 3 | [#13 Run the engine on the server and snapshot results for saved projects and leads](https://github.com/mc2068/kizuna/issues/13) | #5 (Hamza), #6 (Mohamed) |
| 4 | [#14 Freeze the demo numbers and write the method content](https://github.com/mc2068/kizuna/issues/14) | #5 (Hamza) |
| 5 | [#23 Generate the downloadable PDF report](https://github.com/mc2068/kizuna/issues/23) | #12 (Hamza), #13 (Hamza) |

## Prompts

### Prompt 1: Port the sizing engine to TypeScript with Vitest (#5)

```
Port the [PRODUCT NAME] sizing engine to TypeScript.
Source of truth: engine/model.mjs, engine/profiles.mjs, engine/model.test.mjs, docs/engine/spec.md.
- Create src/lib/engine/{types.ts (Contract 1 types, already there from the scaffold: keep them),
  profiles.ts, params.ts (PARAMS, FIXED, STEG_TOU), model.ts (sizeHotel, evaluateSize, paramsFor, touSlot),
  index.ts}. Pure functions, no DOM, no network, no Date.now, strict types, no any.
- Port every test in engine/model.test.mjs to src/lib/engine/model.test.ts (Vitest).
- Golden tests: Djerba 300 rooms pool -> trigeneration 200 kWe + 64 kWc, payback 5 / 9 / 21.5, CHP-only
  100 kWe 4.5 / 7.5 / 15.5; plus 100 rooms Djerba, 300 Tozeur, 500 Djerba from the spec tables.
- Parity test: import the reference engine/model.mjs and compare deep-equal output with the TS port for
  rooms in [50, 100, 300, 500, 800] x 4 cities x pool on/off x elecPrice [null, 0.296].
- index.ts: export * from './model'; export const ENGINE_VERSION = '2.0.0'. Keep fake.ts for tests only.
- Add a 20 ms performance assertion for sizeHotel. Run pnpm test and pnpm typecheck until green.
If anything in the reference model looks wrong, do not fix it silently: write it down for me and keep parity.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch hamza/5-<short-name>, and open a PR with "Closes #5".
```

**Done when:**
- [ ] `src/lib/engine/` passes every ported test, the golden tests and the parity test
- [ ] No `any`, no I/O, `sizeHotel` runs in under 20 ms
- [ ] `index.ts` exports the real engine; the fake stays only for tests
- [ ] Merged

### Prompt 2: Write the presentation helpers for ranges, verdicts and warnings (#12)

```
Write src/lib/present/index.ts for [PRODUCT NAME], with tests in src/lib/present/present.test.ts.
- formatTnd(n): < 1,000,000 -> "200k TND", >= 1M -> "1.75 M TND"; never more precision than the engine.
- formatYears(n): "9 years", "21.5 years", 99 -> "over 30 years".
- formatRange(option, key, kind): returns { favourable, central, unfavourable, text } where text is e.g.
  "5 to 21.5 years (9 central)". For money and payback, favourable is the better end.
- formatKw, formatTonnes, formatPercent, formatHours (full-load hours "5,700 h/yr").
- verdictTone(verdict) -> 'good' | 'maybe' | 'weak'; verdictKey(verdict) -> i18n key.
- warningText: map each warning the engine emits (see sizeHotel in src/lib/engine/model.ts) to a key in
  messages/en/engine.json with parameters (ICU format for next-intl). Change the engine to emit
  { code, params } warnings if that is cleaner: then update Contract 1 in all four role files and tell
  Ahmed.
- en-GB number formatting through Intl.NumberFormat. Pure functions, no React.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch hamza/12-<short-name>, and open a PR with "Closes #12".
```

**Done when:**
- [ ] Every helper has Vitest tests, including rounding edge cases
- [ ] Warnings are mapped to i18n keys, none shown raw
- [ ] Ahmed and Gaith have been told the helpers are ready
- [ ] Merged

### Prompt 3: Run the engine on the server and snapshot results for saved projects and leads (#13)

```
Write src/lib/engine/snapshot.ts for [PRODUCT NAME] with tests.
- sizingInputSchema (zod): rooms int 50-800, city enum, pool boolean, elecPrice number 0.05-1 or null.
- snapshot(input): parse -> sizeHotel -> { inputs, results, engineVersion: ENGINE_VERSION }. Drop nothing
  the UI needs (the share page and PDF render from this), but keep hourly arrays compact (integers).
- isStale(s): s.engineVersion !== ENGINE_VERSION. rerun(s): snapshot(s.inputs).
- Export a parseToolSearchParams(searchParams) helper that Ahmed's /tool page and the request-study form
  share, so URL parsing has one implementation.
- Tests: valid demo input; every invalid field; staleness; the JSON of a snapshot stays under 20 KB.
Tell Mohamed the function is ready so saveProject and submitStudyRequest use it.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch hamza/13-<short-name>, and open a PR with "Closes #13".
```

**Done when:**
- [ ] zod schema rejects bad inputs with clear messages
- [ ] `snapshot()` is used by `saveProject` and `submitStudyRequest`
- [ ] Tests cover validation, staleness and size of the stored JSON
- [ ] Merged

### Prompt 4: Freeze the demo numbers and write the method content (#14)

```
Create src/content/method.ts for [PRODUCT NAME], built from the engine (src/lib/engine) and
docs/engine/spec.md, docs/research/assumptions-audit.md.
- demo: sizeHotel({ rooms: 300, city: 'djerba', pool: true, elecPrice: null }) plus a label.
- assumptions: from PARAMS and FIXED, with id, label, three values, unit, source text, source URL(s)
  extracted, status (sourced / estimated / unconfirmed, from the audit).
- sensitivity: for each parameter, central payback with that parameter at its unfavourable and favourable
  value and the rest central (the "What moves the central 9-year payback" table), sorted by impact.
- limits: the "Not modelled yet" list; plain-English method steps (how the tool calculates, 6-8 steps,
  written for a hotel manager, from docs/research/how-the-calculation-works.md but updated for v2).
- references: [{ id, title, publisher, url, accessed }] with stable ids used by <Footnote id=.../>.
- method.test.ts: pins the frozen Djerba numbers (docs/team/README.md table). If they change, the test
  must fail and you update the table, the README and tell the team.
English text lives in messages/en/method.json where it is UI copy; long-form method text can stay in
method.ts as structured data.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch hamza/14-<short-name>, and open a PR with "Closes #14".
```

**Done when:**
- [ ] `method.ts` exports demo results, assumptions, sensitivity, limits and references with ids
- [ ] A test pins the frozen numbers in the team README
- [ ] Gaith has been told the content is ready
- [ ] Merged

### Prompt 5: Generate the downloadable PDF report (#23)

```
Build the [PRODUCT NAME] PDF report.
- src/lib/report/Report.tsx with @react-pdf/renderer: A4, Inter fonts registered, Contract 2 colours.
  Pages: 1 Cover (siteConfig.name, hotel name, "300 rooms · Djerba · pool", date, verdict, headline plant);
  2 Results (ranges for capex, savings, payback, FTE payback "eligibility unconfirmed", CO2, full-load
  hours, primary energy saving, peak relief; options side by side); 3 Hourly summer and winter (simple
  SVG line/area charts built from HourRow); 4 Assumptions table with sources; 5 Limits, method summary,
  engine version, disclaimer "screening estimate, not a quote".
- Use only @/lib/present for formatting, render from the stored snapshot (project.results).
- src/app/api/projects/[id]/report/route.ts: owner only (getProject respects RLS), runtime nodejs,
  Content-Disposition attachment "<hotel>-screening.pdf". src/app/api/share/[token]/report/route.ts via
  getSharedProject.
- A Vitest test that renders the demo snapshot to a buffer and checks it is a PDF over 10 KB.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch hamza/23-<short-name>, and open a PR with "Closes #23".
```

**Done when:**
- [ ] PDF opens from My projects and from a share link
- [ ] Every number matches the web page for the same project
- [ ] Renders in under 3 s on a Vercel preview
- [ ] Merged

## Rules

- Only edit files you own. If you need a change elsewhere, ask the owner (or comment on their issue).
- If a contract has to change, agree it with the other member involved, update the contract in **all four** role files and `README.md` in the same PR, and tell the team.
- Small PRs, one per issue. Mohamed reviews and merges; CI must be green.
- Write `[PRODUCT NAME]` literally, from `siteConfig.name` in code. Never invent a name.
