# Role 3: Pages & design

**Owner:** Gaith (`@GHAYTH-LAB`)

You own how [PRODUCT NAME] looks and reads. You turn the Keynote prototype into a design system everyone uses, then build the public pages (Home, How it works, Services, Djerba case study, About, Sources and method, Request a study, Privacy) and the admin pipeline. One idea per screen, huge type, every claim footnoted.

**Your files:** `src/app/globals.css`, Tailwind config, `src/components/{ui,layout,marketing,admin/pipeline}/**`, `public/**`, the public pages, `src/app/admin/page.tsx`, `messages/en/{common,marketing,forms,admin}.json`

**You depend on:** Contract 2 (you publish it), Contract 1 (numbers via `@/lib/engine` and `@/lib/present`, never typed in), `src/content/method.ts` from Hamza for Sources and the case study, Contract 3 for the request form and the pipeline.

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
type PlantOption = { engineKwe: number; chillerKwc: number; verdict: Verdict; warnings: string[];
  scenarios: Record<Scenario, ScenarioResult> };
type Verdict = 'good fit' | 'possible fit, needs a study' | 'weak fit';
type HourRow = { hour; elecDemand; heatDemand; coolDemand; engineElec; recoveredHeat; chillerCool; gridImport };
type SizingResult = PlantOption & {            // headline = trigeneration option if any, else best
  options: { best: PlantOption | null; trigeneration: PlantOption | null };
  hourly: { summer: HourRow[]; winter: HourRow[] };   // 24 rows each, headline option, central case
  assumptions: { name; unfavourable; central; favourable; unit; source }[] };
export function sizeHotel(input: SizingInput): SizingResult;   // pure: no I/O, deterministic, < 20 ms
export const ENGINE_VERSION: string;                           // e.g. '2.0.0', stored with every saved run
It must match the reference model engine/model.mjs and pass the ported engine/model.test.mjs.
Presentation helpers (src/lib/present/index.ts, Role 1): formatTnd, formatRange(scenarios, key, unit),
verdictTone(verdict) -> 'good' | 'maybe' | 'weak', warningText(w). UI never formats engine numbers itself.

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
created_at, updated_at); leads(id text 'L-1001', project_id null, hotel_name, city, rooms, contact_name,
email, phone, message, consent bool, inputs jsonb, results jsonb, engine_version, status
'new'|'contacted'|'quoted'|'won'|'lost', owner_id -> admin profile (default: fewest open leads), created_at); lead_notes(id, lead_id, author_id, body, created_at);
lead_events(id, lead_id, kind 'created'|'status'|'owner'|'email'|'note'|'file', data jsonb, actor_id,
created_at); lead_files(id, lead_id, path, name, size, uploaded_by, created_at). Private Storage bucket
'lead-files', admins only. RLS: users see only their own projects; anyone can read a project by its
share_token through getSharedProject; leads, notes, events, files: admins only (insert of a lead is open
via the server action). Projects and leads are inserted by the server with the service role (results are
server-computed); owners may only rename or delete a project, admins may only change a lead's status and
owner. Database triggers log the created, status, owner, note and file events; the server logs emails. Functions: getMyProjects(), getProject(id), saveProject({hotelName, inputs}),
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

