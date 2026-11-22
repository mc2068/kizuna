# Team plan: building the [PRODUCT NAME] website

Scope: the complete Next.js + Supabase website (14 pages). The pitch and the video come later and reuse the site. Every decision behind this plan is in [`CONTEXT.md`](../../CONTEXT.md) and [`docs/adr/`](../adr/). **Deadline: not set yet**, so the plan gives an order, not dates.

## The four roles

| Role | Member | Guide |
|---|---|---|
| Role 4: Platform, integration & QA | Mohamed (`@mc2068`) | [role-4-platform-integration-qa.md](role-4-platform-integration-qa.md) |
| Role 1: Energy engine & reports | Hamza (`@Boomerang128`) | [role-1-energy-engine.md](role-1-energy-engine.md) |
| Role 2: Tool & projects | Ahmed (`@Ahmedbenslama`) | [role-2-tool-projects.md](role-2-tool-projects.md) |
| Role 3: Pages & design | Gaith (`@GHAYTH-LAB`) | [role-3-pages-design.md](role-3-pages-design.md) |

Each task is a **GitHub issue**, titled with the member's name (e.g. `[Hamza] ...`), assigned to them, and labelled with their name and role. Filter by label: `mohamed`, `hamza`, `ahmed`, `gaith`.

> Hamza (`@Boomerang128`) and Ahmed (`@Ahmedbenslama`) are not collaborators on this repo yet, so GitHub cannot assign their issues. Mohamed invites them (Settings → Collaborators, write access); once they accept, their issues get assigned.

## Issues by member

| Member | Issues, in order |
|---|---|
| Mohamed | #3 → #6 → #7 → #8 → #19 → #26 → #28 |
| Hamza | #5 → #12 → #13 → #14 → #23 |
| Ahmed | #9 → #10 → #11 → #21 → #22 → #25 → #27 |
| Gaith | #4 → #15 → #16 → #17 → #18 → #20 → #24 |

## All issues and what blocks them

| # | Member | Issue | Blocked by |
|---|---|---|---|
| #3 | Mohamed | Scaffold the Next.js app with page stubs, fake engine and fake data layer | – |
| #4 | Gaith | Build the design system, layout, header and footer | #3 |
| #5 | Hamza | Port the sizing engine to TypeScript with Vitest | #3 |
| #6 | Mohamed | Create the Supabase schema, row-level security, roles and Storage | #3 |
| #7 | Mohamed | Add sign-in with magic link and Google, and protect the signed-in pages | #6, #4 |
| #8 | Mohamed | Set up CI, Vercel preview deploys and the Supabase cloud project | #3 |
| #9 | Ahmed | Build the sizing tool configurator with live results | #3, #4 |
| #10 | Ahmed | Show tool results as ranges with verdict, options and assumptions | #9 |
| #11 | Ahmed | Add the hourly dashboard (summer and winter day) | #9 |
| #12 | Hamza | Write the presentation helpers for ranges, verdicts and warnings | #5 |
| #13 | Hamza | Run the engine on the server and snapshot results for saved projects and leads | #5, #6 |
| #14 | Hamza | Freeze the demo numbers and write the method content | #5 |
| #15 | Gaith | Build the Home page | #4 |
| #16 | Gaith | Build the How it works and Services and pricing pages | #4 |
| #17 | Gaith | Build the Djerba case study and About pages | #4, #14 |
| #18 | Gaith | Build the Sources and method and Privacy pages | #4, #14 |
| #19 | Mohamed | Save study requests and send emails with Resend | #6, #13 |
| #20 | Gaith | Build the Request a study page and form | #4 |
| #21 | Ahmed | Save a project, including before sign-in | #10, #7, #13 |
| #22 | Ahmed | Build My projects and the shared project page | #21 |
| #23 | Hamza | Generate the downloadable PDF report | #12, #13 |
| #24 | Gaith | Build the admin leads pipeline | #4, #6 |
| #25 | Ahmed | Build the admin lead detail page with Overview, Notes, History and Files | #24, #19 |
| #26 | Mohamed | Write Playwright tests for the key flows | #8, #7, #15, #16, #17, #18, #20, #21, #22, #23, #24, #25 |
| #27 | Ahmed | Switch the tool to the real engine and polish it | #5, #12, #10, #11 |
| #28 | Mohamed | Run the integration pass and launch | #26, #27 |

