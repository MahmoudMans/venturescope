import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const loader = readFileSync("lib/dashboard/load-shared-models.ts", "utf8");

const access = readFileSync("lib/workspaces/shared-access.ts", "utf8");

const projectLayout = readFileSync("app/(app)/projects/[projectId]/layout.tsx", "utf8");

const dashboard = readFileSync("app/(app)/dashboard/page.tsx", "utf8");

const appLayout = readFileSync("app/(app)/layout.tsx", "utf8");

describe("shared models loader source", () => {
  it("lists only other people's models in workspaces the person owns or belongs to", () => {
    expect(loader).toContain("not: userId");

    expect(loader).toContain("ownerId: userId");

    expect(loader).toContain("members:");

    expect(loader).toContain("some:");
  });

  it("is bounded, read-only and ordered", () => {
    expect(loader).toMatch(/take: 50,/);

    expect(loader).toContain("findMany");

    for (const write of ["update", "delete", "create", "upsert"]) {
      expect(loader, write).not.toContain(`.${write}`);
    }
  });

  it("never selects the assumptions, the money figures or any other model content", () => {
    expect(loader).not.toContain("baseAssumptions");

    expect(loader).not.toContain("monthlyOverrides");

    expect(loader).not.toContain("financingEvents");
  });

  it("looks up a person's own membership only", () => {
    expect(access).toContain("userId,");

    expect(access).toContain("where:");

    expect(access).not.toContain("findMany");
  });
});

describe("shared model pages source", () => {
  it("shows rename, duplicate and delete only to the owner of the model", () => {
    expect(projectLayout).toContain("project.userId === user.id");

    const owner = projectLayout.indexOf("isOwner ? (");

    const actions = projectLayout.indexOf("<ProjectActions");

    expect(owner).toBeGreaterThan(-1);

    expect(actions).toBeGreaterThan(owner);

    expect(projectLayout.match(/<ProjectActions/g)).toHaveLength(1);
  });

  it("greets people with their saved name and lists the shared models", () => {
    expect(dashboard).toContain("loadDisplayName");

    expect(dashboard).toContain("loadSharedModels");

    expect(dashboard).toContain("<SharedModelsSection");

    expect(dashboard).not.toContain("user.name?.trim()");
  });

  it("offers shared models in the search palette", () => {
    expect(appLayout).toContain("loadSharedModels");

    expect(appLayout).toContain("hint: sharedModelHint(model)");
  });
});
