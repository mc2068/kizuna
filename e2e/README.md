# End-to-end tests (Playwright)

Run against a production build (`pnpm build`, then `pnpm e2e` starts `pnpm start`).

| File | What it checks | Needs Supabase |
| --- | --- | --- |
| `pages.spec.ts` | Every public route: 200, one `h1`, no console errors, no serious or critical axe (WCAG 2.1 AA) violations. Desktop and Pixel 7. | No |
| `access.spec.ts` | Signed out: `/projects` redirects to sign-in, `/admin/**` is a 404, the sign-in form. Signed in: a hotel user gets 404 on `/admin`, an admin opens it, a bad link returns to sign-in. | Signed-in part |
| `auth.spec.ts` | Magic link end to end, read from the local inbox (Mailpit); a link works once; sign out. | Yes |
| `save-project.spec.ts` | Saving from `/tool`: signed in in one step; signed out through the magic link, saved once on return, with server-side results. | Yes |
| `projects.spec.ts` | My projects: empty state, card, rename, copy share link, delete, stale engine and Re-run; another user sees nothing; the share link signed out (results, no owner email, noindex, PDF link) and 404 for unknown links. | Yes |
| `tool.spec.ts` | The demo hotel's verdict; Tozeur at 100 rooms turns it weak with no submit; the URL restores it; "Request a study" carries the inputs. | No |
| `tool-chart.spec.ts` | The hourly chart, loaded only near the viewport (#27), appears on scroll and works, with no console errors. | No |
| `study-request.spec.ts` | A hotel submits a study request; an admin finds it as "new" in `/admin`, moves it to "contacted" (History), uploads a PDF and downloads it. Its leads are deleted afterwards. | Yes |
| `pdf-report.spec.ts` | The owner downloads the PDF from My projects, the share link downloads it signed out, everyone else gets a 404. | Yes |

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

## Against the deployed site (`e2e/deployed`)

`pnpm e2e:deployed` runs the integration specs against production (https://kizuna-ruddy.vercel.app), with its own config (`playwright.deployed.config.ts`) and no local server. Point it at a Vercel preview with `DEPLOYED_URL=https://<preview>.vercel.app pnpm e2e:deployed`. The main `pnpm e2e` ignores this folder.

Every spec is read-only, so it is safe to run against production at any time: nothing signs in, sends an email, saves a project or submits a lead.

| File | What it checks |
| --- | --- |
| `pages.spec.ts` | Every public route over HTTPS: 200, one `h1`, a title, no console errors, no serious or critical axe violations. Desktop and Pixel 7. `/p/demo-djerba` is left out (seeded only locally). |
| `links.spec.ts` | Every same-site link on the public pages answers below 400; an unknown page is a 404 with the not-found page. |
| `access.spec.ts` | Signed out: `/projects` redirects to sign-in, `/admin/**` is a 404, the sign-in form, off-site `?next=`, a bad email, a bad callback token. |
| `share.spec.ts` | Unknown share links and their PDF are 404; a project PDF signed out is a 404. |
| `tool.spec.ts` | `/tool` defaults give the Djerba verdict; Tozeur and 100 rooms update the result and URL with no submit; reload restores them; the hourly chart loads on scroll. |
| `frozen-numbers.spec.ts` | The frozen Djerba numbers (docs/team/README.md) on `/`, `/tool`, `/case-study/djerba` and the prefilled `/request-study`; the verdict thresholds on `/sources`. |
| `platform.spec.ts` | HTTP redirects to HTTPS with HSTS; a signed-out visit sets no cookies; the study form needs consent and links the privacy notice (submitted empty only). |

What it does not cover, because it would write to production: the real email round trip, saving and sharing a project, the PDF of a real project, a study request reaching the admin pipeline. Run those by hand on production for #28, or with `pnpm e2e` on local Supabase.

## Helpers (`e2e/support`)

- `signInAs(page, email, next)`: signs in without the inbox (a one-time token from the service role key, opened on `/auth/callback`). Use it to reach a role quickly. `SEEDED.admin` and `SEEDED.user` are seeded users.
- `magicLinkFromInbox(email)`: the link in the latest email to `email` in Mailpit. Use `freshEmail()` so runs never share an inbox.
- `seriousA11yViolations(page)`: axe results worth failing on.

## Flakiness

Retries are 0: a test that needs one is a bug.
