# Role 4: Platform, integration & QA

**Owner:** Mohamed (`@mc2068`)

You lead: you set up the app everyone builds on, the database, sign-in, email, CI and hosting, you review and merge every PR, and you run the end-to-end tests and the launch. Your first ticket unblocks the whole team, so it goes first, within hours.

**Your files:** `package.json`, `next.config.ts`, `src/middleware.ts`, `src/app/layout.tsx`, `src/i18n/**`, `src/config/site.ts`, `supabase/**`, `src/lib/{supabase,db}/**`, `src/lib/engine/fake.ts`, `src/app/{sign-in,auth}/**`, `src/app/api/**` (except the report routes), `src/emails/**`, `.github/workflows/**`, `e2e/**`, `README.md`

**You depend on:** You publish Contract 3 and the scaffold that holds fakes of Contracts 1 and 3. You review every PR against the three contracts.

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
trigeneration 200 kWe + 64 kWc, capex 1.24 / 1.75 / 2.36 M TND, savings 260k / 200k / 110k TND/yr,
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

MY ROLE: Platform, integration & QA (Mohamed). I own: package.json, next.config.ts, src/middleware.ts, src/app/layout.tsx, src/i18n/**, src/config/site.ts, supabase/**, src/lib/{supabase,db}/**, src/lib/engine/fake.ts, src/app/{sign-in,auth}/**, src/app/api/** (except the report routes), src/emails/**, .github/workflows/**, e2e/**, README.md.
Reply "Ready" and wait for my first task.
```

## Your issues, in order

| # | Issue | Blocked by |
|---|---|---|
| 1 | [#3 Scaffold the Next.js app with page stubs, fake engine and fake data layer](https://github.com/mc2068/kizuna/issues/3) | nothing |
| 2 | [#6 Create the Supabase schema, row-level security, roles and Storage](https://github.com/mc2068/kizuna/issues/6) | #3 (Mohamed) |
| 3 | [#7 Add sign-in with magic link and Google, and protect the signed-in pages](https://github.com/mc2068/kizuna/issues/7) | #6 (Mohamed), #4 (Gaith) |
| 4 | [#8 Set up CI, Vercel preview deploys and the Supabase cloud project](https://github.com/mc2068/kizuna/issues/8) | #3 (Mohamed) |
| 5 | [#19 Save study requests and send emails with Resend](https://github.com/mc2068/kizuna/issues/19) | #6 (Mohamed), #13 (Hamza) |
| 6 | [#26 Write Playwright tests for the key flows](https://github.com/mc2068/kizuna/issues/26) | #8 (Mohamed), #7 (Mohamed), #15 (Gaith), #16 (Gaith), #17 (Gaith), #18 (Gaith), #20 (Gaith), #21 (Ahmed), #22 (Ahmed), #23 (Hamza), #24 (Gaith), #25 (Ahmed) |
| 7 | [#28 Run the integration pass and launch](https://github.com/mc2068/kizuna/issues/28) | #26 (Mohamed), #27 (Ahmed) |

## Prompts

### Prompt 1: Scaffold the Next.js app with page stubs, fake engine and fake data layer (#3)

```
Scaffold the [PRODUCT NAME] app in this repo (it holds only docs, engine/ and prototypes/ today).
- Next.js (latest, App Router, TypeScript strict, src/ dir, ESLint, import alias @/*), pnpm.
- Tailwind CSS + shadcn/ui init (leave theming to Role 3: just install). next-intl WITHOUT i18n routing:
  src/i18n/request.ts loads messages/en/*.json and merges them by namespace (common, marketing, tool,
  projects, admin, lead, auth, forms). Add a tiny lint rule or note: no hard-coded user-facing strings.
- src/config/site.ts: export const siteConfig = { name: '[PRODUCT NAME]', ... } and use it in metadata.
- One stub page per route in "PAGES (14) AND OWNERS", each showing its title and owner, so all links work.
- src/lib/engine/types.ts with the Contract 1 types exactly; src/lib/engine/fake.ts returning the frozen
  Djerba numbers in that shape (24 plausible hourly rows per season); src/lib/engine/index.ts re-exports
  the fake for now, plus ENGINE_VERSION = '0.0.0-fake'.
- src/lib/present/index.ts: simple formatTnd, formatRange, verdictTone, warningText (Role 1 replaces them).
- src/lib/db/: every Contract 3 function as an in-memory fake (module-level arrays), with typed inputs and
  outputs in src/lib/db/types.ts; seed ~15 demo leads from prototypes/ui/admin-data.js. submitStudyRequest
  and saveProject must call sizeHotel on the server, not trust results from the client.
- package.json scripts: dev, build, start, lint, typecheck (tsc --noEmit), test (vitest), e2e (playwright).
Keep engine/model.mjs and its test where they are: they are the reference for the port.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch mohamed/3-<short-name>, and open a PR with "Closes #3".
```

**Done when:**
- [ ] `pnpm dev` serves all 14 routes
- [ ] `sizeHotel()` from `@/lib/engine` returns the full Contract 1 shape (fake)
- [ ] Every Contract 3 function exists in `src/lib/db/` with an in-memory fake
- [ ] Merged, and the team has been told to pull

### Prompt 2: Create the Supabase schema, row-level security, roles and Storage (#6)

```
Set up Supabase for [PRODUCT NAME] exactly as Contract 3 says.
- supabase init; migrations in supabase/migrations/: enums lead_status and user_role; tables profiles,
  projects, leads, lead_notes, lead_events, lead_files with FKs, timestamps, indexes (leads.status,
  leads.owner_id, projects.owner_id, projects.share_token unique).
- Trigger: on auth.users insert, create profiles(id, role 'user'). Function is_admin() security definer.
- RLS on every table. projects: owner can select/insert/update/delete own rows. getSharedProject goes
  through a security-definer RPC get_shared_project(token) that returns only hotel_name, inputs, results,
  engine_version, created_at. leads/notes/events/files: admins only; leads insert only through the
  service role in the server action (no public insert policy).
- Storage: private bucket lead-files; policies allow select/insert/delete only when is_admin().
- Triggers that write lead_events on status and owner changes.
- supabase/seed.sql: the 4 team members as admins (placeholder emails), ~15 demo leads.
- Replace the fakes in src/lib/db/*.ts with @supabase/ssr server-client calls, same signatures.
- Tests: tests/rls.test.ts against local Supabase proving each policy (user A vs user B vs admin vs anon).
- Generate src/lib/supabase/types.ts with `supabase gen types`.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch mohamed/6-<short-name>, and open a PR with "Closes #6".
```

**Done when:**
- [ ] `supabase db reset` builds the schema and seed from scratch
- [ ] RLS tests (SQL or Vitest against local Supabase) prove a user cannot read another user's project or any lead, and a non-admin cannot read `lead-files`
- [ ] `src/lib/db/` talks to Supabase with unchanged signatures
- [ ] Merged

### Prompt 3: Add sign-in with magic link and Google, and protect the signed-in pages (#7)

```
Add authentication to [PRODUCT NAME] with Supabase Auth and @supabase/ssr.
- src/lib/supabase/{server.ts, client.ts, middleware.ts} helpers.
- src/app/sign-in/page.tsx: Keynote style (use Role 3's components), email field + "Email me a link",
  "Continue with Google", consent line linking /privacy, success state "Check your inbox". Accepts ?next=.
- src/app/auth/callback/route.ts: exchanges the code, redirects to next (only same-origin paths).
- Sign-out server action. getCurrentUser() in src/lib/db/auth.ts returns {id, email, role} | null.
- src/middleware.ts: refresh session on every request; /projects requires a user; /admin/** requires
  role admin (respond with notFound for others, do not reveal the area).
- Google provider config documented in README (redirect URLs for local, preview, production).
- Strings in messages/en/auth.json.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch mohamed/7-<short-name>, and open a PR with "Closes #7".
```

**Done when:**
- [ ] Magic link and Google sign-in work locally and on a Vercel preview
- [ ] `/projects` redirects to sign-in when signed out; `/admin` returns 404 for non-admins
- [ ] `?next=` returns the visitor where they started
- [ ] Merged

### Prompt 4: Set up CI, Vercel preview deploys and the Supabase cloud project (#8)

```
Set up CI and hosting for [PRODUCT NAME].
- .github/workflows/ci.yml on pull_request and push to the default branch: pnpm install (cache),
  typecheck, lint, test (Vitest), build, then Playwright (chromium) against `pnpm start`, uploading the
  report as an artifact on failure. Use concurrency to cancel stale runs.
- A second job that starts local Supabase (supabase/setup-cli action) and runs the RLS tests.
- .env.example: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY, EMAIL_FROM, TEAM_NOTIFY_EMAIL, NEXT_PUBLIC_SITE_URL. Nothing secret committed.
- Write the step-by-step for me (I will click it): Vercel project from the repo, env vars per environment,
  Supabase cloud project, `supabase link` + `supabase db push`, Google OAuth redirect URLs.
- Add @vercel/analytics in src/app/layout.tsx (cookie-free).
- README: how to run locally (pnpm, supabase start, .env.local), how to deploy, links.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch mohamed/8-<short-name>, and open a PR with "Closes #8".
```

**Done when:**
- [ ] CI is required and green on the default branch
- [ ] Every PR gets a Vercel preview link
- [ ] `.env.example` lists every variable; no secret in the repo
- [ ] Merged, production URL in README

### Prompt 5: Save study requests and send emails with Resend (#19)

```
Make study requests real for [PRODUCT NAME].
- src/lib/db/leads.ts submitStudyRequest(formData): zod schema (contactName, email, phone optional,
  hotelName, city, rooms, pool, elecPrice, message optional, consent must be true, honeypot empty).
  Compute snapshot(inputs) from @/lib/engine/snapshot on the server. Insert with the service-role client,
  status 'new', owner = admin with the fewest open leads. lead_events 'created'.
- Rate limit: 5 requests per IP per hour (a small table or Vercel KV-free in-memory fallback in dev).
- src/emails/: TeamNewLead.tsx (hotel, contact, verdict, payback range, link to /admin/leads/[id]) and
  HotelConfirmation.tsx (thanks, what happens next, their screening summary, privacy link). React Email.
- Send with Resend (RESEND_API_KEY, EMAIL_FROM, TEAM_NOTIFY_EMAIL); write a lead_events 'email' row for
  each send; never fail the request if email fails, but log it as an event with the error.
- Return { ok: true, leadId } or { ok: false, error, fieldErrors } for Gaith's form.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch mohamed/19-<short-name>, and open a PR with "Closes #19".
```

**Done when:**
- [ ] A request from the form appears in the admin pipeline with its sizing
- [ ] Team and hotel emails arrive (tested on a preview with a Resend test domain)
- [ ] Missing consent or bad input returns field errors
- [ ] Merged

### Prompt 6: Write Playwright tests for the key flows (#26)

```
Write the Playwright suite for [PRODUCT NAME] in e2e/.
- playwright.config.ts: webServer pnpm start, baseURL, chromium + a mobile project (Pixel 7), trace off by
  default, retries 0 locally.
- Helpers: sign in through the magic link read from local Supabase's Inbucket/Mailpit API; seed admin.
- tests: tool.spec (defaults show "possible fit", change city to Tozeur and rooms to 100, URL restores);
  save.spec (signed out -> save -> sign in -> project appears once in /projects -> share link works signed
  out and shows no email -> PDF responds application/pdf); request.spec (submit the form from /tool's CTA,
  then as admin see it in /admin with status new, change to contacted, see History, upload a small PDF);
  pages.spec (every public route returns 200, has an h1, no console errors, @axe-core/playwright with no
  serious or critical violations); access.spec (non-admin gets 404 on /admin, anon redirected from
  /projects).
- Wire into CI with local Supabase (supabase start in the job).

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch mohamed/26-<short-name>, and open a PR with "Closes #26".
```

**Done when:**
- [ ] The flows above pass in CI
- [ ] No serious axe violations on public pages
- [ ] Flaky tests: zero retries needed over 5 runs
- [ ] Merged

### Prompt 7: Run the integration pass and launch (#28)

```
Help me run the [PRODUCT NAME] integration pass before launch.
1. grep for leftover fakes (src/lib/engine/fake, in-memory db) outside tests and remove them.
2. Walk every route on the production URL; for each, list problems (broken links, console errors, missing
   strings, hard-coded text outside messages/, hard-coded product name outside siteConfig).
3. Compare the Djerba numbers on /, /tool, /case-study/djerba, /sources and the PDF with the frozen table in
   docs/team/README.md; report any difference with the page and field.
4. Check every form has consent + privacy link, analytics is cookie-free, RLS tests pass against the cloud
   project (read-only checks), Storage bucket is private.
5. Write docs/team/launch-checklist.md: domain + Vercel, Supabase backups and auth URLs, Resend domain
   (SPF/DKIM), Google OAuth consent screen, admin accounts, error monitoring, who is on call. Tick what is done.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch mohamed/28-<short-name>, and open a PR with "Closes #28".
```

**Done when:**
- [ ] Production URL works end to end with real email
- [ ] Frozen numbers identical on every page and the PDF
- [ ] Launch checklist in `docs/team/launch-checklist.md` is complete
- [ ] Closed after the team signs off

## Rules

- Only edit files you own. If you need a change elsewhere, ask the owner (or comment on their issue).
- If a contract has to change, agree it with the other member involved, update the contract in **all four** role files and `README.md` in the same PR, and tell the team.
- Small PRs, one per issue. Mohamed reviews and merges; CI must be green.
- Write `[PRODUCT NAME]` literally, from `siteConfig.name` in code. Never invent a name.
