# End-to-end tests (Playwright)

Run against a production build (`pnpm build`, then `pnpm e2e` starts `pnpm start`).

| File | What it checks | Needs Supabase |
| --- | --- | --- |
| `pages.spec.ts` | Every public route: 200, one `h1`, no console errors, no serious or critical axe (WCAG 2.1 AA) violations. Desktop and Pixel 7. | No |
| `access.spec.ts` | Signed out: `/projects` redirects to sign-in, `/admin/**` is a 404, the sign-in form. Signed in: a hotel user gets 404 on `/admin`, an admin opens it, a bad link returns to sign-in. | Signed-in part |
| `auth.spec.ts` | Magic link end to end, read from the local inbox (Mailpit); a link works once; sign out. | Yes |
| `save-project.spec.ts` | Saving from `/tool`: signed in in one step; signed out through the magic link, saved once on return, with server-side results. | Yes |
| `projects.spec.ts` | My projects: empty state, card, rename, copy share link, delete, stale engine and Re-run; another user sees nothing; the share link signed out (results, no owner email, noindex, PDF link) and 404 for unknown links. | Yes |
| `pending.spec.ts` | `test.fixme` placeholders for the flows whose pages have not merged: tool verdict, PDF report, study request to admin pipeline, lead status and file upload. | Later |

## On local Supabase (what CI runs)

```sh
pnpm db:start                      # Docker; seeds the demo users, including the admin mohamed@team.example
pnpm exec tsx scripts/seed-storage.mts
# .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
pnpm build && pnpm e2e
```

`playwright.config.ts` reads `.env.local`, so the tests see the same variables as the build.
`NEXT_PUBLIC_SUPABASE_URL` is inlined at build time: rebuild after adding or removing it.

## On the in-memory fake

Leave the Supabase variables out, `pnpm build && pnpm e2e`. Tests that need a real sign-in skip themselves.

## Helpers (`e2e/support`)

- `signInAs(page, email, next)`: signs in without the inbox (a one-time token from the service role key, opened on `/auth/callback`). Use it to reach a role quickly. `SEEDED.admin` and `SEEDED.user` are seeded users.
- `magicLinkFromInbox(email)`: the link in the latest email to `email` in Mailpit. Use `freshEmail()` so runs never share an inbox.
- `seriousA11yViolations(page)`: axe results worth failing on.

## Turning a pending flow into a test

When the page for a `pending.spec.ts` entry merges, replace its `test.fixme` with the real test (the comment lists the steps), in its own spec file if it grows. Retries are 0: a test that needs one is a bug.
