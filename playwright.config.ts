import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);

// The tests read the same Supabase variables as the build: CI exports them from `supabase status`;
// locally they come from .env.local when it exists (process env wins).
try {
  process.loadEnvFile('.env.local');
} catch {}
const onSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Public pages at phone size (layout and axe checks); the flows run on desktop only.
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: 'pages.spec.ts' },
  ],
  webServer: {
    command: `pnpm start --port ${port}`,
    env: onSupabase ? {} : { ALLOW_FAKE_DB: '1' },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
