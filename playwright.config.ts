import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);

// #26 grows this into the full suite (mobile project, Supabase helpers).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: { baseURL: `http://localhost:${port}`, trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm start --port ${port}`,
    // The smoke test runs the production build on the in-memory fake (no database).
    env: { ALLOW_FAKE_DB: '1' },
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
