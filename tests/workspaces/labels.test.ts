import { describe, expect, it } from "vitest";

import {
  formatCount,
  formatInvitationExpiry,
  getInvitationNotice,
  getWorkspaceNotice,
  workspaceRoleDescription,
  workspaceRoleLabel,
} from "@/lib/workspaces/labels";

describe("workspace labels", () => {
  it("uses the singular for exactly one", () => {
    expect(formatCount(1, "project")).toBe("1 project");

    expect(formatCount(0, "project")).toBe("0 projects");

    expect(formatCount(3, "collaborator")).toBe("3 collaborators");

    expect(formatCount(2, "person", "people")).toBe("2 people");
  });

  it("names every role and falls back to the least powerful one", () => {
    expect(workspaceRoleLabel("OWNER")).toBe("Owner");

    expect(workspaceRoleLabel("EDITOR")).toBe("Editor");

    expect(workspaceRoleLabel("VIEWER")).toBe("Viewer");

    expect(workspaceRoleLabel("anything else")).toBe("Viewer");
  });

  it("explains every error code the workspace actions redirect with", () => {
    for (const code of [
      "invalid-name",
      "invalid-email",
      "self-invite",
      "project-not-owned",
      "not-a-member",
    ]) {
      expect(getWorkspaceNotice(code)?.tone, code).toBe("error");
    }
  });

  it("confirms every successful workspace action", () => {
    for (const code of [
      "workspace-created",
      "joined",
      "role-updated",
      "member-removed",
      "invitation-revoked",
      "project-shared",
      "project-removed",
      "workspace-deleted",
      "workspace-left",
    ]) {
      expect(getWorkspaceNotice(code)?.tone, code).toBe("success");
    }
  });

  it("ignores missing, repeated and unknown codes", () => {
    expect(getWorkspaceNotice(undefined)).toBe(null);

    expect(getWorkspaceNotice(["invalid-name"])).toBe(null);

    expect(getWorkspaceNotice("nope")).toBe(null);

    expect(getWorkspaceNotice("constructor")).toBe(null);
  });

  it("explains a failed invitation only for the code the accept action sends", () => {
    expect(getInvitationNotice("invalid")?.tone).toBe("error");

    expect(getInvitationNotice(undefined)).toBe(null);

    expect(getInvitationNotice(["invalid"])).toBe(null);

    expect(getInvitationNotice("other")).toBe(null);
  });

  it("formats an invitation expiry in UTC", () => {
    expect(formatInvitationExpiry(new Date("2026-10-23T10:00:00Z"))).toBe("Oct 23, 2026");

    expect(formatInvitationExpiry(new Date("2026-12-31T23:59:59Z"))).toBe("Dec 31, 2026");
  });

  it("describes what each role may do and falls back to the least powerful one", () => {
    expect(workspaceRoleDescription("OWNER")).toContain("delete the workspace");

    expect(workspaceRoleDescription("EDITOR")).toContain("actuals");

    expect(workspaceRoleDescription("EDITOR")).toContain("owner changes");

    expect(workspaceRoleDescription("VIEWER")).toContain("cannot change");

    expect(workspaceRoleDescription("anything else")).toBe(workspaceRoleDescription("VIEWER"));
  });
});
