# [PRODUCT NAME]

Trigeneration (CCHP) sizing and feasibility studies for Tunisian hotels. Next.js + Supabase web app.

- Decisions and glossary: [CONTEXT.md](CONTEXT.md)
- Architecture decisions: [docs/adr/](docs/adr/)
- Team plan, roles and tickets: [docs/team/](docs/team/)
- Admin design references: [docs/design/admin-references/](docs/design/admin-references/)

## Run it

Node 22 and pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000, all 14 pages
pnpm typecheck      # next typegen + tsc --noEmit
pnpm lint
pnpm test           # Vitest (src/**/*.test.ts)
pnpm build && pnpm e2e   # Playwright smoke test of every route against `pnpm start`
pnpm test:engine-reference   # the v2 reference model in engine/
```

## CI

`.github/workflows/ci.yml` runs on every pull request and on pushes to the default branch, with no secrets:

- **Typecheck, lint, unit tests**: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:engine-reference`.
- **Build and Playwright**: `pnpm build`, then the smoke test against `pnpm start` on the in-memory fake. On failure the HTML report is uploaded as the `playwright-report` artifact.
- **Database tests**: starts local Supabase in the runner, uploads the demo files, then `pnpm test:db`.

## Local database (Supabase)

Needs Docker. The site runs without it (on the fake), so this is only for work on data, auth or admin.

```bash
pnpm db:start       # local Supabase (first run downloads the images)
pnpm db:reset       # rebuild schema + seed from supabase/ and upload the demo lead files
pnpm test:db        # Contract 3 suite + row-level security tests against local Supabase
cp .env.example .env.local   # then paste the keys from `pnpm exec supabase status`
```

- Schema, RLS policies, triggers and the private `lead-files` bucket: `supabase/migrations/`. After a change, run `pnpm db:reset` and `pnpm db:types` (regenerates `src/lib/supabase/types.ts`).
- Demo data has one source, `src/lib/db/fake/seed.ts`. `pnpm db:seed` renders it into `supabase/seed.sql`; `pnpm test` fails while that file is stale (for example after an engine change).
- Seeded users: the four admins (`mohamed@team.example`, `hamza@`, `ahmed@`, `gaith@`) and two hotel users (`a@hotel.example`, `b@hotel.example`). Sign-in arrives with #7; local emails go to Mailpit at http://127.0.0.1:54324.

## What is real and what is fake (scaffold, #3)

- **Pages**: every route in `src/config/routes.ts` is a stub showing its title and owner. Owners replace their `page.tsx`.
- **Engine** (`@/lib/engine`, Contract 1): `sizeHotel()` is a **fake** (`src/lib/engine/fake.ts`) that ignores its input and returns the frozen Djerba demo, a snapshot of `engine/model.mjs`. `ENGINE_VERSION` is `0.0.0-fake`. Hamza's port (#5) replaces it.
- **Formatting** (`@/lib/present`): simple `formatTnd`, `formatRange`, `verdictTone`, `warningText`. Hamza's #12 replaces them.
- **Data** (`@/lib/db`, Contract 3): real since #6. With the Supabase variables set (see below), every function talks to Supabase under row-level security. Without them it falls back to an **in-memory fake** with the same rules and the same demo data, so you can build pages with no database: signed-out users and non-admins get empty reads, and writes they are not allowed to make throw. On the fake you are signed in as the demo admin (Mohamed) in development and signed out in production builds (set `FAKE_DB_USER=admin`, `user` or `none` to choose); its data resets when the dev server restarts. `/p/demo-djerba` is a seeded shared project in both.
- **Strings**: every user-facing string goes in `messages/en/<namespace>.json` (next-intl, no locale routing). ESLint warns on text literals in JSX.
- **Product name**: read `siteConfig.name` from `src/config/site.ts`; never hard-code it.
- **shadcn/ui**: `components.json` and `cn()` in `src/lib/utils.ts` are ready; add components with `pnpm dlx shadcn@latest add <name>`.
