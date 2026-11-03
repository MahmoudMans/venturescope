import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const action = readFileSync("app/(app)/projects/sample-action.ts", "utf8");

const dashboard = readFileSync("app/(app)/dashboard/page.tsx", "utf8");

const newModelPage = readFileSync("app/(app)/projects/new/page.tsx", "utf8");

describe("sample model action source", () => {
  it("is a server action that only works for the signed-in person", () => {
    expect(action).toContain('"use server"');

    expect(action).toContain("requireUser");

    expect(action.match(/userId: user\.id/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("takes nothing from the browser", () => {
    expect(action).toContain("createSampleModelAction(): Promise<void>");

    expect(action).not.toContain("formData");
  });

  it("never makes a second copy for the same person", () => {
    const lookup = action.indexOf("existing !== null");

    const create = action.indexOf("$transaction");

    expect(lookup).toBeGreaterThan(-1);

    expect(create).toBeGreaterThan(lookup);

    expect(action).toContain("SAMPLE_MODEL_NAME");
  });

  it("saves the model, its scenarios, financing and overrides together", () => {
    expect(action).toContain("prisma.$transaction");

    expect(action).toContain("transaction.project.create");

    expect(action).toContain("financingEvents:");

    expect(action).toContain("DEFAULT_PROJECT_SCENARIOS");

    expect(action).toContain("transaction.monthlyOverride.createMany");
  });

  it("sends the person to the new model, or back with a notice when it fails", () => {
    expect(action).toContain("/overview");

    expect(action).toContain("/dashboard?status=sample-failed");
  });
});

describe("sample model entry points", () => {
  it("is offered on the empty dashboard and on the new model page", () => {
    expect(dashboard).toContain("<SampleModelForm");

    expect(newModelPage).toContain("<SampleModelForm");
  });

  it("shows a failed attempt on the dashboard", () => {
    expect(dashboard).toContain("getSampleNotice(status)");

    expect(dashboard).toContain("<StatusNotice");
  });
});
