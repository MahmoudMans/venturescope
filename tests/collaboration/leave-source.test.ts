import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const leave = readFileSync("app/(app)/workspaces/leave-action.ts", "utf8");

describe("leave workspace source", () => {
  it("only acts on the signed-in person's own membership", () => {
    expect(leave).toContain("requireCurrentUserIdentity");

    expect(leave).toContain("userId: user.id");

    expect(leave).toContain("prisma.workspaceMember.findFirst");
  });

  it("never touches the owner or other collaborators", () => {
    expect(leave).not.toContain("ownerId");

    expect(leave).not.toContain("deleteMany");

    expect(leave).not.toContain("workspace.delete");
  });

  it("returns the leaving person's shared models to private", () => {
    expect(leave).toContain("prisma.project.updateMany");

    expect(leave).toContain("workspaceId: null");
  });
});
