import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  DATA_EXPORT_INCLUDED_TABLES,
  DATA_EXPORT_LEFT_OUT,
  DATA_EXPORT_LEFT_OUT_NOTE,
  DATA_EXPORT_LIMIT,
  DATA_EXPORT_PATH,
  DATA_EXPORT_WINDOW_MS,
  leftOutLabels,
} from "@/lib/account/data-export-info";

const read = (path: string) => readFileSync(path, "utf8");

const schema = read("prisma/schema.prisma");

const route = read("app/api/account/export/route.ts");

const query = read("lib/account/data-export-query.ts");

const profilePage = read("app/(app)/account/profile/page.tsx");

const securityPage = read("app/(app)/account/security/page.tsx");

const events = read("lib/security/account-events.ts");

const readme = read("README.md");

/** Source text with every run of spaces and line breaks turned into one space. */
const flat = (text: string) => text.replace(/\s+/g, " ");

function modelBlock(name: string): string {
  const match = new RegExp(`^model ${name} \\{([\\s\\S]*?)^\\}`, "m").exec(schema);

  if (match === null) {
    throw new Error(`There is no model ${name} in the schema.`);
  }

  return match[1];
}

function fieldsOf(name: string): string[] {
  return modelBlock(name)
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line !== "" && line.startsWith("//") === false && line.startsWith("@@") === false,
    )
    .map((line) => line.split(/\s+/)[0]);
}

