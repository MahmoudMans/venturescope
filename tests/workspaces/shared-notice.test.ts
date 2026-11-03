import { describe, expect, it } from "vitest";

import { describeSharedAccess } from "@/lib/workspaces/shared-notice";

const base = { ownerName: "Grace Hopper", workspaceName: "Finance team" };

describe("describeSharedAccess", () => {
  it("tells a viewer the model is read-only", () => {
    const notice = describeSharedAccess({ ...base, role: "VIEWER" });

    expect(notice.title).toBe("View-only access");

    expect(notice.message).toContain("cannot change anything");

    expect(notice.message).toContain("Grace Hopper");

    expect(notice.message).toContain("Finance team");
  });

  it("tells an editor what they can do and what stays with the owner", () => {
    const notice = describeSharedAccess({ ...base, role: "EDITOR" });

    expect(notice.title).toBe("Editor access");

    expect(notice.message).toContain("actuals");

    expect(notice.message).toContain("Only Grace Hopper can change the model inputs");

    expect(notice.message).toContain("assumptions");
  });

  it("tells a workspace owner that the model still belongs to its author", () => {
    const notice = describeSharedAccess({ ...base, role: "OWNER" });

    expect(notice.title).toBe("Workspace owner access");

    expect(notice.message).toContain("belongs to Grace Hopper");

    expect(notice.message).toContain("only Grace Hopper can change its inputs");
  });

  it("gives every role its own title", () => {
    const titles = (["OWNER", "EDITOR", "VIEWER"] as const).map(
      (role) => describeSharedAccess({ ...base, role }).title,
    );

    expect(new Set(titles).size).toBe(3);
  });
});
