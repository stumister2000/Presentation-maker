import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

// Runs against a production build (`npm run build` first) with a fresh
// in-memory database per server. Two app servers: one on the offline engine,
// one on the Claude engine pointed at a local mock of the Messages API.
const outbox = path.join(process.cwd(), "test-results", "outbox.jsonl");
const common = {
  PGLITE_DIR: "memory",
  FAST_AI: "1",
  EMAIL_OUTBOX: outbox,
  CRON_SECRET: "test-cron-secret",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
  STRIPE_PRICE_PLUS_MONTHLY: "price_plus_monthly",
  STRIPE_PRICE_PLUS_YEARLY: "price_plus_yearly",
  STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly",
  STRIPE_PRICE_PRO_YEARLY: "price_pro_yearly",
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3200", trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
  webServer: [
    { command: "node tests/mock-anthropic.mjs", port: 3299, reuseExistingServer: false, env: { MOCK_ANTHROPIC_PORT: "3299" } },
    { command: "npx next start -p 3200", port: 3200, reuseExistingServer: false, env: { ...common, APP_URL: "http://localhost:3200", AI_ENGINE: "offline", RATE_LIMIT_MULTIPLIER: "20" } },
    {
      command: "npx next start -p 3201", port: 3201, reuseExistingServer: false,
      env: { ...common, APP_URL: "http://localhost:3201", AI_ENGINE: "claude", ANTHROPIC_API_KEY: "test-key", ANTHROPIC_BASE_URL: "http://localhost:3299", EMAIL_OUTBOX: outbox + ".claude" },
    },
  ],
});
