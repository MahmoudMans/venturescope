import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const actions = read("app/(app)/workspaces/actions.ts");

const data = read("lib/workspaces/model-sharing-data.ts");

const card = read("components/workspaces/model-sharing-card.tsx");

const settingsPage = read("app/(app)/projects/[projectId]/settings/page.tsx");

const governance = read("components/settings/model-governance.tsx");

const layout = read("app/(app)/projects/[projectId]/layout.tsx");

const readme = read("README.md");

/**
 * The text without spaces, line breaks and trailing commas, so the checks do
 * not depend on how the code is laid out.
 */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

/** True when the squashed text contains the squashed piece. */
const has = (text: string, piece: string) => squash(text).includes(squash(piece));

/** The place of each marker in the squashed text, in the order they are given. */
function positions(text: string, markers: string[]): number[] {
  const body = squash(text);

  return markers.map((marker) => body.indexOf(squash(marker)));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

/** The text of one exported action, up to the start of the next one. */
function section(first: string, next: string): string {
  const start = actions.indexOf(`export async function ${first}`);

  const end = actions.indexOf(`export async function ${next}`);

  return start === -1 || end === -1 ? "" : actions.slice(start, end);
}

const assign = section("assignProjectToWorkspaceAction", "removeProjectFromWorkspaceAction");

const takeOut = section("removeProjectFromWorkspaceAction", "deleteWorkspaceAction");

describe("share and stop actions", () => {
  it("import the function that builds the path to go back to", () => {
    expect(
      has(actions, 'import { sharingReturnPath } from "@/lib/workspaces/model-sharing";'),
    ).toBe(true);
  });

  it("send a person who shares a model back to the page the form came from", () => {
    expect(
      has(
        assign,
        'redirect( sharingReturnPath({ from: formValue(formData, "from"), isModelOwner: true, projectId, workspaceId, status: "project-shared" }) )',
      ),
    ).toBe(true);
  });

  it("send a person who stops sharing back, and trust Settings only for the owner of the model", () => {
    expect(
      has(
        takeOut,
        'redirect( sharingReturnPath({ from: formValue(formData, "from"), isModelOwner: project.userId === user.id, projectId, workspaceId: project.workspaceId, status }) )',
      ),
    ).toBe(true);
  });

  it("refresh the model header on every page of the model", () => {
    for (const body of [assign, takeOut]) {
      expect(has(body, 'revalidatePath(`/projects/${projectId}`, "layout")')).toBe(true);
    }
  });

  it("read the form field only to compare it, and never use it as an address", () => {
    expect(squash(actions).split('formValue(formData,"from")').length - 1).toBe(2);

    expect(squash(actions).split('"from"').length - 1).toBe(2);

    expect(actions).not.toContain("returnTo");

    expect(actions).not.toContain("redirectTo");
  });

  it("keep the order: check first, then write, then go back", () => {
    expect(
      isIncreasing(
        positions(assign, [
          "prisma.project.findFirst(",
          "prisma.project.update(",
          "revalidatePath(",
          "sharingReturnPath(",
        ]),
      ),
    ).toBe(true);

    expect(
      isIncreasing(
        positions(takeOut, [
          "prisma.project.findFirst(",
          "prisma.project.update(",
          "revalidatePath(",
          "sharingReturnPath(",
        ]),
      ),
    ).toBe(true);
  });
});

describe("loader", () => {
  it("is cached for one request, because the header and the Settings page both ask", () => {
    expect(has(data, "export const loadModelWorkspace = cache(")).toBe(true);
  });

  it("reads the workspace of one model with a count and only the own membership", () => {
    expect(has(data, "prisma.project.findUnique({ where: { id: projectId },")).toBe(true);

    expect(
      has(
        data,
        "workspace: { select: { id: true, name: true, ownerId: true, _count: { select: { members: true } }, members: { where: { userId }, select: { id: true }, take: 1 } } }",
      ),
    ).toBe(true);
  });

  it("knows a person is inside when they own the workspace or have a membership", () => {
    expect(
      has(data, "personIsInside: workspace.ownerId === userId || workspace.members.length > 0"),
    ).toBe(true);

    expect(has(data, "memberCount: workspace._count.members")).toBe(true);
  });

  it("offers the workspaces that the person owns and the ones where they edit", () => {
    expect(
      has(
        data,
        'OR: [{ ownerId: userId }, { members: { some: { userId, role: { in: ["EDITOR", "OWNER"] } } } }]',
      ),
    ).toBe(true);

    expect(has(data, 'orderBy: { name: "asc" }, take: 100, })')).toBe(true);

    expect(data).not.toContain('"VIEWER"');
  });

  it("looks for workspaces only when the model is private", () => {
    expect(has(data, "workspace === null ? await loadShareTargets(userId) : []")).toBe(true);
  });

  it("only reads", () => {
    for (const write of ["create", "update", "delete", "upsert"]) {
      expect(data, write).not.toContain(`.${write}(`);

      expect(data, write).not.toContain(`.${write}Many(`);
    }
  });
});

describe("Sharing card", () => {
  it("uses the two actions of the workspace page", () => {
    expect(
      has(
        card,
        'import { assignProjectToWorkspaceAction, removeProjectFromWorkspaceAction, } from "@/app/(app)/workspaces/actions";',
      ),
    ).toBe(true);
  });

  it("shares with the workspace that was chosen, and says that it comes from Settings", () => {
    expect(has(card, "<form action={assignProjectToWorkspaceAction}")).toBe(true);

    expect(has(card, '<input type="hidden" name="projectId" value={projectId} />')).toBe(true);

    expect(has(card, '<input type="hidden" name="from" value="settings" />')).toBe(true);

    expect(has(card, '<NativeSelect id="share-workspace" required name="workspaceId">')).toBe(true);
  });

  it("stops sharing behind a question, and says that Settings is where to come back to", () => {
    expect(
      has(
        card,
        '<ConfirmAction action={removeProjectFromWorkspaceAction} fields={{ projectId, from: "settings" }} title="Stop sharing this model?"',
      ),
    ).toBe(true);

    expect(card).toContain("the model itself is not deleted");
  });

  it("opens the workspace page only for a person who is inside the workspace", () => {
    const order = positions(card, [
      "{sharing.canOpenWorkspace ? (",
      "<Link href={`/workspaces/${sharing.workspaceId}`}>Open workspace</Link>",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("tells a person who left the workspace, and only that person", () => {
    const order = positions(card, [
      "{sharing.canOpenWorkspace ? null : (",
      "You are not a collaborator of this workspace anymore.",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("shows the form only when there is a workspace to share with", () => {
    const order = positions(card, [
      "{sharing.targets.length > 0 ? (",
      "<form action={assignProjectToWorkspaceAction}",
      "You do not have a workspace where you can share models.",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("has a way forward for a person who has no workspace to share with", () => {
    expect(card).toContain("You do not have a workspace where you can share models.");

    expect(has(card, '<Link href="/workspaces">Open workspaces</Link>')).toBe(true);
  });

  it("says what is private and what editors and viewers can do", () => {
    expect(card).toContain("Only you can open this model.");

    expect(card).toContain("Editors can work on actuals, scorecards, approvals and reviews.");

    expect(card).toContain("Viewers can only look.");
  });
});

describe("Settings page", () => {
  it("knows the owner of the model by the user id of the model", () => {
    expect(has(settingsPage, "const isOwner = project.userId === user.id;")).toBe(true);
  });

  it("loads the sharing only for the owner, and shows the card only to the owner", () => {
    expect(
      has(
        settingsPage,
        "const sharing = isOwner ? await loadModelSharing( user.id, project.id, ) : null;",
      ),
    ).toBe(true);

    expect(has(settingsPage, "{isOwner && sharing !== null ? ( <ModelSharingCard")).toBe(true);
  });

  it("names the owner of the model, and asks for the access of a collaborator only", () => {
    expect(has(settingsPage, "{settingsOwnerMessage( shared?.ownerName, )}")).toBe(true);

    expect(
      has(
        settingsPage,
        "const shared = isOwner ? null : await getSharedProjectAccess( user.id, project.id, );",
      ),
    ).toBe(true);
  });

  it("shows the edit form to the owner and a read-only list to everyone else", () => {
    const order = positions(settingsPage, [
      "{isOwner ? ( <ProjectSettingsForm",
      ") : ( <Card",
      "settingsOwnerMessage(",
      'label="Revenue mode"',
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("hides the reset and clear buttons from everyone except the owner", () => {
    expect(has(settingsPage, "<ModelGovernance canChange={isOwner}")).toBe(true);
  });

  it("tells the truth about who can open the model", () => {
    expect(settingsPage).not.toContain("Private to authenticated owner");

    expect(has(settingsPage, 'label="Project ownership" value={ ownership }')).toBe(true);

    expect(
      has(
        settingsPage,
        "describeOwnership({ isOwner, workspaceName: isOwner ? sharedIn : (shared?.workspaceName ?? null), ownerName: shared?.ownerName, })",
      ),
    ).toBe(true);
  });

  it("shows the notice that the share and stop forms send back", () => {
    expect(has(settingsPage, "getWorkspaceNotice( status, )")).toBe(true);

    expect(has(settingsPage, "<StatusNotice tone={notice.tone}>")).toBe(true);

    expect(has(settingsPage, "searchParams: Promise<{ status?: string | string[]; }>;")).toBe(true);
  });

  it("keeps the backup download for everyone who can open the model", () => {
    expect(settingsPage).toContain("/export/json");

    expect(settingsPage).toContain("Download backup");
  });
});

describe("governance component", () => {
  const start = governance.indexOf("export function ModelGovernance");

  const body = governance.slice(start);

  it("is shown by default and hidden when the person cannot change the model", () => {
    expect(has(body, "projectId, canChange = true, }: { projectId: string;")).toBe(true);

    expect(has(body, "canChange?: boolean;")).toBe(true);
  });

  it("returns nothing after its hooks and before it draws anything", () => {
    const order = positions(body, [
      "useState<DestructiveAction | null>(",
      "if (canChange === false) { return null; }",
      "return (",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });
});

describe("model header", () => {
  it("asks for the workspace of the model only when the person owns the model", () => {
    expect(
      has(
        layout,
        "const ownerSharing = isOwner ? await loadModelWorkspace(user.id, project.id) : null;",
      ),
    ).toBe(true);

    expect(
      has(layout, 'import { loadModelWorkspace } from "@/lib/workspaces/model-sharing-data";'),
    ).toBe(true);
  });

  it("shows where the model is shared, with a link only for a person who is inside", () => {
    const order = positions(layout, [
      "{ownerSharing ? (",
      "{ownerSharing.personIsInside ? (",
      "href={`/workspaces/${ownerSharing.id}`}",
      "{ownerSharing.name}",
    ]);

    expect(isIncreasing(order)).toBe(true);

    expect((layout.match(/Shared in/g) ?? []).length).toBe(2);
  });

  it("still shows the chip to collaborators from the same place as before", () => {
    expect(layout).toContain("getSharedProjectAccess(user.id, project.id)");

    expect(layout).toContain("workspaceRoleLabel(shared.role)");
  });
});

describe("README", () => {
  it("has a section about sharing from the model", () => {
    const start = readme.indexOf("## Share a model from the model itself");

    expect(start).toBeGreaterThan(-1);

    const next = readme.indexOf("\n## ", start + 1);

    expect(next).toBeGreaterThan(start);

    const text = readme.slice(start, next).replace(/\s+/g, " ");

    expect(text).toContain("**Stop sharing**");

    expect(text).toContain("Nothing is deleted");

    expect(text).toContain("read-only");

    expect(text).toContain("fixed path");
  });
});
