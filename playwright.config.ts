import {
  defineConfig,
  devices,
} from "@playwright/test";

const baseURL =
  process.env.E2E_BASE_URL ??
  "http://127.0.0.1:3100";

const databaseURL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://venturescope_e2e:venturescope_e2e@127.0.0.1:55438/venturescope_e2e?schema=public";

const authSecret =
  process.env.E2E_AUTH_SECRET ??
  "venturescope-e2e-auth-secret-2026-local-testing-only";

export default defineConfig({
  testDir:
    "./tests/e2e",

  fullyParallel:
    false,

  workers:
    1,

  retries:
    0,

  timeout:
    120_000,

  expect: {
    timeout:
      12_000,
  },

  reporter: [
    [
      "list",
    ],

    [
      "html",
      {
        outputFolder:
          "playwright-report",

        open:
          "never",
      },
    ],
  ],

  use: {
    baseURL,

    trace:
      "retain-on-failure",

    screenshot:
      "only-on-failure",

    video:
      "retain-on-failure",
  },

  projects: [
    {
      name:
        "chromium",

      use: {
        ...devices[
          "Desktop Chrome"
        ],
      },
    },
  ],

  webServer: {
    command:
      "pnpm exec next start -p 3100",

    url:
      baseURL,

    reuseExistingServer:
      false,

    timeout:
      120_000,

    stdout:
      "pipe",

    stderr:
      "pipe",

    env: {
      DATABASE_URL:
        databaseURL,

      AUTH_SECRET:
        authSecret,

      AUTH_URL:
        baseURL,

      NEXTAUTH_URL:
        baseURL,

      AUTH_TRUST_HOST:
        "true",

      PLAYWRIGHT_TEST:
        "1",
    },
  },
});
