import { afterAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { checkSeedTarget } from "@/scripts/seed/demo-config";
import { createSeedContext, seedDemoData, summarizeSeed } from "@/scripts/seed/seed-demo";

/**
 * This file is run by "pnpm db:seed" (see scripts/seed/vitest.config.mts). It is not a test of the
 * app. The test runner is only used because it can run TypeScript with the "@/" imports of the app.
 * The name ends with .run.ts, so "pnpm test" never runs it.
 *
 * The database does not allow a change to the activity ledger, so every row has to be written with
 * the day it happened in the story. For that, the seed sets the date that the app reads before each
 * step (vi.setSystemTime). Only the date is replaced: timers and everything else stay real.
 */

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

describe("demo seed", () => {
  afterAll(async () => {
    vi.useRealTimers();

    await prisma.$disconnect();
  });

  it("writes the demo company into the database", async () => {
    const target = checkSeedTarget({
      databaseUrl: process.env.DATABASE_URL ?? "",
      nodeEnv: process.env.VS_SEED_NODE_ENV,
      allowRemote: process.env.VS_SEED_ALLOW_REMOTE,
    });

    if (target.ok === false) {
      throw new Error(target.reason);
    }

    print("");
    print(`Writing the demo data to the database on ${target.host}.`);

    // The real day of the run is read before the clock is replaced.
    const context = createSeedContext(
      new Date(),
      (line) => print(`  ${line}`),
      (date) => vi.setSystemTime(date),
    );

    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      await seedDemoData(context);
    } finally {
      vi.useRealTimers();
    }

    print("");

    for (const line of summarizeSeed(context)) {
      print(line);
    }

    expect(context.projectId).not.toBeNull();
  });
});
