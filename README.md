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
- Seeded users: the four admins (`mohamed@team.example`, `hamza@`, `ahmed@`, `gaith@`) and two hotel users (`a@hotel.example`, `b@hotel.example`). Sign in as any of them with a magic link: local emails go to Mailpit at http://127.0.0.1:54324.

## Sign-in (#7)

- **Pages**: `/sign-in` (email magic link and "Continue with Google", accepts `?next=/some/path`), `/auth/callback` (exchanges the code, then redirects to `next`; only same-origin paths, see `src/lib/auth/paths.ts`). Sign out with `<SignOutButton/>` from `src/components/auth/sign-out-button.tsx`, or call `signOut` from `src/lib/auth/actions.ts`.
- **Protection** (`src/proxy.ts`, Next 16's name for middleware): refreshes the Supabase session on every request; `/projects` redirects signed-out visitors to `/sign-in?next=...`; `/admin/**` answers 404 to everyone but admins. `src/app/projects/layout.tsx` and `src/app/admin/layout.tsx` repeat the checks as a backstop. To protect a new path, add it to `accessFor` in `src/lib/auth/paths.ts`.
- **Save before sign-in** (#21): send people to `signInPath('/tool?...')` and they come back to that URL once signed in.
- **On the fake** (no Supabase) there is nothing to sign in to: the form says sign-in is unavailable and `FAKE_DB_USER` decides who is signed in. Sign out still works (until the server restarts).
- **Making someone an admin**: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');` in the SQL editor.

### Google OAuth

1. Google Cloud console, APIs & Services: configure the OAuth consent screen (External, app name `[PRODUCT NAME]`, scopes `email`, `profile`, `openid`).
2. Credentials, Create credentials, OAuth client ID, type **Web application**. Authorised redirect URIs (Google redirects to Supabase, not to the site):
   - local: `http://127.0.0.1:54321/auth/v1/callback`
   - cloud: `https://<project-ref>.supabase.co/auth/v1/callback`
3. **Local**: put the client ID and secret in `supabase/.env` (git-ignored) as `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`, then `pnpm db:start` again.
4. **Cloud**: Supabase dashboard, Authentication, Sign In / Providers, Google: enable, paste the client ID and secret.

### Redirect URLs (Supabase dashboard, Authentication, URL Configuration)

Supabase only sends people back to URLs on this list, for magic links and Google alike.

- **Site URL**: the production URL, e.g. `https://<your-domain>`.
- **Redirect URLs**: `https://<your-domain>/**`, `https://*-<vercel-team-slug>.vercel.app/**` (every Vercel preview), and `http://localhost:3000/**`. Locally the same list is `additional_redirect_urls` in `supabase/config.toml`.

### Auth emails through Resend (production)

Supabase's built-in mailer is limited to a few emails an hour and is for testing only. In the Supabase dashboard, Authentication, Emails, SMTP Settings, enable custom SMTP:

- Host `smtp.resend.com`, port `465`, username `resend`, password: a Resend API key (can be the same as `RESEND_API_KEY`).
- Sender email: an address on the domain verified in Resend (same as `EMAIL_FROM`), sender name `[PRODUCT NAME]`.
- Then raise Authentication, Rate Limits, "emails sent per hour" (for example to 30).

## What is real and what is fake (scaffold, #3)

- **Pages**: every route in `src/config/routes.ts` is a stub showing its title and owner. Owners replace their `page.tsx`.
- **Engine** (`@/lib/engine`, Contract 1): `sizeHotel()` is a **fake** (`src/lib/engine/fake.ts`) that ignores its input and returns the frozen Djerba demo, a snapshot of `engine/model.mjs`. `ENGINE_VERSION` is `0.0.0-fake`. Hamza's port (#5) replaces it.
- **Formatting** (`@/lib/present`): simple `formatTnd`, `formatRange`, `verdictTone`, `warningText`. Hamza's #12 replaces them.
- **Data** (`@/lib/db`, Contract 3): real since #6. With the Supabase variables set (see below), every function talks to Supabase under row-level security. Without them it falls back to an **in-memory fake** with the same rules and the same demo data, so you can build pages with no database: signed-out users and non-admins get empty reads, and writes they are not allowed to make throw. On the fake you are signed in as the demo admin (Mohamed) in development and signed out in production builds (set `FAKE_DB_USER=admin`, `user` or `none` to choose); its data resets when the dev server restarts. `/p/demo-djerba` is a seeded shared project in both.
- **Strings**: every user-facing string goes in `messages/en/<namespace>.json` (next-intl, no locale routing). ESLint warns on text literals in JSX.
- **Product name**: read `siteConfig.name` from `src/config/site.ts`; never hard-code it.
- **shadcn/ui**: `components.json` and `cn()` in `src/lib/utils.ts` are ready; add components with `pnpm dlx shadcn@latest add <name>`.
