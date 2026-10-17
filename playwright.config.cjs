// @ts-check
const isCI = !!process.env.CI;
const port = Number(process.env.PW_PORT) || 4173;

module.exports = {
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['list'], ['html']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
  },
  webServer: {
    command: process.env.PW_SERVER_COMMAND || 'npm run preview -- --port=4173',
    port,
    timeout: 120_000,
    reuseExistingServer: !isCI,
  },
};
