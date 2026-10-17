// @ts-check
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;
const port = process.env.PW_PORT || '5173';
const serverCommand = process.env.PW_SERVER_COMMAND || 'npm run dev';

module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['list'], ['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: serverCommand,
    port: Number(port),
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
