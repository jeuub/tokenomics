import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Uncomment once an app dev server is wired up:
  // webServer: {
  //   command: "pnpm --filter @tokenomics/marketing dev",
  //   url: "http://localhost:4321",
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
