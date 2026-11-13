// End-to-end system tests for TechCareerFit on the live system.
//   npm run test:e2e    -> https://techcareerfit-frontend-2.onrender.com with https://techcareerfit-backend-2.onrender.com
import { defineConfig, devices } from '@playwright/test';

const LIVE = process.env.BASE_URL || 'https://techcareerfit-frontend-2.onrender.com';
process.env.E2E_RUN_ID ||= String(Date.now());   // one test account per run, shared with the workers

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,                 // Render free tier can take ~1 minute to wake up
  expect: { timeout: 90_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: LIVE,
    screenshot: 'on',
    trace: 'retain-on-failure',
    acceptDownloads: true,
  },
  projects: [{ name: 'live', use: { ...devices['Desktop Chrome'] } }],
  globalTeardown: './e2e/global-teardown.js',
});
