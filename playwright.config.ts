import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);

// The tests read the same Supabase variables as the build: CI exports them from `supabase status`;
// locally they come from .env.local when it exists (process env wins).
try {
  process.loadEnvFile('.env.local');
} catch {}
const onSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const adminPort = port + 1;
const role3URL = `http://localhost:${onSupabase ? port : adminPort}`;
const ROLE3 = /role3-.*\.spec\.ts$/;

// Two ways to run (e2e/README.md):
// - On local Supabase (CI): `pnpm build` and `pnpm e2e` with the Supabase variables set. Every test runs.
// - On the in-memory fake: no Supabase variables. The tests that need a real sign-in are skipped.
// NEXT_PUBLIC_SUPABASE_URL is inlined at build time, so build and test with the same variables.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'off' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: ROLE3 },
    // Public pages at phone size (layout and axe checks); the flows run on desktop only.
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: 'pages.spec.ts' },
    // Role 3 (Gaith): the design and page specs, at 1440 and 360 px. On the fake they run against a
    // second server signed in as the demo admin, so the admin pipeline can be tested; on Supabase
    // they sign in with signInAs where they need the admin (e2e/role3-pages.ts).
    { name: 'role3-desktop', use: { ...devices['Desktop Chrome'], baseURL: role3URL }, testMatch: ROLE3 },
    {
      name: 'role3-phone',
      use: { ...devices['Desktop Chrome'], baseURL: role3URL, viewport: { width: 360, height: 740 }, hasTouch: true },
      testMatch: ROLE3,
    },
  ],
  webServer: [
    {
      command: `pnpm start --port ${port}`,
      env: onSupabase ? {} : { ALLOW_FAKE_DB: '1' },
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    // FAKE_DB_USER=admin signs the fake in as the demo admin (Role 3 specs only).
    ...(onSupabase
      ? []
      : [
          {
            command: `pnpm start --port ${adminPort}`,
            env: { ALLOW_FAKE_DB: '1', FAKE_DB_USER: 'admin' },
            url: `http://localhost:${adminPort}`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
        ]),
  ],
});