MY ROLE: Pages & design (Gaith). I own: src/app/globals.css, Tailwind config, src/components/{ui,layout,marketing,admin/pipeline}/**, public/**, the public pages, src/app/admin/page.tsx, messages/en/{common,marketing,forms,admin}.json.
Reply "Ready" and wait for my first task.
```

## Your issues, in order

| # | Issue | Blocked by |
|---|---|---|
| 1 | [#4 Build the design system, layout, header and footer](https://github.com/mc2068/kizuna/issues/4) | #3 (Mohamed) |
| 2 | [#15 Build the Home page](https://github.com/mc2068/kizuna/issues/15) | #4 (Gaith) |
| 3 | [#16 Build the How it works and Services and pricing pages](https://github.com/mc2068/kizuna/issues/16) | #4 (Gaith) |
| 4 | [#17 Build the Djerba case study and About pages](https://github.com/mc2068/kizuna/issues/17) | #4 (Gaith), #14 (Hamza) |
| 5 | [#18 Build the Sources and method and Privacy pages](https://github.com/mc2068/kizuna/issues/18) | #4 (Gaith), #14 (Hamza) |
| 6 | [#20 Build the Request a study page and form](https://github.com/mc2068/kizuna/issues/20) | #4 (Gaith) |
| 7 | [#24 Build the admin leads pipeline](https://github.com/mc2068/kizuna/issues/24) | #4 (Gaith), #6 (Mohamed) |

## Prompts

### Prompt 1: Build the design system, layout, header and footer (#4)

```
Build the design system for [PRODUCT NAME] from prototypes/ui/landing.html and admin.html (open them, and
the screenshots in prototypes/ui/screenshots/). Use only Contract 2 token names and values.
1. src/app/globals.css: tokens as CSS variables on :root, mapped to the Tailwind theme (colors bg, ink,
   muted, faint, line, tile, link, btn, elec, heat, cool, good, maybe, weak, status-*) and to the shadcn
   variables (--background, --foreground, --primary = btn, --ring, --radius ...). Inter Tight (display) and
   Inter (text) via next/font in a fonts.ts that src/app/layout.tsx imports (ask Mohamed to add the class).
   Body 17px/1.47, tight letter-spacing, tabular numerals utility, huge display headings like the prototype.
2. Theme shadcn components: Button (pill, primary + ghost + link-with-chevron), Card, Input, Select, Switch,
   Tabs, Badge (verdict and status variants), Dialog, Sheet, Toast, Tooltip.
3. src/components/layout/: SiteHeader (frosted sticky nav like the prototype, siteConfig.name, links to
   How it works, Tool, Services, Case study, About; "Screen your hotel" CTA; sign-in or My projects from a
   `user` prop; mobile Sheet menu), SiteFooter, AdminShell (dark rail with Pipeline, Assigned to me).
4. src/components/marketing/: Section, Eyebrow, Footnote (superscript number linking to /sources#id),
   Rings (3 SVG rings, props {elec, heat, cool} as 0-1, animated stroke later), RangeRail (props
   {favourable, central, unfavourable, unit}, central marked).
5. A dev-only /dev/ui page showing every component. All strings in messages/en/common.json. Keyboard
   focus visible everywhere. Check 360, 768, 1440 px.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch gaith/4-<short-name>, and open a PR with "Closes #4".
```

**Done when:**
- [ ] Every Contract 2 token exists with the exact name and value
- [ ] Header, footer and AdminShell appear on every page and work at 360 px
- [ ] `<Rings/>` and `<RangeRail/>` are documented with an example on a `/dev/ui` page (dev only)
- [ ] Merged

### Prompt 2: Build the Home page (#15)

```
Build the Home page (src/app/page.tsx, sections in src/components/marketing/home/) for [PRODUCT NAME]
from prototypes/ui/landing.html. Open it and the landing screenshots side by side.
Sections, in order: Hero (eyebrow, h1 "Make your own energy. Only if it pays.", lede, CTAs "Screen your
hotel" -> /tool and "How it works" -> /how-it-works, <Rings/> with the Djerba coverage), Djerba demo on a
dark band (ranges via <RangeRail/>), "One engine. Three jobs.", "Most hotels will hear 'not yet'"
(screening honesty), "Screen your hotel" (embed <Configurator compact/> from @/components/tool if merged,
else a CTA card), "What moves the answer" (tornado from method.ts sensitivity once Hamza ships it; a
placeholder until then), "From a screening to a plant" (services teaser -> /services), "Already running in
Tunisia" (Pâtes Warda Sousse 4.4 MWe, Medicef Pharma 800 kWe, 52 companies 163 MW, as proof that
trigeneration works in Tunisia, not as hotel references), final CTA "Possible fit?" -> /request-study.
Numbers: import { sizeHotel } from '@/lib/engine' and format with @/lib/present. Copy in
messages/en/marketing.json. Footnotes with <Footnote/>. Metadata title and description.
Motion (Framer Motion) only as light scroll reveals for content below the fold; reduced-motion safe.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch gaith/15-<short-name>, and open a PR with "Closes #15".
```

**Done when:**
- [ ] Matches the prototype's sections and feel at 1440 and 360 px
- [ ] Every number comes from the engine or `method.ts`
- [ ] Lighthouse: performance and accessibility 90+
- [ ] Merged

### Prompt 3: Build the How it works and Services and pricing pages (#16)

```
Build two pages for [PRODUCT NAME] in the Keynote style (prototypes/ui/landing.html).
1. src/app/how-it-works/page.tsx: sections (a) "One engine. Three jobs." with an inline SVG energy-flow
   diagram: gas in -> engine -> electricity (--elec), recovered heat -> hot water and pool (--heat) ->
   absorption chiller -> chilled water (--cool); losses shown honestly (~81% total efficiency);
   (b) why Tunisian hotels (STEG time-of-use prices, summer peak, imported gas, footnoted);
   (c) who it fits: large, open all year, heated pool or spa, gas connection; who it does not;
   (d) how the tool decides (3 scenarios, ranges, verdict) -> /sources; (e) what a feasibility study adds
   (site visit, real bills, installer quote, because one quote moves the answer more than anything).
2. src/app/services/page.tsx: three offer cards: Feasibility study (paid, "price on request", deliverables
   list), Installer referral, Shared savings / ESCO ("coming soon" badge). Process timeline (screening ->
   study -> quote -> install). FAQ (shadcn Accordion). CTA -> /request-study.
Copy in messages/en/marketing.json, footnotes via <Footnote/>. Metadata for both.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch gaith/16-<short-name>, and open a PR with "Closes #16".
```

**Done when:**
- [ ] Both pages done at 360 and 1440 px, with an inline SVG diagram that works in both
- [ ] Prices say "on request", ESCO says "coming soon"
- [ ] All copy in `marketing.json`
- [ ] Merged

### Prompt 4: Build the Djerba case study and About pages (#17)

```
Build two pages for [PRODUCT NAME].
1. src/app/case-study/djerba/page.tsx from src/content/method.ts (Hamza) and docs/engine/spec.md:
   header (hotel photo placeholder, "300 rooms · Djerba · pool"), the demand story (render the hourly
   data with Ahmed's <HourlyChart/> if merged, else a static summary), "Why the plant got smaller"
   (winter load, 50% minimum load, full-load hours 2,400 vs 5,700), results as <RangeRail/>s, options
   (trigeneration vs CHP-only), "What moves the payback" (sensitivity), verdict and CTA. No typed numbers.
2. src/app/about/page.tsx: mission (screening honestly), team cards: Mohamed (lead, platform), Hamza
   (energy engine), Ahmed (sizing tool), Gaith (design and pages); initials avatars until photos arrive in
   public/team/. Contact link.
Copy in marketing.json. Metadata. 360 and 1440 px.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch gaith/17-<short-name>, and open a PR with "Closes #17".
```

**Done when:**
- [ ] Case study numbers come from `method.ts` only
- [ ] About shows the four members (photos or initials)
- [ ] Merged

### Prompt 5: Build the Sources and method and Privacy pages (#18)

```
Build two pages for [PRODUCT NAME].
1. src/app/sources/page.tsx from src/content/method.ts: "How we calculate" (numbered steps), Assumptions
   (table: parameter, unfavourable, central, favourable, unit, status badge, source link), "What moves the
   answer" (sensitivity table), "Limits" (not modelled yet), References (ordered list, each <li id=ref-ID>
   so <Footnote id/> links land). Sticky in-page table of contents on desktop.
2. src/app/privacy/page.tsx: controller ([PRODUCT NAME], contact email placeholder), data collected (email
   for sign-in; saved projects: hotel name and tool inputs/results; study requests: contact name, email,
   phone, hotel, message, consent; analytics: cookie-free, aggregated), purposes, legal basis (consent),
   retention (placeholder periods), processors (Supabase, Resend, Vercel), rights and how to use them
   (INPDP, Organic Law 2004-63), changes. A visible "Draft, pending legal review" note.
Copy in marketing.json (privacy may be long: a privacy namespace file is fine). Metadata.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch gaith/18-<short-name>, and open a PR with "Closes #18".
```

**Done when:**
- [ ] Every footnote id on the site resolves to an anchor on `/sources`
- [ ] Privacy page lists every data item collected by the forms
- [ ] Merged

### Prompt 6: Build the Request a study page and form (#20)

```
Build src/app/request-study/page.tsx and src/components/marketing/StudyRequestForm.tsx for [PRODUCT NAME].
- Left: what the feasibility study is (site visit, 12 months of bills, installer quote, report), price on
  request, timeline. Right (or below on mobile): the form.
- Fields: contactName, email, phone (optional), hotelName, city (select), rooms (number), pool (switch),
  elecPrice (optional), message (textarea), consent checkbox "I agree that [PRODUCT NAME] stores my details
  to answer this request" + link to /privacy, a hidden honeypot field "website".
- Prefill from search params with parseToolSearchParams from @/lib/engine/snapshot (or a local parser
  until Hamza merges) and show a small summary card (verdict, payback range) computed with sizeHotel.
- Submit with a server action calling submitStudyRequest from @/lib/db (react-hook-form + zod resolver,
  useActionState). Show fieldErrors inline, a pending state, and a success panel with next steps.
- Copy in messages/en/forms.json.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch gaith/20-<short-name>, and open a PR with "Closes #20".
```

**Done when:**
- [ ] Form works with keyboard, shows field errors and a success state
- [ ] Inputs prefill from `/tool` links
- [ ] Consent is required and links to Privacy
- [ ] Merged

### Prompt 7: Build the admin leads pipeline (#24)

```
Build the admin pipeline for [PRODUCT NAME]: src/app/admin/page.tsx (server) and
src/components/admin/pipeline/*. Reference: prototypes/ui/admin.html and screenshots admin-pipeline.png,
admin-mine.png, admin-mobile.png.
- Inside <AdminShell/>. Header "Study requests".
- KPI strip (getLeadCounts + listLeads): open leads, new in the last 7 days, won this quarter, win rate.
- Status tiles new / contacted / quoted / won / lost with counts and status colours; clicking filters.
- Filter bar: status, city, verdict, "Assigned to me" toggle; all in the URL search params.
- Lead cards grid: hotel name, city, rooms, verdict badge, central payback + range (@/lib/present), status
  pill, owner initials, "3 days ago". Link to /admin/leads/<id>. Empty state per filter.
- Staggered card entrance on filter change (Framer Motion, reduced-motion safe).
Strings in messages/en/admin.json.

When it works: run pnpm typecheck, pnpm lint and pnpm test, commit on branch gaith/24-<short-name>, and open a PR with "Closes #24".
```

**Done when:**
- [ ] Filters combine and live in the URL
- [ ] Matches the prototype at 1440 px and is usable at 768 px
- [ ] Only admins reach the page (middleware)
- [ ] Merged

## Rules

- Only edit files you own. If you need a change elsewhere, ask the owner (or comment on their issue).
- If a contract has to change, agree it with the other member involved, update the contract in **all four** role files and `README.md` in the same PR, and tell the team.
- Small PRs, one per issue. Mohamed reviews and merges; CI must be green.
- Write `[PRODUCT NAME]` literally, from `siteConfig.name` in code. Never invent a name.