## How it fits together

```
Mohamed #3 scaffold: 14 page stubs + fake engine + fake db ─┬─► everyone starts on day 1
Gaith #4 design system, header, footer ─────────────────────┤
                                                            ▼
Hamza #5 TS engine ─► #12 helpers, #13 server snapshot, #14 method content
        │                    │              │                 └─► Gaith #17 case study, #18 sources
        └──────► Ahmed #9 tool ─► #10 results, #11 chart ─► #27 real engine + polish
Mohamed #6 schema + RLS ─► #7 sign-in ─► Ahmed #21 save ─► #22 my projects + share ─► (Hamza #23 PDF)
                       └─► #19 study requests + Resend ─► Ahmed #25 lead detail
Gaith #20 request form (on the fake), #24 pipeline ─────────────────────► Ahmed #25
Everything ─► Mohamed #26 Playwright ─► #28 integration pass and launch
```

Three contracts let everyone start on day 1 without waiting. They are written out in full in every role file's "Start here" block:

- **Contract 1, engine** (Hamza): `sizeHotel(input)` in `src/lib/engine` returns the headline plant, verdict, warnings, three scenarios, both options, hourly summer and winter rows and the assumptions. `src/lib/present` formats everything.
- **Contract 2, design tokens** (Gaith): CSS variables + Tailwind theme, shadcn components, `SiteHeader`, `SiteFooter`, `AdminShell`, `Rings`, `RangeRail`.
- **Contract 3, data** (Mohamed): Supabase tables, RLS and the typed functions in `src/lib/db`. Results are always computed on the server and stored with the engine version.

If a contract has to change, the members involved agree on it and update it in all four role files.

## Day-1 order

1. **Mohamed #3:** scaffold with all 14 page stubs, fake engine and in-memory data layer (first hours).
2. **Gaith #4:** design system and layout (first day; open the PR early).
3. **Hamza #5** (engine port) and **Ahmed #9** (tool on the fake engine) start in parallel; Mohamed moves to #6 schema and #8 CI.

## Rules

- One branch per issue: `<member>/<issue>-<short-name>` (e.g. `ahmed/9-tool-configurator`), PR to the default branch with `Closes #N`. Mohamed reviews and merges.
- Only edit files you own (listed in your role file). Ask the owner for anything else.
- CI must be green before a merge.
- The product name stays `[PRODUCT NAME]`, read from `siteConfig.name`, until the team decides.

## Frozen numbers

Engine v2, demo hotel **300 rooms, Djerba, pool, STEG time-of-use prices before VAT**. Read as favourable / central / unfavourable. Every page, the tool and the PDF must match these. Hamza's #14 adds a test that pins them; if the engine changes, Hamza updates this table and tells the team.

| Result | Trigeneration (headline) | CHP only (hot water and pool) |
|---|---|---|
| Plant | **200 kWe + 64 kWc** | 100 kWe, no chiller |
| Capex | 1.2 / 1.75 / 2.4 M TND | 0.6 / 0.85 / 1.1 M TND |
| Savings | 260k / 200k / 110k TND/yr | 135k / 110k / 70k TND/yr |
| Payback | **5 / 9 / 21.5 years** | 4.5 / 7.5 / 15.5 years |
| With FTE (eligibility unconfirmed) | 3.5 / 6 / 15 years | 3 / 5.5 / 11 years |
| CO2 avoided | 260 / 210 / 70 t/yr | 150 / 130 / 60 t/yr |
| Full-load hours | 6,100 / 5,700 / 4,900 | 6,600 / 6,600 / 6,500 |
| Peak grid relief | about 220 kW | |
| Verdict | possible fit, needs a study | |

Source: [`docs/engine/spec.md`](../engine/spec.md).

## Using the prompts

Every role file starts with a **"Start here" block** holding the full context, the three contracts and the file owners. Paste it into your own Claude (ideally Claude Code in your clone of the repo), then use the numbered prompts one at a time. Each prompt is one GitHub issue.
