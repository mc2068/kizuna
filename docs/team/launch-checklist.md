# Launch checklist (#28)

Integration pass run on 22 November 2026 against the production deployment, https://kizuna-ruddy.vercel.app.
Ticked items were checked on the live site or in the repo. Unticked items are dashboard steps for an owner of
the Vercel, Supabase, Resend or Google accounts (Mohamed), or a team decision.

## Pages and flows on production

- [x] All 11 public pages answer 200: `/`, `/tool`, `/case-study/djerba`, `/sources`, `/how-it-works`, `/services`, `/about`, `/request-study`, `/privacy`, `/twin`, `/sign-in`.
- [x] `/projects` redirects signed-out visitors to sign-in; `/admin` is a 404 for them; unknown paths and unknown share tokens are a 404.
- [x] Production runs on Supabase cloud, not the in-memory fake (the sign-in form is live). The fake is kept on purpose for previews, e2e and local work, and a production build refuses to start on it without `ALLOW_FAKE_DB=1` (`src/lib/db/store.ts`).
- [x] `/robots.txt` and `/sitemap.xml` exist (added in this pass; they were 404s).
- [x] Absolute URLs (metadata, sitemap, links in emails) fall back to the Vercel production URL when `NEXT_PUBLIC_SITE_URL` is unset, instead of `http://localhost:3000` (fixed in this pass).
- [x] "Continue with Google" is hidden while the Supabase project has Google off. Before this pass it sent visitors to Supabase's raw `Unsupported provider: provider is not enabled` error.
- [ ] Real email end to end: submit one study request on production with your own address and check both emails arrive (team notification and hotel confirmation) and the lead's History says "sent". Needs the Resend steps below.
- [ ] Magic link sign-in on production with a real inbox, then save a project and download its PDF.
- [ ] `/twin` is still a placeholder. Decide: launch with it, or take the nav link down until it is built.

## Frozen Djerba numbers

Checked against the table in [README.md](README.md#frozen-numbers) on Home, Tool, Case study and Sources (live text) and the PDF (pinned in `src/lib/report/model.test.ts`).

- [x] Plant 200 kWe + 64 kWc; CHP only 100 kWe, no chiller.
- [x] Payback 5 / 9 / 21.5 years; CHP only 4.5 / 7.5 / 15.5. With FTE 3.5 / 6 / 15 and 3 / 5.5 / 11.
- [x] Capex 1.24 / 1.75 / 2.36 M TND; CHP only 0.61 / 0.85 / 1.1 M TND.
- [x] Savings 260k / 200k / 110k TND a year; CHP only 135k / 110k / 70k.
- [x] CO2 260 / 210 / 70 t a year; CHP only 150 / 130 / 60.
- [x] Full-load hours 6,100 / 5,700 / 4,900; CHP only 6,600 / 6,600 / 6,500. Peak grid relief about 220 kW. Verdict "possible fit, needs a study".
- Note: the "what moves the answer" sections (Home, Case study, Sources) quote the unrounded central payback, 8.9 years, as the baseline of the sensitivity chart. Same number, one more decimal; left as is.

## Privacy and consent

- [x] Request a study: consent checkbox required on the server (`z.literal(true)`) with a link to `/privacy`.
- [x] Sign-in: consent line with a link to `/privacy`.
- [x] Analytics: Vercel Web Analytics only, cookie-free (no cookies set on the home page).
- [x] Storage bucket `lead-files` is private (migration `20261122000001_schema.sql`); files are served through signed URLs to admins.
- [x] Row-level security is covered by `pnpm test:db` in CI against local Supabase. Not re-run against the cloud project (needs its keys).

## Dashboard steps (owner: Mohamed)

### Vercel (Settings, Environment Variables)

- [ ] Production: `RESEND_API_KEY`, `EMAIL_FROM` (`[PRODUCT NAME] <hello@your-domain>`, a Resend-verified domain), `TEAM_NOTIFY_EMAIL` (comma-separated). Redeploy after adding them. Until then study requests are saved but emails are logged as "skipped".
- [ ] Preview: `ALLOW_FAKE_DB=1`, or every PR preview fails to render (previews have no database).
- [ ] Analytics tab: enable Web Analytics.
- [ ] Custom domain, if any: add it, then set `NEXT_PUBLIC_SITE_URL` to it.

### Resend

- [ ] Add and verify the sending domain (SPF and DKIM DNS records), then create the API key above.

### Supabase (project `kizuna`, Frankfurt)

- [ ] Authentication, URL Configuration: Site URL `https://kizuna-ruddy.vercel.app` (or the custom domain); Redirect URLs `https://kizuna-ruddy.vercel.app/**`, `https://*-<vercel-team-slug>.vercel.app/**`, `http://localhost:3000/**`. Without them magic links return to the wrong place.
- [ ] Optional: Authentication, Providers, Google: enable with the Google client ID and secret (README, "Google OAuth"). The button appears by itself within five minutes of enabling it.
- [ ] Admin accounts: sign in once with each team email, then `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');`.
- [ ] Backups: daily backups come with the plan; check Database, Backups shows them. Point-in-time recovery is a paid add-on, not needed for launch.
- [ ] Auth emails: the built-in Supabase mailer is rate-limited (a few emails an hour). For launch traffic, set Authentication, SMTP to Resend.

### Google Cloud (only if Google sign-in is wanted)

- [ ] OAuth consent screen (External, app name `[PRODUCT NAME]`, scopes email, profile, openid), then a Web client with redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.

### GitHub

- [ ] Branch protection on the default branch: require the three CI checks (Typecheck, lint, unit tests; Build and Playwright; Database tests).

## Running the site

- [ ] Error monitoring: Vercel's runtime logs for now (Project, Logs). No paging; decide if Sentry is needed after launch.
- [ ] On call during the launch: Mohamed for platform, data and email; Ahmed for the tool and projects; Gaith for pages; Hamza for the engine and the PDF.
- [ ] Product name: still `[PRODUCT NAME]`. When the team picks one, change `siteConfig.name` in `src/config/site.ts` once.
- [ ] Team sign-off, then close #28.
