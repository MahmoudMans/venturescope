import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  checkSeedTarget,
  DEMO_PASSWORD,
  DEMO_PEOPLE,
  DEMO_PERSON_KEYS,
} from "@/scripts/seed/demo-config";

const read = (path: string) => readFileSync(path, "utf8");

const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;

const demoScript = read("scripts/demo.sh");

const seedSource = read("scripts/seed/seed-demo.ts");

const runSource = read("scripts/seed/seed.run.ts");

const readme = read("README.md");

const readmeDemo = readme.slice(
  readme.indexOf("## Demo data"),
  readme.indexOf("## Password recovery"),
);

describe("the commands in package.json", () => {
  it("run the seed and the check with their own test runner setup, on files that exist", () => {
    const config = "--config scripts/seed/vitest.config.mts";

    expect(scripts["db:seed"]).toContain(`vitest run ${config} scripts/seed/seed.run.ts`);

    expect(scripts["db:seed:verify"]).toBe(`vitest run ${config} scripts/seed/verify.run.ts`);

    expect(scripts["db:seed"]).toContain("VS_SEED_NODE_ENV=$NODE_ENV");

    expect(scripts.demo).toBe("bash scripts/demo.sh");

    expect(scripts["test:seed"]).toBe("vitest run tests/seed");

    for (const file of ["seed.run.ts", "verify.run.ts", "vitest.config.mts"]) {
      expect(existsSync(`scripts/seed/${file}`), file).toBe(true);
    }

    expect(existsSync("scripts/demo.sh")).toBe(true);
  });

  it("keep the run files out of pnpm test, which only looks for .test files", () => {
    expect(read("scripts/seed/vitest.config.mts")).toContain('include: ["scripts/seed/*.run.ts"]');

    expect(
      existsSync("scripts/seed/seed.test.ts") || existsSync("scripts/seed/verify.test.ts"),
    ).toBe(false);
  });
});

describe("the demo script", () => {
  it("prints the accounts and the password that the seed really creates", () => {
    expect(demoScript).toContain(DEMO_PASSWORD);

    for (const key of DEMO_PERSON_KEYS) {
      expect(demoScript, DEMO_PEOPLE[key].email).toContain(DEMO_PEOPLE[key].email);
    }
  });

  it("calls the same hosts local as the safety rule of the seed", () => {
    const line = demoScript.split("\n").find((text) => text.includes("LOCAL_DATABASE=1")) ?? "";

    const hosts = line
      .split(")")[0]
      .split("|")
      .map((host) => host.trim().replace(/"/g, ""));

    expect(hosts.length).toBeGreaterThanOrEqual(5);

    for (const host of hosts) {
      const authority = host.includes(":") && host.startsWith("[") === false ? `[${host}]` : host;

      const result = checkSeedTarget({
        databaseUrl: `postgresql://u:p@${authority}:5438/db`,
        nodeEnv: undefined,
        allowRemote: undefined,
      });

      expect(result.ok, host).toBe(true);
    }
  });

  it("checks the database before it changes anything, and runs the steps in order", () => {
    const lines = demoScript.split("\n");

    const order = [
      (text: string) => text.includes('"${VS_SEED_ALLOW_REMOTE:-}" != "yes"'),
      (text: string) => text === "pnpm exec prisma migrate deploy",
      (text: string) => text === "pnpm db:seed",
      (text: string) => text === "pnpm db:seed:verify",
      (text: string) => text.includes("exec pnpm dev"),
    ];

    const places = order.map((match) => lines.findIndex(match));

    places.forEach((place, index) => {
      expect(place, `step ${index + 1}`).toBeGreaterThan(-1);

      if (index > 0) {
        expect(place, `step ${index + 1}`).toBeGreaterThan(places[index - 1]);
      }
    });

    expect(demoScript).toContain("set -euo pipefail");
  });

  it("never resets the database or removes volumes", () => {
    for (const danger of [
      "migrate reset",
      "migrate dev",
      "db push",
      "--force",
      "down",
      "rm -rf",
      "DROP ",
    ]) {
      expect(demoScript.includes(danger), danger).toBe(false);
    }
  });
});

describe("the seed", () => {
  it("deletes only the demo accounts and what they own", () => {
    const deletes = [...seedSource.matchAll(/deleteMany\(\{([\s\S]*?)\}\)/g)];

    expect(deletes.length).toBeGreaterThan(0);

    for (const match of deletes) {
      expect(match[1]).toContain("in:");
    }

    for (const danger of ["$executeRaw", "$queryRaw", "TRUNCATE", "migrate"]) {
      expect(seedSource.includes(danger), danger).toBe(false);
    }
  });

  it("never edits or deletes the activity ledger, and never switches off a database rule", () => {
    for (const danger of [
      "projectauditevent.update",
      "projectauditevent.delete",
      "projectauditevent.upsert",
      "session_replication_role",
      "disable trigger",
      "movehistorytotheirdays",
    ]) {
      expect(seedSource.toLowerCase().includes(danger), danger).toBe(false);
    }
  });

  it("opens the closed months of an old demo model before it deletes the model", () => {
    const start = seedSource.indexOf("export async function removeOldDemoData(");

    const body = seedSource.slice(start, seedSource.indexOf("\n}\n", start));

    const states = body.indexOf("financialPeriodState.deleteMany");

    expect(states).toBeGreaterThan(-1);

    expect(states).toBeLessThan(body.indexOf("user.deleteMany"));
  });

  it("sets the clock before every step that writes, so each row is born on its story day", () => {
    const steps = [
      "createDemoPeople",
      "createDemoWorkspace",
      "createDemoModel",
      "saveDemoVersions",
      "saveDemoRiskRules",
      "importDemoMonths",
      "importDemoGoals",
      "reopenDemoMonth",
      "createDemoDecisions",
      "freezeDemoReview",
      "createDemoApprovals",
      "touchDemoModel",
    ];

    for (const step of steps) {
      const start = seedSource.indexOf(`export async function ${step}(`);

      expect(start, step).toBeGreaterThan(-1);

      const body = seedSource.slice(start, seedSource.indexOf("\n}\n", start));

      expect(body.includes("clockTo(ctx") || body.includes("at: "), step).toBe(true);
    }
  });

  it("is started by a run file that replaces only the date, and gives the real clock back", () => {
    expect(runSource).toContain('vi.useFakeTimers({ toFake: ["Date"] })');

    expect(runSource).toContain("vi.setSystemTime(");

    expect(runSource).toContain("vi.useRealTimers()");
  });

  it("writes through the services of the app, so the audit trail and the rules are the real ones", () => {
    for (const service of [
      "applyGovernedDataImport",
      "createApprovalRequest",
      "decideApprovalRequest",
      "closeFinancialPeriod",
      "reopenFinancialPeriod",
      "createProjectRevision",
      "createDecisionAction",
      "createExecutiveReview",
    ]) {
      expect(seedSource, service).toContain(service);
    }
  });
});

describe("the README", () => {
  it("tells how to run the demo, the accounts, the password and the safety rule", () => {
    for (const text of [
      "pnpm demo",
      "pnpm db:seed",
      "pnpm db:seed:verify",
      "VS_SEED_ALLOW_REMOTE=yes",
      DEMO_PASSWORD,
    ]) {
      expect(readmeDemo, text).toContain(text);
    }

    for (const key of DEMO_PERSON_KEYS) {
      expect(readmeDemo, DEMO_PEOPLE[key].email).toContain(DEMO_PEOPLE[key].email);
    }
  });
});
