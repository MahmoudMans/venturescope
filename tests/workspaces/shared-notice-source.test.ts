import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layout = readFileSync("app/(app)/projects/[projectId]/layout.tsx", "utf8");

const access = readFileSync("lib/workspaces/shared-access.ts", "utf8");

describe("shared model access banner source", () => {
  it("explains the person's access only when they do not own the model", () => {
    expect(layout).toContain("isOwner ? null : await getSharedProjectAccess");

    expect(layout).toContain("describeSharedAccess(shared)");

    expect(layout).toContain("<StatusNotice");
  });

  it("reads the model owner's name and the person's own membership only", () => {
    expect(access).toContain("user: {");

    expect(access).toContain("name: true");

    expect(access).not.toContain("findMany");
  });
});
