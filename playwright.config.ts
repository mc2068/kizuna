import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);

// #26 grows this into the full suite (mobile project, Supabase helpers).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'off' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Role 3: the pages are checked at phone width too (360 px).
    { name: 'phone', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true } },
  ],
  webServer: {
    command: `pnpm start --port ${port}`,
    // The smoke test runs the production build on the in-memory fake (no database).
    // FAKE_DB_USER=admin signs the fake in as the demo admin, so the admin pipeline can be tested.
    env: { ALLOW_FAKE_DB: '1', FAKE_DB_USER: 'admin' },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
