import { defineConfig, devices } from '@playwright/test';

// Integration tests against a deployed site (production by default, or a Vercel preview):
//   pnpm e2e:deployed                                   # https://kizuna-ruddy.vercel.app
//   DEPLOYED_URL=https://<preview>.vercel.app pnpm e2e:deployed
// No local server is started. The specs in e2e/deployed are read-only: they never sign in, send an
// email, save a project or submit a lead, so they are safe to run against production at any time.
// See e2e/README.md.
const baseURL = (process.env.DEPLOYED_URL ?? 'https://kizuna-ruddy.vercel.app').replace(/\/$/, '');

export default defineConfig({
  testDir: './e2e/deployed',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // The network between the runner and Vercel can blip; one retry keeps a cold start from failing a run.
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['html', { open: 'never', outputFolder: 'playwright-report-deployed' }], ['list']] : 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    { name: 'deployed-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'deployed-mobile', use: { ...devices['Pixel 7'] }, testMatch: 'pages.spec.ts' },
  ],
});
