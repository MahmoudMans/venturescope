import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";
import { getWorkspaceNotice } from "@/lib/workspaces/labels";

const read = (path: string) => readFileSync(path, "utf8");

const renewAction = read("app/(app)/workspaces/invitation-actions.ts");

const links = read("lib/workspaces/invitation-links.ts");

const actions = read("app/(app)/workspaces/actions.ts");

const workspacePage = read("app/(app)/workspaces/[workspaceId]/page.tsx");

const invitePage = read("app/(app)/invite/[token]/page.tsx");

const inviteNotFound = read("app/(app)/invite/[token]/not-found.tsx");

const confirmAction = read("components/workspaces/confirm-action.tsx");

const readme = read("README.md");

/** The text without spaces, line breaks and trailing commas, so the layout does not matter. */
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

const accept = section("acceptWorkspaceInvitationAction", "updateWorkspaceMemberRoleAction");

describe("renew action", () => {
  it("is a server action and exports only async functions", () => {
    expect(renewAction.startsWith('"use server";')).toBe(true);

    const exports = renewAction.match(/^export .*/gm) ?? [];

    expect(exports).toEqual([
      "export async function renewWorkspaceInvitationAction(formData: FormData): Promise<void> {",
    ]);
  });

  it("checks the owner before it reads or changes any invitation", () => {
    const order = positions(renewAction, [
      "await requireCurrentUserIdentity()",
      'await requireWorkspacePermission(workspaceId, user.id, "OWNER")',
      "prisma.workspaceInvitation.findFirst(",
      "?status=invitation-missing",
      "prisma.workspaceMember.findFirst(",
      "?status=already-member",
      "await createInvitationLink(",
      "revalidatePath(`/workspaces/${workspaceId}`)",
      "?invite=${encodeURIComponent(token)}",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("finds only an unused invitation of this workspace", () => {
    expect(squash(renewAction)).toContain(
      squash("findFirst({ where: { id: invitationId, workspaceId, acceptedAt: null }"),
    );
  });

  it("takes the address and the role from the old invitation, never from the form", () => {
    const text = squash(renewAction);

    expect(text).toContain(
      squash(
        "await createInvitationLink({ workspaceId, email: invitation.emailNormalized, role: toInvitationRole(invitation.role), createdByUserId: user.id }",
      ),
    );

    expect(renewAction).not.toContain('"email"');

    expect(renewAction).not.toContain('"role"');
  });

  it("looks for the person in this workspace by the address of the old invitation", () => {
    expect(squash(renewAction)).toContain(
      squash(
        "prisma.workspaceMember.findFirst({ where: { workspaceId, user: { email: invitation.emailNormalized } }",
      ),
    );
  });

  it("refuses only when something was found", () => {
    const text = squash(renewAction);

    expect(text).toContain(
      squash(
        "if (invitation === null) { redirect(`/workspaces/${workspaceId}?status=invitation-missing`); }",
      ),
    );

    expect(text).toContain(
      squash(
        "if (alreadyMember !== null) { redirect(`/workspaces/${workspaceId}?status=already-member`); }",
      ),
    );
  });

  it("only sends a person to the workspace page with a fixed code or the new link", () => {
    const redirects = Array.from(renewAction.matchAll(/\bredirect\((`[^`]*`)\);/g), (m) => m[1]);

    expect(redirects).toEqual([
      "`/workspaces/${workspaceId}?status=invitation-missing`",
      "`/workspaces/${workspaceId}?status=already-member`",
      "`/workspaces/${workspaceId}?invite=${encodeURIComponent(token)}`",
    ]);
  });

  it("keeps redirect() out of try blocks", () => {
    expect(renewAction).not.toContain("try {");
  });
});

describe("createInvitationLink", () => {
  it("removes the older unused links and makes the new one in one transaction", () => {
    const order = positions(links, [
      "const token = createInvitationToken()",
      "await prisma.$transaction([",
      "prisma.workspaceInvitation.deleteMany(",
      "prisma.workspaceInvitation.create(",
      "return token",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("removes only unused links of the same workspace and the same address", () => {
    expect(squash(links)).toContain(
      squash(
        "deleteMany({ where: { workspaceId: input.workspaceId, emailNormalized: input.email, acceptedAt: null }",
      ),
    );
  });

  it("stores only the hash of the secret and a normal expiry", () => {
    const text = squash(links);

    expect(text).toContain(squash("role: input.role"));

    expect(text).toContain(squash("tokenHash: hashInvitationToken(token)"));

    expect(text).toContain(squash("expiresAt: invitationExpiry()"));

    expect(text).toContain(squash("createdByUserId: input.createdByUserId"));
  });

  it("never reads or changes accepted links", () => {
    expect(links).not.toContain("update(");

    expect(links).not.toContain("acceptedAt: {");
  });
});

describe("invite action", () => {
  it("makes the link with the helper, so older links for the same address stop", () => {
    expect(squash(invite)).toContain(
      squash("await createInvitationLink({ workspaceId, email, role, createdByUserId: user.id })"),
    );

    expect(invite).not.toContain("prisma.workspaceInvitation.create");

    expect(actions).not.toContain("createInvitationToken");

    expect(actions).not.toContain("invitationExpiry");

    expect(actions).toContain('from "@/lib/workspaces/invitation-links"');
  });
});

describe("accept action", () => {
  it("looks at the person's place in the workspace after the link was checked", () => {
    const order = positions(accept, [
      "?status=invalid",
      "await getWorkspacePermission(invitation.workspaceId, user.id)",
      "?status=already-joined",
      "await prisma.$transaction([",
      "prisma.workspaceMember.upsert(",
      "prisma.workspaceInvitation.update(",
      "prisma.workspaceInvitation.deleteMany(",
      "?status=joined",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("sends a person who is inside away without changing the role", () => {
    expect(squash(accept)).toContain(
      squash(
        "if (permission !== null) { redirect(`/workspaces/${invitation.workspaceId}?status=already-joined`); }",
      ),
    );
  });

  it("removes only the other unused links for the same address in the same workspace", () => {
    expect(squash(accept)).toContain(
      squash(
        "deleteMany({ where: { workspaceId: invitation.workspaceId, emailNormalized: invitation.emailNormalized, acceptedAt: null, id: { not: invitation.id } }",
      ),
    );
  });

  it("imports the permission reader", () => {
    expect(squash(actions)).toContain(
      squash(
        'import { getWorkspacePermission, requireWorkspacePermission } from "@/lib/workspaces/access"',
      ),
    );
  });
});

describe("workspace page", () => {
  it("loads expired links too, but not accepted ones, and only 50", () => {
    const text = squash(workspacePage);

    expect(text).toContain(
      squash(
        'invitations: { where: { acceptedAt: null }, orderBy: { createdAt: "desc" }, take: 50 }',
      ),
    );

    expect(text).not.toContain(squash("expiresAt: { gt: new Date() }"));
  });

  it("sorts the links and takes the time once for the whole page", () => {
    const text = squash(workspacePage);

    expect(text).toContain(squash("const now = new Date();"));

    expect(text).toContain(
      squash("const invitations = sortInvitations(workspace.invitations, now);"),
    );

    expect(text).toContain(squash("describeInvitationTiming(invitation.expiresAt, now)"));

    expect(workspacePage).not.toContain("formatInvitationExpiry");
  });

  it("shows New link before Revoke and marks expired links", () => {
    const order = positions(workspacePage, [
      "invitationStatus(invitation.expiresAt, now)",
      '<Badge variant="warning">Expired</Badge>',
      "action={renewWorkspaceInvitationAction}",
      'confirmLabel="Create new link"',
      'confirmVariant="default"',
      "action={revokeWorkspaceInvitationAction}",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("uses the sentence of the dialog helper and sends the same two fields as Revoke", () => {
    const renew = workspacePage.slice(
      workspacePage.indexOf("action={renewWorkspaceInvitationAction}"),
      workspacePage.indexOf("action={revokeWorkspaceInvitationAction}"),
    );

    expect(squash(renew)).toContain(
      squash("fields={{ workspaceId: workspace.id, invitationId: invitation.id }}"),
    );

    expect(squash(renew)).toContain(squash("title={renewDialog.title}"));

    expect(squash(renew)).toContain(squash("description={renewDialog.description}"));
  });

  it("does not say that an expired link stops working when it is revoked", () => {
    expect(squash(workspacePage)).toContain(
      squash(
        "The expired link for ${invitation.emailNormalized} is removed from this list. You can create a new invitation at any time.",
      ),
    );
  });

  it("imports the new action from its own file", () => {
    expect(workspacePage).toContain(
      'import { renewWorkspaceInvitationAction } from "../invitation-actions";',
    );
  });

  it("tells the owner how long a link works and what to do with a lost or expired one", () => {
    expect(squash(workspacePage)).toContain(
      squash(
        "A link works for 7 days. If it was lost or has expired, create a new link. Revoke a link to stop it from working.",
      ),
    );
  });

  it("tells the owner that an older link stops working", () => {
    expect(squash(workspacePage)).toContain(
      squash("Any earlier link for the same email address no longer works."),
    );
  });
});

describe("confirm dialog", () => {
  it("is still red by default, so every delete keeps its red button", () => {
    expect(squash(confirmAction)).toContain(squash('confirmVariant = "destructive"'));

    expect(squash(confirmAction)).toContain(
      squash('<Button type="submit" variant={confirmVariant}>'),
    );
  });

  it("can be set to the normal style for an action that deletes nothing", () => {
    expect(squash(confirmAction)).toContain(squash('confirmVariant?: "default" | "destructive"'));
  });
});

describe("invitation page", () => {
  it("decides first, then shows the matching page", () => {
    const order = positions(invitePage, [
      "const view = viewInvitation({",
      'if (view.kind === "missing") { notFound(); }',
      'if (view.kind === "joined")',
      "?status=already-joined",
      'if (view.kind === "expired")',
      "{emailMatches ? (",
      "action={acceptWorkspaceInvitationAction}",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("no longer uses its own date test", () => {
    expect(invitePage).not.toContain("invitation.expiresAt <= new Date()");

    expect(invitePage).not.toContain("formatInvitationExpiry");
  });

  it("asks for the places of the person only", () => {
    expect(squash(invitePage)).toContain(
      squash("members: { where: { userId: user.id }, select: { id: true }, take: 1 }"),
    );
  });

  it("shows the name of the inviter only to the person who was invited", () => {
    expect(squash(invitePage)).toContain(
      squash(
        '{emailMatches ? (<p className="text-sm text-muted-foreground">Invited by {inviterLabel(invitation.createdBy.name)}</p>) : null}',
      ),
    );
  });

  it("tells the right person that the link expired and who to ask", () => {
    const text = squash(invitePage);

    expect(text).toContain(squash("This invitation expired on {view.expiredOn}."));

    expect(text).toContain(squash("A link works for {INVITATION_DAYS} days."));

    expect(text).toContain(
      squash(
        "Ask {inviterLabel(invitation.createdBy.name)} to create a new link for {user.email}.",
      ),
    );
  });
});

describe("page for a link that does not work", () => {
  it("lists the four reasons in simple words", () => {
    const text = squash(inviteNotFound);

    for (const reason of [
      "It is older than {INVITATION_DAYS} days.",
      "It was already used.",
      "The workspace owner made a newer link for the same email address.",
      "The workspace owner cancelled it.",
    ]) {
      expect(text, reason).toContain(squash(reason));
    }
  });

  it("says the account is fine and what to do next", () => {
    expect(squash(inviteNotFound)).toContain(squash("Nothing is wrong with your account."));

    expect(squash(inviteNotFound)).toContain(
      squash("Ask the workspace owner to send you a new link."),
    );
  });

  it("offers the dashboard and the workspaces", () => {
    expect(inviteNotFound).toContain('href="/dashboard"');

    expect(inviteNotFound).toContain('href="/workspaces"');
  });

  it("is a page without server code and without a secret", () => {
    expect(inviteNotFound).not.toContain("prisma");

    expect(inviteNotFound).not.toContain("searchParams");

    expect(inviteNotFound).not.toContain("token");
  });
});

describe("messages", () => {
  it("explains both new codes", () => {
    expect(getWorkspaceNotice("invitation-missing")).toEqual({
      tone: "error",

      message: "That invitation was not found. It may already be accepted or removed.",
    });

    expect(getWorkspaceNotice("already-joined")).toEqual({
      tone: "info",

      message: "You are already in this workspace.",
    });
  });

  it("has a message for every code that the invitation actions send", () => {
    const codes = new Set<string>();

    for (const text of [renewAction, accept, invite]) {
      for (const match of text.matchAll(/\?status=([a-z-]+)/g)) {
        codes.add(match[1]);
      }
    }

    expect(codes.has("invitation-missing")).toBe(true);

    expect(codes.has("already-joined")).toBe(true);

    for (const code of codes) {
      if (code !== "invalid") {
        expect(getWorkspaceNotice(code), code).not.toBe(null);
      }
    }
  });
});

describe("help and readme", () => {
  const group = HELP_GROUPS.find((entry) => entry.items.some((item) => item.id === "invitations"));

  const ids = group?.items.map((item) => item.id) ?? [];

  const item = group?.items.find((entry) => entry.id === "renew-invitation");

  it("puts the new answer right after the answer about inviting", () => {
    expect(ids.indexOf("renew-invitation")).toBe(ids.indexOf("invitations") + 1);
  });

  it("names the button and the mark the owner sees", () => {
    const text = (item?.answer ?? []).join(" ");

    expect(text).toContain("New link");

    expect(text).toContain("Expired");

    expect(text).toContain("Pending invitations");

    expect(text).toContain("only the newest link");
  });

  it("has a short section in the readme", () => {
    expect(readme).toContain("## Invitation links you can renew");

    expect(readme).toContain("**New link:**");

    expect(readme).toContain("migration count stays at 17");
  });
});
