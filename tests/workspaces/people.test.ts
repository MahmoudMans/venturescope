import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";
import { getWorkspaceNotice, workspaceRoleDescription } from "@/lib/workspaces/labels";
import {
  canUnshareModel,
  joinedLabel,
  memberRemovedStatus,
  projectRemovedStatus,
  sharedByLabel,
} from "@/lib/workspaces/people";

describe("canUnshareModel", () => {
  it("lets the person who owns the model take it out", () => {
    expect(
      canUnshareModel({ userId: "karim", modelOwnerId: "karim", workspaceOwnerId: "sara" }),
    ).toBe(true);
  });

  it("lets the owner of the workspace take out a model of someone else", () => {
    expect(
      canUnshareModel({ userId: "sara", modelOwnerId: "karim", workspaceOwnerId: "sara" }),
    ).toBe(true);
  });

  it("does not let another collaborator take it out", () => {
    expect(
      canUnshareModel({ userId: "lina", modelOwnerId: "karim", workspaceOwnerId: "sara" }),
    ).toBe(false);
  });

  it("is true when the owner of the workspace also owns the model", () => {
    expect(
      canUnshareModel({ userId: "sara", modelOwnerId: "sara", workspaceOwnerId: "sara" }),
    ).toBe(true);
  });
});

describe("sharedByLabel", () => {
  it("uses the name when the person has one", () => {
    expect(sharedByLabel({ name: "Karim Ben Ali", email: "karim@example.com" })).toBe(
      "Shared by Karim Ben Ali",
    );
  });

  it("removes the spaces around the name", () => {
    expect(sharedByLabel({ name: "  Karim  ", email: "karim@example.com" })).toBe(
      "Shared by Karim",
    );
  });

  it("uses the email address when there is no name", () => {
    expect(sharedByLabel({ name: null, email: "karim@example.com" })).toBe(
      "Shared by karim@example.com",
    );
  });

  it("uses the email address when the name is only spaces", () => {
    expect(sharedByLabel({ name: "   ", email: "karim@example.com" })).toBe(
      "Shared by karim@example.com",
    );
  });
});

describe("joinedLabel", () => {
  it("shows the day in the same short form as the invitation dates", () => {
    expect(joinedLabel(new Date("2026-10-17T10:00:00Z"))).toBe("Joined Oct 17, 2026");
  });

  it("always uses the UTC day", () => {
    expect(joinedLabel(new Date("2026-10-17T23:59:59Z"))).toBe("Joined Oct 17, 2026");

    expect(joinedLabel(new Date("2026-10-18T00:00:00Z"))).toBe("Joined Oct 18, 2026");
  });
});

describe("memberRemovedStatus", () => {
  it("says that models became private only when there were some", () => {
    expect(memberRemovedStatus(0)).toBe("member-removed");

    expect(memberRemovedStatus(1)).toBe("member-removed-with-models");

    expect(memberRemovedStatus(12)).toBe("member-removed-with-models");
  });
});

describe("projectRemovedStatus", () => {
  it("tells the owner of the model and the owner of the workspace apart", () => {
    expect(projectRemovedStatus("karim", "karim")).toBe("project-removed");

    expect(projectRemovedStatus("sara", "karim")).toBe("project-removed-by-owner");
  });
});

describe("notices", () => {
  const codes = [
    "already-member",
    "member-removed",
    "member-removed-with-models",
    "project-removed",
    "project-removed-by-owner",
    "project-not-owned",
  ];

  it("exist for every code that the helpers and the actions can send", () => {
    for (const code of codes) {
      expect(getWorkspaceNotice(code)?.message, code).toContain(".");
    }

    for (const code of [memberRemovedStatus(0), memberRemovedStatus(3)]) {
      expect(getWorkspaceNotice(code)?.tone, code).toBe("success");
    }

    for (const code of [projectRemovedStatus("a", "a"), projectRemovedStatus("a", "b")]) {
      expect(getWorkspaceNotice(code)?.tone, code).toBe("success");
    }
  });

  it("show an error for an invitation to someone who already joined", () => {
    expect(getWorkspaceNotice("already-member")?.tone).toBe("error");

    expect(getWorkspaceNotice("already-member")?.message).toContain("Change their role");
  });

  it("say that no model was deleted", () => {
    expect(getWorkspaceNotice("member-removed-with-models")?.message).toContain("private again");

    expect(getWorkspaceNotice("member-removed-with-models")?.message).toContain("none of them");

    expect(getWorkspaceNotice("project-removed-by-owner")?.message).toContain("private again");

    expect(getWorkspaceNotice("project-removed-by-owner")?.message).toContain("not deleted");
  });

  it("tell a collaborator that only the owner of the workspace can take out another model", () => {
    expect(getWorkspaceNotice("project-not-owned")?.message).toContain("your own models");

    expect(getWorkspaceNotice("project-not-owned")?.message).toContain(
      "Only the owner of a workspace",
    );
  });
});

describe("owner role description", () => {
  it("lists what the owner can do", () => {
    const text = workspaceRoleDescription("OWNER");

    expect(text).toContain("take any model out of the workspace");

    expect(text).toContain("rename the workspace");

    expect(text).toContain("give it to another collaborator");

    expect(text).toContain("delete the workspace");
  });
});

describe("Help", () => {
  const items = HELP_GROUPS.flatMap((group) => group.items);

  const item = items.find((candidate) => candidate.id === "remove-collaborator");

  it("explains how to remove a person and how to take a model out", () => {
    expect(item?.question).toContain("remove someone");

    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("Collaborators list");

    expect(text).toContain("become private again");

    expect(text).toContain("No model is deleted");

    expect(text).toContain("Projects list");
  });

  it("tells the owner who is already a collaborator to change the role", () => {
    const invitations = items.find((candidate) => candidate.id === "invitations");

    expect((invitations?.answer ?? []).join(" ")).toContain("already a collaborator");
  });
});
