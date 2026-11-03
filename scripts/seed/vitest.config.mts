import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

/**
 * A test runner setup only for "pnpm db:seed" and "pnpm db:seed:verify". It runs the two files
 * scripts/seed/seed.run.ts and scripts/seed/verify.run.ts. The normal "pnpm test" does not use it
 * and does not run those files.
 */

const root = fileURLToPath(new URL("../..", import.meta.url));

// The same files as Next.js. A value that is already set in the shell is never replaced.
config({ path: `${root}/.env.local`, quiet: true });
config({ path: `${root}/.env`, quiet: true });

export default defineConfig({
  root,

  plugins: [tsconfigPaths({ root })],

  test: {
    environment: "node",

    include: ["scripts/seed/*.run.ts"],

    // One file after the other, and stop at the first problem.
    fileParallelism: false,
    bail: 1,

    // A real database and a few hundred small steps. This is a limit, not a wait.
    testTimeout: 10 * 60 * 1000,
    hookTimeout: 10 * 60 * 1000,

    reporters: ["default"],

    // The services write one line of JSON for each event. They are not useful here.
    onConsoleLog(log) {
      return log.includes("venturescope.observability") ? false : undefined;
    },
  },
});
