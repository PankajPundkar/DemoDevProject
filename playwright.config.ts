import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end browser tests for DemoSite.
 *
 * By default Playwright starts its own copy of the app (e2e/server.ts) on port 3100 with an
 * isolated data folder and raised rate limits, so your local `data/` and dev server are never
 * touched. Set E2E_BASE_URL to test an app that is already running instead (rate limits and
 * existing data then apply).
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    // Same format mcp-qa-lab uses, so results can be imported into Xray (test_key property).
    ['junit', { outputFile: 'test-results/junit-results.xml', embedAnnotationsAsProperties: true }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'node --import tsx e2e/server.ts',
        url: `${baseURL}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: { PORT: String(PORT) },
      },
});
