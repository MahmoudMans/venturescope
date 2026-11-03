import { describe, expect, it } from "vitest";

import {
  sharedModelHint,
  toSharedModels,
  type SharedModelRow,
} from "@/lib/dashboard/shared-models";
import { UNKNOWN_OWNER_NAME } from "@/lib/workspaces/shared-role";

function row(overrides: Partial<SharedModelRow> = {}): SharedModelRow {
  return {
    id: "p1",
    userId: "owner",
    name: "Acme plan",
    industry: "SaaS",
    currency: "EUR",
    horizonMonths: 36,
    updatedAt: new Date("2026-10-01T10:00:00Z"),
    user: { name: "Grace Hopper" },
    workspace: {
      id: "w1",
      name: "Finance team",
      ownerId: "owner",
      members: [{ role: "EDITOR" }],
    },
    ...overrides,
  };
}

describe("toSharedModels", () => {
  it("turns a row into a card with the workspace, the owner and the person's role", () => {
    expect(toSharedModels([row()], "me")).toEqual([
      {
        id: "p1",
        name: "Acme plan",
        industry: "SaaS",
        currency: "EUR",
        horizonMonths: 36,
        updatedAt: new Date("2026-10-01T10:00:00Z"),
        ownerName: "Grace Hopper",
        workspaceId: "w1",
        workspaceName: "Finance team",
        role: "EDITOR",
      },
    ]);
  });

  it("keeps the order it was given", () => {
    const models = toSharedModels([row({ id: "a" }), row({ id: "b" }), row({ id: "c" })], "me");

    expect(models.map((model) => model.id)).toEqual(["a", "b", "c"]);
  });

  it("never lists a model the person owns", () => {
    expect(toSharedModels([row({ userId: "me" })], "me")).toHaveLength(0);
  });

  it("skips a model that is no longer in a workspace", () => {
    expect(toSharedModels([row({ workspace: null })], "me")).toHaveLength(0);
  });

  it("shows a workspace owner as the owner of models other people put there", () => {
    const models = toSharedModels(
      [row({ workspace: { id: "w1", name: "Finance team", ownerId: "me", members: [] } })],
      "me",
    );

    expect(models[0]?.role).toBe("OWNER");
  });

  it("gives viewers the viewer role", () => {
    const models = toSharedModels(
      [
        row({
          workspace: {
            id: "w1",
            name: "Finance team",
            ownerId: "owner",
            members: [{ role: "VIEWER" }],
          },
        }),
      ],
      "me",
    );

    expect(models[0]?.role).toBe("VIEWER");
  });

  it("uses a neutral owner name when the saved one is blank", () => {
    const models = toSharedModels([row({ user: { name: "   " } })], "me");

    expect(models[0]?.ownerName).toBe(UNKNOWN_OWNER_NAME);
  });
});

describe("sharedModelHint", () => {
  it("names the workspace and the role", () => {
    expect(sharedModelHint({ workspaceName: "Finance team", role: "EDITOR" })).toBe(
      "Shared in Finance team \u00b7 Editor",
    );

    expect(sharedModelHint({ workspaceName: "Board", role: "VIEWER" })).toBe(
      "Shared in Board \u00b7 Viewer",
    );
  });
});
