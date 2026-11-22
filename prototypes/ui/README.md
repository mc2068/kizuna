# UI prototypes: landing page and admin dashboard

Throwaway, static HTML/CSS/JS to agree on the look and the flows before building them in Next.js. Not part of the app.

- `landing.html`: Home page in the "Keynote" direction (ADR 0003). Three rings for electricity, hot water and cooling coverage, the Djerba demo as ranges, a live screening widget, "what moves the answer", services, proof, request a study.
- `admin.html`: Admin lead pipeline (ADR 0004). KPI strip, Integrate-style status tiles, filterable lead cards (status, city, verdict, owner, "assigned to me"), and a lead page after Ramotion's Carbon Solutions dashboard: photo-style header, status pill, owner, tabs Overview, Notes, History, Files.
- `admin-data.js`: 17 invented hotels and contacts. Status changes, owner changes, notes and uploads work in memory only.
- `engine.mjs`: re-exports `engine/model.mjs`, so every number on both pages comes from the real v2 engine (Djerba demo: 200 kWe + 64 kWc, payback 5 / 9 / 21.5 years). Results are shown as favourable / central / unfavourable ranges.

## Run

ES modules need a server:

```sh
python3 -m http.server 8765        # from the repo root
open http://localhost:8765/prototypes/ui/
```

Screenshots: `node prototypes/ui/screenshot.cjs` (needs Playwright; writes to `screenshots/`).
Walkthrough video: `node prototypes/ui/record.cjs` (webm). `REDUCE=1 node prototypes/ui/record.cjs` runs the same flow with reduced motion and reports page errors.

## Motion

- Landing: staged hero entrance, rings draw and their percentages count up, scroll reveals (only for content that starts below the fold, so the page is complete at rest), range rails grow out from the central case, the tornado bars grow from the 9-year axis, the live tool glides its rails and tweens its numbers instead of re-rendering, the nav firms up and tracks the section in view.
- Admin: page transition on route change, sliding tab indicator with a panel fade, staggered card entrance on every filter change, KPI and tile count-ups on first load, highlighted new history rows and notes, popping status pill, rails and rings animate on the lead overview, swaying palms and drifting sea glints in the header, drag-and-drop upload with a real file picker.
- Everything collapses to instant under `prefers-reduced-motion: reduce`.

## Decisions to carry into the real build

- The hero sells the screening, not the plant: "Make your own energy. Only if it pays." The old "The air stays on. Even at 49°" headline promised blackout cover, which the engine does not model (no island mode).
- The rings are honest: for the Djerba demo, cooling coverage is about 3%. The value is year-round hot water and pool heat.
- Every money and CO2 figure is a range with the central case marked; the FTE payback is labelled "eligibility unconfirmed" and never used as the headline.
- Admin lead cards show the screening verdict and payback range, so the team can triage weak fits fast.
