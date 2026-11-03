import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";
import {
  buildShareTargets,
  countOtherPeople,
  describeModelSharing,
  describeOthers,
  describeOwnership,
  settingsOwnerMessage,
  sharingReturnPath,
} from "@/lib/workspaces/model-sharing";
import { UNKNOWN_OWNER_NAME } from "@/lib/workspaces/shared-role";

describe("buildShareTargets", () => {
  it("sorts by name without caring about capital letters", () => {
    const targets = buildShareTargets([
      { id: "c", name: "zeta team" },
      { id: "a", name: "Alpha" },
      { id: "b", name: "beta" },
    ]);

    expect(targets.map((target) => target.name)).toEqual(["Alpha", "beta", "zeta team"]);
  });

  it("keeps one entry for a workspace that is listed twice", () => {
    const targets = buildShareTargets([
      { id: "a", name: "Alpha" },
      { id: "a", name: "Alpha" },
      { id: "b", name: "Beta" },
    ]);

    expect(targets.map((target) => target.id)).toEqual(["a", "b"]);
  });

  it("puts workspaces with the same name in a fixed order and keeps only id and name", () => {
    const targets = buildShareTargets([
      { id: "z", name: "Same", extra: 1 } as { id: string; name: string },
      { id: "m", name: "Same" },
    ]);

    expect(targets).toEqual([
      { id: "m", name: "Same" },
      { id: "z", name: "Same" },
    ]);
  });

  it("treats names that differ only in capital letters as the same name, and then uses the id", () => {
    const targets = buildShareTargets([
      { id: "z", name: "alpha" },
      { id: "a", name: "Alpha" },
    ]);

    expect(targets.map((target) => target.id)).toEqual(["a", "z"]);
  });

  it("does not change the list it was given", () => {
    const input = [
      { id: "b", name: "Beta" },
      { id: "a", name: "Alpha" },
    ];

    buildShareTargets(input);

    expect(input.map((target) => target.id)).toEqual(["b", "a"]);
  });

  it("returns an empty list for an empty list", () => {
    expect(buildShareTargets([])).toEqual([]);
  });
});

describe("countOtherPeople", () => {
  it("does not count the owner of the model twice when they are in the workspace", () => {
    expect(countOtherPeople({ id: "w", name: "W", memberCount: 3, personIsInside: true })).toBe(3);

    expect(countOtherPeople({ id: "w", name: "W", memberCount: 0, personIsInside: true })).toBe(0);
  });

  it("counts the owner of the workspace when the owner of the model left", () => {
    expect(countOtherPeople({ id: "w", name: "W", memberCount: 3, personIsInside: false })).toBe(4);

    expect(countOtherPeople({ id: "w", name: "W", memberCount: 0, personIsInside: false })).toBe(1);
  });
});

describe("describeOthers", () => {
  it("says that nobody else can open the model", () => {
    expect(describeOthers(0)).toBe(
      "Nobody else has joined this workspace, so only you can open this model.",
    );
  });

  it("uses the singular for one person and the plural for more", () => {
    expect(describeOthers(1)).toBe("1 other person can open this model.");

    expect(describeOthers(2)).toBe("2 other people can open this model.");

    expect(describeOthers(14)).toBe("14 other people can open this model.");
  });
});

describe("describeModelSharing", () => {
  const targets = [
    { id: "b", name: "Beta" },
    { id: "a", name: "Alpha" },
  ];

  it("describes a private model with the sorted list of workspaces to share with", () => {
    expect(describeModelSharing({ workspace: null, targets })).toEqual({
      kind: "private",
      targets: [
        { id: "a", name: "Alpha" },
        { id: "b", name: "Beta" },
      ],
    });
  });

  it("describes a shared model and ignores the list of workspaces", () => {
    expect(
      describeModelSharing({
        workspace: { id: "w1", name: "Finance", memberCount: 2, personIsInside: true },
        targets,
      }),
    ).toEqual({
      kind: "shared",
      workspaceId: "w1",
      workspaceName: "Finance",
      others: 2,
      summary: "2 other people can open this model.",
      canOpenWorkspace: true,
    });
  });

  it("does not offer the workspace page to an owner who is no longer inside", () => {
    const view = describeModelSharing({
      workspace: { id: "w1", name: "Finance", memberCount: 0, personIsInside: false },
      targets: [],
    });

    expect(view).toEqual({
      kind: "shared",
      workspaceId: "w1",
      workspaceName: "Finance",
      others: 1,
      summary: "1 other person can open this model.",
      canOpenWorkspace: false,
    });
  });

  it("says that nobody else joined a workspace with no collaborators", () => {
    const view = describeModelSharing({
      workspace: { id: "w1", name: "Solo", memberCount: 0, personIsInside: true },
      targets: [],
    });

    expect(view.kind === "shared" ? view.summary : "").toContain("only you can open this model");
  });
});

