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

## What is real and what is fake (scaffold, #3)

- **Pages**: every route in `src/config/routes.ts` is a stub showing its title and owner. Owners replace their `page.tsx`.
- **Engine** (`@/lib/engine`, Contract 1): `sizeHotel()` is a **fake** (`src/lib/engine/fake.ts`) that ignores its input and returns the frozen Djerba demo, a snapshot of `engine/model.mjs`. `ENGINE_VERSION` is `0.0.0-fake`. Hamza's port (#5) replaces it.
- **Formatting** (`@/lib/present`): simple `formatTnd`, `formatRange`, `verdictTone`, `warningText`. Hamza's #12 replaces them.
- **Data** (`@/lib/db`, Contract 3): every function exists as an **in-memory fake** with 17 seeded demo leads (from the admin prototype). It acts like the RLS policies: signed-out users and non-admins get empty reads, and writes they are not allowed to make throw. In development you are signed in as the demo admin (Mohamed); production builds start signed out (set `FAKE_DB_USER=admin`, `user` or `none` to choose). `/p/demo-djerba` is a seeded shared project. Data resets when the dev server restarts. #6 swaps the bodies for Supabase with the same signatures.
- **Strings**: every user-facing string goes in `messages/en/<namespace>.json` (next-intl, no locale routing). ESLint warns on text literals in JSX.
- **Product name**: read `siteConfig.name` from `src/config/site.ts`; never hard-code it.
- **shadcn/ui**: `components.json` and `cn()` in `src/lib/utils.ts` are ready; add components with `pnpm dlx shadcn@latest add <name>`.
