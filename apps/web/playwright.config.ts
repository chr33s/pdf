import { defineConfig } from "@playwright/test";

const defaultPort = 8080;
const webServerPort = Number(process.env.WEB_E2E_PORT ?? defaultPort);
const baseURL = `http://127.0.0.1:${webServerPort}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx vite dev --host 127.0.0.1 --port ${webServerPort}`,
    url: `${baseURL}/0.test.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
