import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const guide = readFileSync("components/projects/setup-guide.tsx", "utf8");

const required = readFileSync("components/financial/analysis-setup-required.tsx", "utf8");

const pages = {
  assumptions: readFileSync("app/(app)/projects/[projectId]/assumptions/page.tsx", "utf8"),
  revenue: readFileSync("app/(app)/projects/[projectId]/revenue/page.tsx", "utf8"),
  expenses: readFileSync("app/(app)/projects/[projectId]/expenses/page.tsx", "utf8"),
};

const forms = [
  readFileSync("components/assumptions/revenue-assumptions-form.tsx", "utf8"),
  readFileSync("components/assumptions/expense-assumptions-form.tsx", "utf8"),
];

describe("setup guide source", () => {
  it("is a server component that needs no browser code", () => {
    expect(guide).not.toContain('"use client"');

    expect(guide).toContain("export function SetupGuide");

    expect(guide).toContain("export function SetupNextStep");
  });

  it("exposes the progress to screen readers", () => {
    expect(guide).toContain('role="progressbar"');

    expect(guide).toContain("aria-valuenow");

    expect(guide).toContain("aria-valuetext");

    expect(guide.match(/className="sr-only"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("lists the sections in an ordered list", () => {
    expect(guide).toContain("<ol");

    expect(guide).toContain("<li");
  });
});

describe("analysis setup required card", () => {
  it("keeps its name and props so every analysis page still works", () => {
    expect(required).toContain("export function AnalysisSetupRequired");

    expect(required).toContain("projectId");

    expect(required).toContain("missingSections");
  });

  it("shows the guided checklist instead of a single button", () => {
    expect(required).toContain("<SetupGuide");

    expect(required).toContain("buildSetupProgress");

    expect(required).toContain("completionFromMissing(missingSections)");

    expect(required).not.toContain("Complete the model assumptions first");
  });
});

describe("assumption pages", () => {
  it("each end with a next-step card for their own section", () => {
    expect(pages.assumptions).toContain('current="general"');

    expect(pages.revenue).toContain('current="revenue"');

    expect(pages.expenses).toContain('current="expenses"');

    for (const page of Object.values(pages)) {
      expect(page).toContain("<SetupNextStep");

      expect(page).toMatch(/buildSetupProgress\(\s*project\.id,\s*assumptions\.completion,/);
    }
  });

  it("no longer talk about a financial engine that will come later", () => {
    const text = [...Object.values(pages), ...forms].join("\n");

    expect(text).not.toContain("engine is introduced");

    expect(text).not.toContain("will later");

    expect(text).not.toContain("persisted now");

    expect(text).not.toContain("persistent inputs");
  });
});
