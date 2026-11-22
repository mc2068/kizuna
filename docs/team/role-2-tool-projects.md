# Role 2: Tool & projects

**Owner:** Ahmed (`@Ahmedbenslama`)

You build what hotels actually use: the sizing tool (configurator, results as ranges, hourly dashboard), saving a project even before signing in, My projects, the public share page, and on the admin side the lead detail page the team works in every day.

**Your files:** `src/app/tool/**`, `src/components/tool/**`, `src/app/projects/**`, `src/app/p/**`, `src/app/admin/leads/[id]/**`, `src/components/lead/**`, `messages/en/{tool,projects,lead}.json`

**You depend on:** Contract 1 (engine output, via `@/lib/engine` and `@/lib/present`), Contract 2 (Gaith's components), Contract 3 (Mohamed's `src/lib/db`). All three ship as fakes on day 1, so start immediately and the real ones drop in underneath you.

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

MY ROLE: Tool & projects (Ahmed). I own: src/app/tool/**, src/components/tool/**, src/app/projects/**, src/app/p/**, src/app/admin/leads/[id]/**, src/components/lead/**, messages/en/{tool,projects,lead}.json.
Reply "Ready" and wait for my first task.
```

## Your issues, in order

| # | Issue | Blocked by |
|---|---|---|
| 1 | [#9 Build the sizing tool configurator with live results](https://github.com/mc2068/kizuna/issues/9) | #3 (Mohamed), #4 (Gaith) |
| 2 | [#10 Show tool results as ranges with verdict, options and assumptions](https://github.com/mc2068/kizuna/issues/10) | #9 (Ahmed) |
| 3 | [#11 Add the hourly dashboard (summer and winter day)](https://github.com/mc2068/kizuna/issues/11) | #9 (Ahmed) |
| 4 | [#21 Save a project, including before sign-in](https://github.com/mc2068/kizuna/issues/21) | #10 (Ahmed), #7 (Mohamed), #13 (Hamza) |
| 5 | [#22 Build My projects and the shared project page](https://github.com/mc2068/kizuna/issues/22) | #21 (Ahmed) |
| 6 | [#25 Build the admin lead detail page with Overview, Notes, History and Files](https://github.com/mc2068/kizuna/issues/25) | #24 (Gaith), #19 (Mohamed) |
| 7 | [#27 Switch the tool to the real engine and polish it](https://github.com/mc2068/kizuna/issues/27) | #5 (Hamza), #12 (Hamza), #10 (Ahmed), #11 (Ahmed) |

## Prompts

### Prompt 1: Build the sizing tool configurator with live results (#9)

```
Build the sizing tool page for [PRODUCT NAME]: src/app/tool/page.tsx (server shell + metadata) and a
client component src/components/tool/Configurator.tsx. Look at the "Screen your hotel" section of
prototypes/ui/landing.html and the screenshots first: same feel, store-style configurator with a sticky
summary.
- Inputs (shadcn via Role 3): Rooms slider 50-800 step 10 with the value shown large; City as 4 pills
  (Djerba, Sousse, Hammamet, Tozeur); Pool switch; Electricity price: radio "STEG time-of-use (default)" or
  "Flat price" with a number input TND/kWh step 0.005. Defaults 300, djerba, true, null.
- import { sizeHotel } from '@/lib/engine' (never the fake directly). Recompute on change, debounced 50 ms,
  useMemo; keep it under one frame.
- URL state with useSearchParams + router.replace (no history spam); parse and clamp invalid values.
- Sticky summary (right on desktop, bottom sheet on mobile): verdict badge, plant size, central payback
  and the range, "See full results" anchor. Detailed cards come in the next ticket.
- All strings in messages/en/tool.json. Tabular numerals. Test at 360, 768, 1440 px.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch ahmed/9-<short-name>, and open a PR with "Closes #9".
```

**Done when:**
- [ ] All four inputs work by mouse and keyboard and are labelled
- [ ] Results update with no submit button and no layout jump
- [ ] The URL restores the same result on reload
- [ ] Merged

### Prompt 2: Show tool results as ranges with verdict, options and assumptions (#10)

```
Add the full results to the [PRODUCT NAME] sizing tool (src/components/tool/Results.tsx and children).
Reference: the Djerba demo and "What moves the answer" sections of prototypes/ui/landing.html.
- Verdict header: badge (verdictTone from @/lib/present), one sentence per verdict from tool.json, the
  warnings list (warningText). Weak fit: say so plainly and point to what would change it.
- Cards: Plant (engineKwe kWe + chillerKwc kWc), Investment (capexTnd), Annual savings, Payback (central
  big, range below; FTE payback small with "FTE eligibility unconfirmed"), CO2 avoided (t/yr), Full-load
  hours, Primary energy saving, Peak grid relief at the summer peak. Ranges use Role 3's <RangeRail/>.
- Options: if options.best differs from options.trigeneration and pays back faster, show two columns
  "Trigeneration" vs "CHP only (hot water and pool)", headline marked.
- Assumptions: a <details> or shadcn Collapsible table: name, unfavourable, central, favourable, unit,
  source (URLs turned into links, target _blank rel noopener). Link to /sources.
- CTA block: "Save this project" (wired in a later ticket, disabled for now) and "Request a study"
  (/request-study with the inputs in the query string).
- Never format numbers inline: only @/lib/present helpers. Strings in tool.json.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch ahmed/10-<short-name>, and open a PR with "Closes #10".
```

**Done when:**
- [ ] Every Contract 1 output is shown, as a range where it is one
- [ ] Weak-fit hotels see an honest message and the reasons (warnings)
- [ ] Assumptions table shows all sources as links
- [ ] Merged

### Prompt 3: Add the hourly dashboard (summer and winter day) (#11)

```
Add the hourly dashboard to the [PRODUCT NAME] sizing tool: src/components/tool/HourlyChart.tsx.
Use shadcn's chart component (Recharts). Data: result.hourly.summer / winter (Contract 1 HourRow).
- Tabs: Electricity | Hot water | Cooling, plus a Summer/Winter segmented control.
- Electricity: stacked area engineElec (var(--elec)) + gridImport (var(--faint)), dashed line elecDemand.
- Hot water: heatDemand line vs recoveredHeat area (var(--heat)).
- Cooling: coolDemand line vs chillerCool area (var(--cool)); caption explains that cooling coverage is
  small and why (the value is year-round heat).
- Caption per season and tab from tool.json with numbers filled in (e.g. engine share at 15:00).
- Tooltips "kW" with hour "15:00"; x axis 0-23; responsive; prefers-reduced-motion disables animation.
- A visually hidden <table> with the same data for screen readers.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch ahmed/11-<short-name>, and open a PR with "Closes #11".
```

**Done when:**
- [ ] Summer/winter toggle works and animates in place
- [ ] Colours come from tokens: --elec, --heat, --cool, grid = --faint
- [ ] Readable at 360 px; accessible table fallback for screen readers
- [ ] Merged

### Prompt 4: Save a project, including before sign-in (#21)

```
Add saving to the [PRODUCT NAME] sizing tool.
- SaveDialog (shadcn Dialog): hotel name (required, 2-80 chars). Server action calls saveProject({ hotelName,
  inputs }) from @/lib/db; saveProject snapshots on the server.
- Signed out (getCurrentUser() null, passed from the server page): store { hotelName, inputs, savedAt } in
  localStorage key 'pending-project' (try/catch), redirect to /sign-in?next=/tool?resume=1.
- On /tool?resume=1 with a user: read the pending project, save it once (guard against double saves with a
  flag), clear storage, toast "Saved to My projects" with a link, remove resume from the URL.
- Pending item older than 24 h is discarded. If storage is unavailable, fall back to keeping the inputs in
  the next URL so nothing is lost.
- Strings in tool.json. Unit-test the pending-project helpers (Vitest).

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch ahmed/21-<short-name>, and open a PR with "Closes #21".
```

**Done when:**
- [ ] Signed in: save works in one step
- [ ] Signed out: sign in by magic link and the project saves itself on return, once
- [ ] No result data is trusted from the client
- [ ] Merged

### Prompt 5: Build My projects and the shared project page (#22)

```
Build two pages for [PRODUCT NAME].
1. src/app/projects/page.tsx (server component): getMyProjects(); cards with hotel name, "300 rooms ·
   Djerba · pool", verdict badge, central payback + range (@/lib/present), updated date. Actions menu:
   Open (/tool with the inputs), Rename (dialog), Delete (confirm dialog), Copy share link
   (/p/<share_token>, toast), Download PDF (/api/projects/<id>/report, enabled when Hamza's route merges).
   Stale engine version (isStale) -> badge + "Re-run" action. Empty state -> /tool.
2. src/app/p/[token]/page.tsx: getSharedProject(token) or notFound(). Read-only: header with hotel name and
   inputs, <Results readOnly/> and <HourlyChart/> from the tool components, footnote of engine version and
   date, CTA "Screen your own hotel". metadata robots noindex. No owner name or email.
Strings in messages/en/projects.json.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch ahmed/22-<short-name>, and open a PR with "Closes #22".
```

**Done when:**
- [ ] Users see only their own projects (checked against RLS, not just the UI)
- [ ] Share link opens signed out and shows no personal data
- [ ] Empty state links to `/tool`
- [ ] Merged

### Prompt 6: Build the admin lead detail page with Overview, Notes, History and Files (#25)

```
Build the admin lead page for [PRODUCT NAME]: src/app/admin/leads/[id]/page.tsx and src/components/lead/*.
Reference: prototypes/ui/admin.html (lead view) and screenshots admin-lead-overview.png, -notes, -history,
-files.png; docs/design/admin-references/1-carbon-solutions-ramotion.jpg.
- getLead(id) or notFound(). Header: decorative coastal illustration band, hotel name, "City · rooms",
  status pill (dropdown -> setLeadStatus, optimistic), owner select (listAdmins -> assignLead), contact card
  (name, email mailto, phone tel), created date.
- Tabs (shadcn Tabs, ?tab= in URL):
  Overview: stored inputs, verdict + warnings, <RangeRail/>s from the stored results (reuse tool
  components readOnly), options, "Call checklist" and "Next step" from lead.json.
  Notes: textarea + addLeadNote, list newest first with author and time.
  History: lead_events timeline (created, status, owner, email, note, file) with icons and actors.
  Files: drop zone + file picker (PDF, images, docx, xlsx; 10 MB max) -> uploadLeadFile; list with size,
  uploader, date; download via getLeadFileUrl (signed URL, 60 s).
- Revalidate the page after each action. Strings in messages/en/lead.json.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch ahmed/25-<short-name>, and open a PR with "Closes #25".
```

**Done when:**
- [ ] Status and owner changes appear in History immediately
- [ ] Files upload, list and download; a non-admin cannot reach them
- [ ] Tabs keep their state in the URL (`?tab=notes`)
- [ ] Merged

### Prompt 7: Switch the tool to the real engine and polish it (#27)

```
The real [PRODUCT NAME] engine (src/lib/engine) and presentation helpers (src/lib/present) are merged.
1. Run /tool for: 4 cities x pool on/off x rooms 50, 100, 300, 800 x price null and 0.296. Fix anything on
   my side; if the engine output does not match Contract 1, tell me exactly which field differs so I can
   raise it with Hamza. Check weak fit (100 rooms Djerba) and the CHP-only comparison.
2. Motion pass (Framer Motion) like prototypes/ui/landing.html: rails glide to new values, numbers tween
   (~400 ms), verdict badge pops on change; everything instant under prefers-reduced-motion.
3. No layout shift (fixed widths, tabular-nums), focus styles, hover states, no console errors.
4. Check 360, 768, 1440 and 1920 px; Lighthouse performance and accessibility 90+.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch ahmed/27-<short-name>, and open a PR with "Closes #27".
```

**Done when:**
- [ ] All input combinations above render correctly with the real engine
- [ ] Numbers tween and rails glide; instant under reduced motion
- [ ] No console errors; Lighthouse 90+ on `/tool`
- [ ] Merged

## Rules

- Only edit files you own. If you need a change elsewhere, ask the owner (or comment on their issue).
- If a contract has to change, agree it with the other member involved, update the contract in **all four** role files and `README.md` in the same PR, and tell the team.
- Small PRs, one per issue. Mohamed reviews and merges; CI must be green.
- Write `[PRODUCT NAME]` literally, from `siteConfig.name` in code. Never invent a name.
