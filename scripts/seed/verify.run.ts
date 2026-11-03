import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { DEMO_CHECKS, type DemoFacts } from "@/scripts/seed/verify-checks";
import { loadDemoFacts } from "@/scripts/seed/verify-facts";

/**
 * This file is run by "pnpm db:seed:verify" (see scripts/seed/vitest.config.mts). It reads the demo
 * data back from the database and checks it. It changes nothing. The name ends with .run.ts, so
 * "pnpm test" never runs it.
 */

function print(line: string): void {
  process.stdout.write(`${line}\n`);
}

describe("demo data", () => {
  let facts: DemoFacts | null = null;

  const results: { name: string; ok: boolean; note: string }[] = [];

  afterAll(async () => {
    print("");

    for (const result of results) {
      print(`  ${result.ok ? "PASS" : "FAIL"}  ${result.name}`);

      print(`        ${result.note}`);
    }

    print("");

    await prisma.$disconnect();
  });

  it("can be read from the database", async () => {
    facts = await loadDemoFacts();

    expect(facts.people).toHaveLength(3);
  });

  for (const check of DEMO_CHECKS) {
    it(check.name, () => {
      if (facts === null) {
        throw new Error("The demo data could not be read. See the first error above.");
      }

      try {
        results.push({ name: check.name, ok: true, note: check.run(facts) });
      } catch (error) {
        const note = error instanceof Error ? error.message : String(error);

        results.push({ name: check.name, ok: false, note });

        throw error;
      }
    });
  }
});
