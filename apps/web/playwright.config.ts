import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3101",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "pnpm exec next dev --port 3101",
    url: "http://localhost:3101/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      BETTER_AUTH_SECRET: "local-e2e-secret-at-least-32-characters",
      BETTER_AUTH_URL: "http://localhost:3101",
      DATABASE_URL: "postgresql://ielts:ielts@localhost:5432/ielts",
    },
  },
});
