import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getWorkspaceNotice } from "@/lib/workspaces/labels";

const read = (path: string) => readFileSync(path, "utf8");

const actions = read("app/(app)/workspaces/actions.ts");

const workspacePage = read("app/(app)/workspaces/[workspaceId]/page.tsx");

const readme = read("README.md");

/**
 * The text without spaces, line breaks and trailing commas, so the checks do
 * not depend on how the code is laid out.
 */
const squash = (text: string) => text.replace(/\s+/g, "").replace(/,([)}\]])/g, "$1");

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

const invite = section("inviteWorkspaceMemberAction", "acceptWorkspaceInvitationAction");

const removeMember = section("removeWorkspaceMemberAction", "revokeWorkspaceInvitationAction");

const assign = section("assignProjectToWorkspaceAction", "removeProjectFromWorkspaceAction");

const takeOut = section("removeProjectFromWorkspaceAction", "deleteWorkspaceAction");

describe("invite action", () => {
  it("stops an invitation to someone who already joined, before it creates a link", () => {
    const order = positions(invite, [
      "?status=self-invite",
      "prisma.workspaceMember.findFirst(",
      "?status=already-member",
      "createInvitationLink(",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("refuses only when the person was found", () => {
    expect(squash(invite)).toContain(
      squash(
        "if (alreadyMember) { redirect(`/workspaces/${workspaceId}?status=already-member`); }",
      ),
    );
  });

  it("looks only at the collaborators of this workspace, by email address", () => {
    expect(squash(invite)).toContain(
      squash("prisma.workspaceMember.findFirst({ where: { workspaceId, user: { email } }"),
    );
  });
});

describe("remove collaborator action", () => {
  it("checks the owner first, then finds the person, then changes the data", () => {
    const order = positions(removeMember, [
      'await requireWorkspacePermission(workspaceId, user.id, "OWNER")',
      "prisma.workspaceMember.findFirst(",
      "prisma.$transaction([",
      "prisma.project.updateMany(",
      "prisma.workspaceMember.deleteMany(",
      'revalidatePath("/workspaces")',
      "revalidatePath(`/workspaces/${workspaceId}`)",
      "memberRemovedStatus(released.count)",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("finds a collaborator of this workspace only, never the owner who clicks", () => {
    const text = squash(removeMember);

    expect(text).toContain(
      squash("where: { id: memberId, workspaceId, userId: { not: user.id } }"),
    );

    expect(text).toContain(squash("select: { id: true, userId: true }"));
  });

  it("goes back to the page without a change when the collaborator is not found", () => {
    expect(squash(removeMember)).toContain(
      squash(
        "if (member === null) { redirect(`/workspaces/${workspaceId}?status=member-removed`); }",
      ),
    );
  });

  it("makes the models of that person in this workspace private again", () => {
    expect(squash(removeMember)).toContain(
      squash(
        "prisma.project.updateMany({ where: { workspaceId, userId: member.userId }, data: { workspaceId: null } })",
      ),
    );
  });

  it("ends the membership that was found, in the same transaction", () => {
    const text = squash(removeMember);

    expect(text).toContain(
      squash("prisma.workspaceMember.deleteMany({ where: { id: member.id, workspaceId } })"),
    );

    expect(text).toContain(squash("const [released] = await prisma.$transaction(["));

    expect(text).not.toContain("id:memberId}");
  });

  it("never deletes a model", () => {
    expect(removeMember).not.toContain("project.delete");

    expect(removeMember).not.toContain("deleteMany({ where: { workspaceId");
  });
});

describe("take a model out action", () => {
  it("lets the owner of the model and the owner of the workspace do it", () => {
    expect(squash(takeOut)).toContain(
      squash(
        "OR: [{ userId: user.id }, { workspace: { is: { ownerId: user.id } } }], }, select: { workspaceId: true, userId: true }",
      ),
    );
  });

  it("does not let an ordinary collaborator do it", () => {
    expect(takeOut).not.toContain("members");

    expect(takeOut).not.toContain("some:");
  });

  it("refuses first, then writes, then tells who did it", () => {
    const order = positions(takeOut, [
      "prisma.project.findFirst(",
      'redirect("/workspaces?status=project-not-owned")',
      "prisma.project.update(",
      'revalidatePath("/workspaces")',
      "projectRemovedStatus(user.id, project.userId)",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("goes back with the workspace that the model was in, and the code that tells who did it", () => {
    expect(squash(takeOut)).toContain(squash("workspaceId: project.workspaceId, status, })"));
  });

  it("only makes the model private again and never deletes it", () => {
    expect(squash(takeOut)).toContain(
      squash("prisma.project.update({ where: { id: projectId }, data: { workspaceId: null } })"),
    );

    expect(takeOut).not.toContain(".delete(");
  });
});

describe("share action", () => {
  it("is still only for the owner of the model, with Editor permission", () => {
    expect(squash(assign)).toContain(squash("userId: user.id"));

    expect(squash(assign)).toContain(
      squash('requireWorkspacePermission( workspaceId, user.id, "EDITOR" )'),
    );

    expect(assign).not.toContain("OR:");
  });
});

describe("status codes", () => {
  it("all have a message", () => {
    const codes = Array.from(
      actions.matchAll(/\/workspaces(?:\/\$\{[^}]+\})?\?status=([a-z-]+)/g),
      (match) => match[1],
    );

    expect(codes.length).toBeGreaterThan(9);

    for (const code of codes) {
      expect(getWorkspaceNotice(code), code).not.toBe(null);
    }
  });
});

describe("workspace page", () => {
  it("uses the three helpers", () => {
    expect(workspacePage).toContain(
      'import { canUnshareModel, joinedLabel, sharedByLabel } from "@/lib/workspaces/people";',
    );
  });

  it("asks for the name and the email address of the person who shared each model", () => {
    expect(squash(workspacePage)).toContain(
      squash(
        'userId: true, user: { select: { email: true, name: true } } }, orderBy: { updatedAt: "desc" }',
      ),
    );
  });

  it("decides who sees Remove with the owner of the workspace and the owner of the model", () => {
    expect(squash(workspacePage)).toContain(
      squash(
        "canUnshareModel({ userId: user.id, modelOwnerId: project.userId, workspaceOwnerId: workspace.owner.id })",
      ),
    );

    const order = positions(workspacePage, [
      "{canTakeOut ? (",
      "action={removeProjectFromWorkspaceAction}",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("marks only your own models with Yours, and names the person for the others", () => {
    expect(squash(workspacePage)).toContain(
      squash('{isMine ? <Badge variant="secondary">Yours</Badge> : null}'),
    );

    const order = positions(workspacePage, ["{isMine ? null : (", "sharedByLabel(project.user)"]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("knows a model is yours when you are the person who owns it", () => {
    expect(squash(workspacePage)).toContain(squash("const isMine = project.userId === user.id;"));
  });

  it("shows the short text for your own model and the long text for the model of someone else", () => {
    const order = positions(workspacePage, [
      "description={ isMine ? `${project.name} becomes private again. Collaborators",
      "later.` : `${project.name} becomes private again for the person who owns it.",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("tells everyone who may take a model out", () => {
    const text = workspacePage.replace(/\s+/g, " ");

    expect(text).toContain("The person who owns a model can add or remove it.");

    expect(text).toContain("The owner of the workspace can also take any model out.");
  });

  it("explains in the dialog that another person's model is not deleted", () => {
    const text = workspacePage.replace(/\s+/g, " ");

    expect(text).toContain("becomes private again for the person who owns it");

    expect(text).toContain("Its owner can share it again later");
  });

  it("shows the day that each collaborator joined, with a plain ASCII source", () => {
    expect(workspacePage).toContain("joinedLabel(member.createdAt)");

    expect(workspacePage).toContain("\\u00b7");

    expect(workspacePage).not.toContain("ownerId:");
  });

  it("tells the owner what happens to the models of a removed collaborator", () => {
    const text = workspacePage.replace(/\s+/g, " ");

    expect(text).toContain("The models they shared become private again");

    expect(text).toContain("You can invite them again later");

    expect(text).not.toContain("They lose access to every model shared");
  });
});

describe("README", () => {
  it("has a section about people and shared models", () => {
    const start = readme.indexOf("## People and shared models in a workspace");

    expect(start).toBeGreaterThan(-1);

    const next = readme.indexOf("\n## ", start + 1);

    expect(next).toBeGreaterThan(start);

    const text = readme.slice(start, next).replace(/\s+/g, " ");

    expect(text).toContain("become private again");

    expect(text).toContain("same database transaction");

    expect(text).toContain("never deleted");

    expect(text).toContain("UTC");
  });
});