describe("describeOwnership", () => {
  it("tells the owner of a private model that it is private", () => {
    expect(describeOwnership({ isOwner: true, workspaceName: null, ownerName: "Amira" })).toBe(
      "Private to you",
    );
  });

  it("tells the owner where the model is shared", () => {
    expect(describeOwnership({ isOwner: true, workspaceName: "Finance", ownerName: "Amira" })).toBe(
      "Yours, shared in Finance",
    );
  });

  it("tells a collaborator who owns the model and where it is shared", () => {
    expect(
      describeOwnership({ isOwner: false, workspaceName: "Finance", ownerName: "Karim" }),
    ).toBe("Owned by Karim, shared in Finance");
  });

  it("uses a neutral name when the owner has no name", () => {
    expect(describeOwnership({ isOwner: false, workspaceName: "Finance", ownerName: null })).toBe(
      `Owned by ${UNKNOWN_OWNER_NAME}, shared in Finance`,
    );

    expect(describeOwnership({ isOwner: false, workspaceName: "Finance", ownerName: "  " })).toBe(
      `Owned by ${UNKNOWN_OWNER_NAME}, shared in Finance`,
    );
  });

  it("never says private for a model that is shared", () => {
    for (const isOwner of [true, false]) {
      expect(
        describeOwnership({ isOwner, workspaceName: "Finance", ownerName: "Karim" }).toLowerCase(),
      ).not.toContain("private");
    }
  });
});

describe("settingsOwnerMessage", () => {
  it("names the person who can change the settings", () => {
    expect(settingsOwnerMessage("Karim")).toBe(
      "Karim owns this model and is the only person who can change these settings.",
    );
  });

  it("uses a neutral name when there is none", () => {
    expect(settingsOwnerMessage(undefined)).toBe(
      `${UNKNOWN_OWNER_NAME} owns this model and is the only person who can change these settings.`,
    );
  });
});

describe("sharingReturnPath", () => {
  const base = {
    isModelOwner: true,
    projectId: "p1",
    workspaceId: "w1",
    status: "project-shared",
  };

  it("goes back to the Settings page when the form came from there", () => {
    expect(sharingReturnPath({ ...base, from: "settings" })).toBe(
      "/projects/p1/settings?status=project-shared",
    );
  });

  it("goes to the workspace for every other form", () => {
    expect(sharingReturnPath({ ...base, from: "" })).toBe("/workspaces/w1?status=project-shared");
  });

  it("does not trust any other value, so it cannot become a link to another site", () => {
    for (const from of [
      "Settings",
      " settings",
      "settings ",
      "https://example.com",
      "//example.com",
      "/projects/p2/settings",
      "../..",
    ]) {
      expect(sharingReturnPath({ ...base, from })).toBe("/workspaces/w1?status=project-shared");
    }
  });

  it("sends a person who does not own the model to the workspace, not to the Settings page", () => {
    expect(sharingReturnPath({ ...base, from: "settings", isModelOwner: false })).toBe(
      "/workspaces/w1?status=project-shared",
    );
  });

  it("goes to the list of workspaces when the model was in no workspace", () => {
    expect(
      sharingReturnPath({ ...base, from: "", workspaceId: null, status: "project-removed" }),
    ).toBe("/workspaces?status=project-removed");

    expect(
      sharingReturnPath({
        ...base,
        from: "",
        workspaceId: null,
        status: "project-removed",
        isModelOwner: false,
      }),
    ).toBe("/workspaces?status=project-removed");
  });

  it("keeps the Settings page for the owner even when the workspace is not known", () => {
    expect(
      sharingReturnPath({
        ...base,
        from: "settings",
        workspaceId: null,
        status: "project-removed",
      }),
    ).toBe("/projects/p1/settings?status=project-removed");
  });
});

describe("Help", () => {
  const items = HELP_GROUPS.flatMap((group) => group.items);

  const item = items.find((candidate) => candidate.id === "share-model");

  it("explains how to share a model and how to stop", () => {
    expect(item?.question).toContain("share one of my models");

    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("Open the model, then Settings, and use the Sharing card");

    expect(text).toContain("Share model");

    expect(text).toContain("Stop sharing");

    expect(text).toContain("nothing is deleted");
  });

  it("says that the Settings page is read-only for everyone except the owner of the model", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("read-only for everyone else");
  });
});