function allModelNames(): string[] {
  return Array.from(schema.matchAll(/^model (\w+) \{/gm), (match) => match[1]);
}

describe("records of a model", () => {
  const withProjectId = allModelNames().filter((name) => fieldsOf(name).includes("projectId"));

  const leftOut = DATA_EXPORT_LEFT_OUT.map((item) => item.table);

  it("are all either in the download or on the list of what is left out", () => {
    const decided = [...DATA_EXPORT_INCLUDED_TABLES, ...leftOut];

    const undecided = withProjectId.filter((name) => decided.includes(name) === false);

    expect(undecided).toEqual([]);
  });

  it("are never on both lists, and every listed table is a real table of a model", () => {
    for (const table of DATA_EXPORT_INCLUDED_TABLES) {
      expect(leftOut.includes(table)).toBe(false);
    }

    for (const table of [...DATA_EXPORT_INCLUDED_TABLES, ...leftOut]) {
      expect(withProjectId.includes(table)).toBe(true);
    }

    expect(new Set(leftOut).size).toBe(leftOut.length);
  });

  it("are read by the query through the relation names of the Project table", () => {
    const relations: Record<string, string> = {
      Scenario: "scenarios",
      FinancingEvent: "financingEvents",
      MonthlyOverride: "monthlyOverrides",
      ActualPeriod: "actualPeriods",
      ProjectKpiTarget: "kpiTargets",
      VarianceCommentary: "varianceCommentaries",
    };

    expect(Object.keys(relations).sort()).toEqual([...DATA_EXPORT_INCLUDED_TABLES].sort());

    const project = modelBlock("Project");

    for (const [table, property] of Object.entries(relations)) {
      expect(new RegExp(`^\\s+${property}\\s+${table}\\[\\]`, "m").test(project)).toBe(true);

      expect(query).toContain(`${property}: {`);

      expect(query).toContain(`${property}: project.${property},`);
    }
  });
});

describe("the database query", () => {
  const selected: Record<string, string[]> = {
    User: ["name", "email", "createdAt", "passwordChangedAt"],
    Workspace: ["name", "ownerId", "createdAt", "members"],
    WorkspaceMember: ["role", "userId"],
    Project: [
      "userId",
      "name",
      "industry",
      "currency",
      "startMonth",
      "horizonMonths",
      "revenueMode",
      "baseAssumptions",
      "createdAt",
      "updatedAt",
      "workspace",
    ],
    Scenario: ["id", "name", "type", "modifiers", "createdAt"],
    FinancingEvent: ["name", "type", "month", "amount", "apr", "termMonths", "repaymentStartMonth"],
    MonthlyOverride: ["scenarioId", "month", "values", "note"],
    ActualPeriod: [
      "period",
      "revenue",
      "cogs",
      "operatingExpenses",
      "ebitda",
      "netIncome",
      "cashFlow",
      "cashBalance",
      "mrr",
      "customers",
    ],
    ProjectKpiTarget: ["periodKey", "metricCode", "targetValue", "ownerName", "note"],
    VarianceCommentary: [
      "periodKey",
      "metricCode",
      "causeCode",
      "varianceNature",
      "explanation",
      "correctiveAction",
      "ownerName",
      "recoveryPeriodKey",
      "status",
    ],
  };

  it("only asks for fields that exist in the schema", () => {
    for (const [model, fields] of Object.entries(selected)) {
      const known = fieldsOf(model);

      for (const field of fields) {
        expect(known.includes(field)).toBe(true);
      }
    }
  });

  it("does not ask for any field that no table has", () => {
    const known = new Set(Object.keys(selected).flatMap((model) => fieldsOf(model)));

    const asked = Array.from(query.matchAll(/^\s+(\w+): true,?$/gm), (match) => match[1]);

    expect(asked.length).toBeGreaterThan(30);

    for (const field of asked) {
      expect(known.has(field)).toBe(true);
    }
  });

  it("asks for every field that the download writes", () => {
    for (const fields of Object.values(selected)) {
      for (const field of fields) {
        expect(query).toContain(field);
      }
    }
  });

  it("only reads models of this person and never reads sign-in secrets", () => {
    expect(query).toContain("prisma.project.findMany");

    const projectQuery = query.slice(query.indexOf("prisma.project.findMany"));

    expect(projectQuery.slice(0, 80)).toMatch(/where: \{\s+userId,\s+\}/);

    expect(query).not.toContain("passwordHash");

    expect(query).not.toContain("authVersion");

    expect(query).not.toContain("include:");
  });

  it("gives the person the role that exportedWorkspaceRole decides", () => {
    expect(query).toContain(
      "role: exportedWorkspaceRole(workspace.ownerId, userId, workspace.members[0]?.role),",
    );
  });

  it("keeps the scenarios and the other rows in a fixed order", () => {
    const text = flat(query);

    expect(text).toContain('scenarios: { orderBy: { createdAt: "asc", }');

    expect(text).toContain('financingEvents: { orderBy: { month: "asc", }');

    expect(text).toContain('monthlyOverrides: { orderBy: { month: "asc", }');

    expect(text).toContain('actualPeriods: { orderBy: { period: "asc", }');
  });

  it("takes the person from its argument and never from a request", () => {
    expect(query).toContain("loadDataExportSource(userId: string)");

    expect(query).not.toContain("request");
  });
});

describe("download route", () => {
  it("is where the Profile page points", () => {
    expect(DATA_EXPORT_PATH).toBe("/api/account/export");

    expect(existsSync("app/api/account/export/route.ts")).toBe(true);
  });

  it("takes no input, so nobody can ask for the data of someone else", () => {
    expect(route).toContain("export async function GET()");

    expect(route).not.toContain("searchParams");

    expect(route).not.toContain("request");

    expect(route).not.toContain("params");
  });

  it("checks the session first, then the limit, then reads the database", () => {
    const session = route.indexOf("await auth()");

    const limit = route.indexOf("checkRateLimit(");

    const load = route.indexOf("loadDataExportSource(userId)");

    expect(session).toBeGreaterThan(-1);

    expect(limit).toBeGreaterThan(session);

    expect(load).toBeGreaterThan(limit);

    expect(route).toContain('return new Response("Unauthorized", { status: 401 });');
  });

  it("slows down repeated downloads of the same person", () => {
    expect(route).toContain("key: `data-export:${userId}`");

    expect(route).toContain("limit: DATA_EXPORT_LIMIT");

    expect(route).toContain("windowMs: DATA_EXPORT_WINDOW_MS");

    expect(route).toContain("status: 429");

    expect(route).toContain('"Retry-After"');

    expect(DATA_EXPORT_LIMIT).toBe(5);

    expect(DATA_EXPORT_WINDOW_MS).toBe(600_000);
  });

  it("sends a ZIP file that is never stored by a browser cache or a proxy", () => {
    expect(route).toContain('"Content-Type": "application/zip"');

    expect(route).toContain("attachment; filename=");

    expect(route).toContain('const NO_STORE = "private, no-store, max-age=0";');

    expect(route).toContain('"Cache-Control": NO_STORE');

    expect(route).toContain('"X-Content-Type-Options": "nosniff"');

    expect(route).toContain('export const dynamic = "force-dynamic";');

    expect(route).toContain('export const runtime = "nodejs";');
  });

  it("copies the bytes into an ArrayBuffer, like the PDF route does", () => {
    expect(route).toContain("new Response(Uint8Array.from(zip).buffer, {");
  });

  it("writes a log line without any content of the file", () => {
    expect(route).toContain('logAccountSecurityEvent("data.exported", userId, {');

    expect(route).toContain('logAccountSecurityEvent("data.export.rejected", userId, {');

    expect(events).toContain('"data.exported"');

    expect(events).toContain('"data.export.rejected"');

    const logged = route.slice(route.indexOf('logAccountSecurityEvent("data.exported"'));

    expect(logged.slice(0, 250)).not.toContain("source.account");
  });
});

describe("pages", () => {
  it("offer the download on the Profile page", () => {
    expect(profilePage).toContain('id="your-data"');

    expect(profilePage).toContain("href={DATA_EXPORT_PATH}");

    expect(profilePage).toContain("download");

    expect(profilePage).toContain("Download my data");

    expect(profilePage).toContain("{DATA_EXPORT_LEFT_OUT_NOTE}");

    expect(flat(profilePage)).toContain("never part of the file");
  });

  it("remind people of the download before they delete their account", () => {
    const deleteStart = securityPage.indexOf("Delete account");

    const link = securityPage.indexOf("href={DATA_EXPORT_PATH}");

    const form = securityPage.indexOf("<DeleteAccountForm />");

    expect(deleteStart).toBeGreaterThan(-1);

    expect(link).toBeGreaterThan(deleteStart);

    expect(form).toBeGreaterThan(link);

    expect(flat(securityPage)).toContain("download a copy of your data");
  });
});

describe("texts", () => {
  it("name only things that are really left out", () => {
    const labels = leftOutLabels();

    for (const phrase of [
      "the activity history",
      "saved versions",
      "reviews",
      "decisions",
      "approvals",
    ]) {
      expect(labels.includes(phrase)).toBe(true);

      expect(DATA_EXPORT_LEFT_OUT_NOTE).toContain(phrase);
    }

    expect(DATA_EXPORT_LEFT_OUT_NOTE.startsWith("Some records are not included")).toBe(true);
  });

  it("are the same in the README as in the code", () => {
    expect(readme).toContain("## Download your data");

    expect(readme).toContain(DATA_EXPORT_PATH);

    expect(readme).toContain(`${DATA_EXPORT_LIMIT} downloads every`);

    expect(readme).toContain(`${DATA_EXPORT_WINDOW_MS / 60_000} minutes`);

    expect(readme).toContain("lib/account/data-export-info.ts");
  });
});
