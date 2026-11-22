# Context: [PRODUCT NAME] website (Next.js + Supabase)

Living record of decisions from the website grilling (22 Nov 2026). Scope: the website only. The pitch and the video come later and reuse the site. Update as decisions change.

## What we are
A Tunisian startup that sizes and sells trigeneration (CCHP) plants for hotels. The website is the company's real product site: it explains the offer, runs the free sizing tool, saves hotel projects, and turns visitors into feasibility-study leads.

## Carried over from the hackathon repo (mc2068/kizuna-trigeneration)
- Customer: Tunisian coastal hotels. Factories (e.g. Pâtes Warda) appear only as proof that trigeneration works in Tunisia.
- Sizing tool inputs: rooms, city (Djerba, Sousse, Hammamet, Tozeur), pool yes/no, electricity price.
- Sizing tool outputs: engine kW, chiller kW, annual savings (TND), CO2 avoided (t/yr), payback with and without the FTE subsidy, kW removed from the grid at the summer peak, plus the hourly dashboard (summer and winter days).
- Demo hotel: 300-room, 4-star beach hotel in Djerba with a pool.
- Numbers are estimates with visible, cited assumptions.
- Name: placeholder `[PRODUCT NAME]` until the team decides; kept in one place so it is swapped once.
- Team: Mohamed (lead, integration, auth, database, deploys), Hamza (energy engine), Ahmed (tool and dashboard), Gaith (pages and design).

## Decisions
- **Stack**: Next.js (App Router, TypeScript), Supabase (Postgres, Auth, row-level security), Tailwind CSS + shadcn/ui. Framer Motion added later for animations.
- **Design**: prototype A "Keynote" from PR #27 of the old repo: Apple-inspired, huge type, one idea per screen, store-style configurator with a sticky summary, three rings (electricity, hot water, cooling) as the hero object, footnoted claims. Animations and UX polish come in a later pass.
- **Language**: English at launch, built with i18n so French can be added later.
- **Pages (public)**: Home, How it works, Sizing tool, Services and pricing, Djerba case study, About (team), Sources and method, Request a study, Privacy.
- **Pages (signed in)**: My projects, Admin (admins only).
- **Services**: paid feasibility study and installer referral now; shared-savings (ESCO) offer shown as "coming soon". Prices "on request".
- **Sign-in**: email magic link and Google OAuth. The tool works without signing in.
- **Roles**: `user` and `admin` (team members). Row-level security: users see only their own projects and requests.
- **Saved project**: a hotel name plus tool inputs and results. Share link (read-only, anyone with the link) and downloadable PDF report. Side-by-side compare comes later.
- **Save before sign-in**: the unsaved result is kept, the visitor signs in with a magic link, and the project saves automatically on return.
- **Request a study**: saved to Supabase; email to the team and a confirmation to the hotel (Resend); Admin shows a pipeline: new, contacted, quoted, won, lost.
- **Engine**: the old `engine.js` ported to a pure TypeScript module with no I/O. It runs in the browser for instant results and on the server for saved projects and PDFs. Assumptions and constants stay in code, versioned and tested, not in the database.
- **Email and PDF**: Resend for transactional email (Supabase built-in email is for testing only); PDFs generated on the server with react-pdf.
- **Hosting**: Vercel (preview deploy per PR) + one Supabase cloud project for production; local Supabase via the CLI for development. Free tiers.
- **Quality gate**: Vitest for the engine (old tests carried over), Playwright for key flows (run tool, save project, request study), GitHub Actions on every PR.
- **Admin design references**: main reference is Ramotion's Carbon Solutions B2B dashboard (https://dribbble.com/shots/25506638) for the lead detail page (photo header, status pill, tabs). Borrow Integrate's status count tiles and filterable card list (https://dribbble.com/shots/25284960) for the pipeline. Fallback for a lighter look: Stratify (https://dribbble.com/shots/26281371). Screenshots in `docs/design/admin-references/`.
- **Admin home**: the lead pipeline. A small KPI strip, then status count tiles (new, contacted, quoted, won, lost), then lead cards filterable by status, city, and "assigned to me".
- **Lead page**: header with hotel name, city and status pill; tabs: Overview (sizing results), Notes, History (status changes, emails sent), Files (quotes and documents uploaded to a private Supabase Storage bucket, admins only).
- **Lead ownership**: every lead has one owner from the team; any admin can reassign.
- **Privacy and analytics**: privacy page, consent checkbox on forms, cookie-free Vercel Analytics. Tunisian data protection law (INPDP) applies.

## Open
- Website deadline.
- New repo name.

## Glossary
- **Trigeneration (CCHP)**: one gas engine on site producing electricity, hot water, and (via an absorption chiller) chilled water for air conditioning.
- **Absorption chiller**: machine that turns heat into cold water.
- **Sizing tool**: the page that takes a hotel's details and returns plant size, savings, CO2 and payback.
- **Hourly dashboard**: the chart of the hotel's hourly electricity, heat and cooling demand against what the plant supplies.
- **Project**: a saved sizing run for one hotel, owned by one user.
- **Study request (lead)**: a hotel asking for a paid feasibility study; moves through the Admin pipeline.
- **FTE**: Tunisia's Energy Transition Fund subsidy, used for the "with subsidy" payback.
