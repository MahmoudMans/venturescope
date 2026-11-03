import { describe, expect, it } from "vitest";

import {
  UNKNOWN_OWNER_NAME,
  ownerDisplayName,
  resolveWorkspaceRole,
  toSharedProjectAccess,
} from "@/lib/workspaces/shared-role";

describe("resolveWorkspaceRole", () => {
  it("makes the workspace owner an owner, whatever the membership rows say", () => {
    expect(resolveWorkspaceRole("u1", { ownerId: "u1", members: [] })).toBe("OWNER");

    expect(resolveWorkspaceRole("u1", { ownerId: "u1", members: [{ role: "VIEWER" }] })).toBe(
      "OWNER",
    );
  });

  it("reads everyone else's role from their membership", () => {
    expect(resolveWorkspaceRole("u2", { ownerId: "u1", members: [{ role: "EDITOR" }] })).toBe(
      "EDITOR",
    );

    expect(resolveWorkspaceRole("u2", { ownerId: "u1", members: [{ role: "VIEWER" }] })).toBe(
      "VIEWER",
    );

    expect(resolveWorkspaceRole("u2", { ownerId: "u1", members: [{ role: "OWNER" }] })).toBe(
      "OWNER",
    );
  });

  it("falls back to the least powerful role", () => {
    expect(resolveWorkspaceRole("u2", { ownerId: "u1", members: [] })).toBe("VIEWER");

    expect(resolveWorkspaceRole("u2", { ownerId: "u1", members: [{ role: "SUPERUSER" }] })).toBe(
      "VIEWER",
    );
  });
});

describe("ownerDisplayName", () => {
  it("trims a real name and replaces a blank one", () => {
    expect(ownerDisplayName("  Grace Hopper ")).toBe("Grace Hopper");

    expect(ownerDisplayName("   ")).toBe(UNKNOWN_OWNER_NAME);

    expect(ownerDisplayName("")).toBe(UNKNOWN_OWNER_NAME);

    expect(ownerDisplayName(null)).toBe(UNKNOWN_OWNER_NAME);

    expect(ownerDisplayName(undefined)).toBe(UNKNOWN_OWNER_NAME);
  });
});

describe("toSharedProjectAccess", () => {
  const workspace = {
    id: "w1",
    name: "Finance team",
    ownerId: "u1",
    members: [{ role: "EDITOR" }],
  };

  it("is null for a model that is not in a workspace", () => {
    expect(toSharedProjectAccess("u2", null, "Grace Hopper")).toBe(null);
  });

  it("names the workspace, the person's role and the owner of the model", () => {
    expect(toSharedProjectAccess("u2", workspace, "Grace Hopper")).toEqual({
      workspaceId: "w1",
      workspaceName: "Finance team",
      role: "EDITOR",
      ownerName: "Grace Hopper",
    });
  });

  it("uses a neutral name when the owner has none", () => {
    expect(toSharedProjectAccess("u2", workspace, "  ")?.ownerName).toBe(UNKNOWN_OWNER_NAME);
  });
});
