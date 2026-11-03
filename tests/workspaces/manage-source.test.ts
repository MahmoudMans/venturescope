import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { HELP_GROUPS } from "@/lib/site/help-content";
import { getWorkspaceNotice } from "@/lib/workspaces/labels";
import {
  TRANSFER_LIMIT,
  TRANSFER_WINDOW_MS,
  WORKSPACE_NAME_MAX,
  WORKSPACE_NAME_MIN,
} from "@/lib/workspaces/manage";

const read = (path: string) => readFileSync(path, "utf8");

const actions = read("app/(app)/workspaces/manage-actions.ts");

const createActions = read("app/(app)/workspaces/actions.ts");

const listPage = read("app/(app)/workspaces/page.tsx");

const workspacePage = read("app/(app)/workspaces/[workspaceId]/page.tsx");

const renameForm = read("components/workspaces/rename-workspace-form.tsx");

const transferForm = read("components/workspaces/transfer-ownership-form.tsx");

const securityPage = read("app/(app)/account/security/page.tsx");

const events = read("lib/security/account-events.ts");

const readme = read("README.md");

const schema = read("prisma/schema.prisma");

/** Source text with every run of spaces and line breaks turned into one space. */
const flat = (text: string) => text.replace(/\s+/g, " ");

/** The place of each marker in the text, in the order they are given. */
function positions(text: string, markers: string[]): number[] {
  return markers.map((marker) => text.indexOf(marker));
}

/** True when every value was found and each one comes after the one before it. */
function isIncreasing(values: number[]): boolean {
  return values.every((value, index) => value > -1 && (index === 0 || value > values[index - 1]));
}

/** The text from the start marker up to the end marker. */
function between(text: string, start: string, end: string): string {
  const from = text.indexOf(start);

  const to = text.indexOf(end, from + 1);

  return from === -1 || to === -1 ? "" : text.slice(from, to);
}

const RENAME_START = "export async function renameWorkspaceAction";

const TRANSFER_START = "export async function transferWorkspaceOwnershipAction";

const rename = actions.slice(actions.indexOf(RENAME_START), actions.indexOf(TRANSFER_START));

const transfer = actions.slice(actions.indexOf(TRANSFER_START));

/** The status code that the first back() after a condition sends. */
function codeAfter(body: string, condition: string): string | undefined {
  const start = body.indexOf(condition);

  return start === -1 ? undefined : /\bback\(workspaceId, "([^"]+)"\)/.exec(body.slice(start))?.[1];
}

describe("workspace manage actions file", () => {
  it("is a server action file that exports only the two actions", () => {
    expect(actions.startsWith('"use server";')).toBe(true);

    const exported = Array.from(actions.matchAll(/^export (.+)$/gm), (match) => match[1]);

    expect(exported).toEqual([
      "async function renameWorkspaceAction(formData: FormData): Promise<void> {",
      "async function transferWorkspaceOwnershipAction(formData: FormData): Promise<void> {",
    ]);
  });

  it("puts only a fixed code into the address, and only after the workspace id was checked", () => {
    const redirects = Array.from(actions.matchAll(/\bredirect\(([^)]*)\)/g), (match) => match[1]);

    expect(redirects).toEqual(["`/workspaces/${workspaceId}?status=${status}`", '"/login"']);

    for (const body of [rename, transfer]) {
      const codes = Array.from(body.matchAll(/\bback\(workspaceId, "([^"]+)"\)/g), (m) => m[1]);

      for (const code of codes) {
        expect(getWorkspaceNotice(code), code).not.toBe(null);
      }

      expect(
        body.indexOf('requireWorkspacePermission(workspaceId, user.id, "OWNER")'),
      ).toBeLessThan(body.indexOf("back(workspaceId"));
    }

    expect(actions).not.toContain("searchParams");
  });

  it("never touches models, the workspace itself, invitations or the sign-in of anyone", () => {
    expect(actions).not.toContain("prisma.project");

    expect(actions).not.toContain("transaction.project");

    expect(actions).not.toContain("workspace.delete");

    expect(actions).not.toContain("workspaceInvitation");

    expect(actions).not.toContain("signOut");

    expect(actions).not.toContain("authVersion");
  });
});

describe("rename action", () => {
  it("checks the person, then owner permission, then the name, then writes", () => {
    const order = positions(rename, [
      "await requireCurrentUserIdentity()",
      'await requireWorkspacePermission(workspaceId, user.id, "OWNER")',
      'normalizeWorkspaceName(field(formData, "name"))',
      "prisma.workspace.updateMany(",
      "revalidatePath(",
      'back(workspaceId, "workspace-renamed")',
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("only changes the name, and only of a workspace that this person owns", () => {
    const update = between(rename, "prisma.workspace.updateMany(", "if (renamed.count");

    expect(update).toMatch(/where:\s*\{\s*id:\s*workspaceId,\s*ownerId:\s*user\.id,?\s*\}/);

    expect(update).toMatch(/data:\s*\{\s*name:\s*next\.name,?\s*\}/);

    expect(update).not.toContain("ownerId: next");
  });

  it("stops with the right message at each step", () => {
    expect(codeAfter(rename, "if (next.ok === false) {")).toBe("invalid-name");

    expect(codeAfter(rename, "if (renamed.count !== 1) {")).toBe("not-owner");

    expect(rename).toContain('back(workspaceId, "workspace-renamed");');
  });

  it("refreshes the list and the page", () => {
    expect(rename).toContain('revalidatePath("/workspaces");');

    expect(rename).toContain("revalidatePath(`/workspaces/${workspaceId}`);");
  });
});

describe("transfer action", () => {
  it("checks the person, the owner, the limit, the new owner, the password, then writes", () => {
    const order = positions(transfer, [
      "await requireCurrentUserIdentity()",
      'await requireWorkspacePermission(workspaceId, user.id, "OWNER")',
      "checkRateLimit(",
      "prisma.workspaceMember.findFirst(",
      "prisma.user.findUnique(",
      "const passwordMatches",
      "prisma.$transaction(",
      "if (moved === false)",
      'logAccountSecurityEvent("workspace.transferred"',
      'back(workspaceId, "ownership-transferred")',
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("asks for the password of the owner with bcrypt, without cutting spaces off", () => {
    expect(actions).toContain('import { compare } from "bcryptjs";');

    expect(transfer).toContain('compare(field(formData, "password"), account.passwordHash)');

    expect(transfer).toMatch(/where:\s*\{\s*id:\s*user\.id,?\s*\}/);
  });

  it("only accepts a collaborator of this workspace who is not the owner", () => {
    const lookup = between(transfer, "prisma.workspaceMember.findFirst(", "if (member === null)");

    expect(lookup).toMatch(/id:\s*memberId,/);

    expect(lookup).toMatch(/workspaceId,/);

    expect(lookup).toMatch(/userId:\s*\{\s*not:\s*user\.id,?\s*\}/);

    expect(flat(transfer)).toContain('memberId === "" ? null :');
  });

  it("stops with the right message at each step", () => {
    expect(codeAfter(transfer, "if (attempts.allowed === false) {")).toBe("transfer-rate-limit");

    expect(codeAfter(transfer, "if (member === null) {")).toBe("transfer-no-member");

    expect(codeAfter(transfer, "if (passwordMatches === false) {")).toBe("transfer-password");

    expect(codeAfter(transfer, "if (moved === false) {")).toBe("transfer-changed");

    const missing = transfer.indexOf("if (account === null) {");

    expect(missing).toBeGreaterThan(-1);

    expect(transfer.slice(missing, missing + 60)).toContain('redirect("/login")');
  });

  it("slows down repeated tries of the same person", () => {
    expect(transfer).toContain("key: `workspace-transfer:${user.id}`");

    expect(transfer).toContain("limit: TRANSFER_LIMIT");

    expect(transfer).toContain("windowMs: TRANSFER_WINDOW_MS");

    expect(TRANSFER_LIMIT).toBe(5);

    expect(TRANSFER_WINDOW_MS).toBe(900000);
  });

  it("moves the workspace in one transaction that fails safely when things changed", () => {
    expect(transfer).toContain("prisma.$transaction(async (transaction) => {");

    const body = between(transfer, "prisma.$transaction(", "if (moved === false)");

    const order = positions(body, [
      "transaction.workspace.updateMany(",
      "if (changed.count !== 1)",
      "return false;",
      "transaction.workspaceMember.deleteMany(",
      "transaction.workspaceMember.upsert(",
      "return true;",
    ]);

    expect(isIncreasing(order)).toBe(true);
  });

  it("changes the owner only when the signed-in person still owns it and the member still exists", () => {
    const body = between(transfer, "transaction.workspace.updateMany(", "if (changed.count");

    expect(body).toMatch(/where:\s*\{\s*id:\s*workspaceId,\s*ownerId:\s*user\.id,\s*members:/);

    expect(body).toMatch(
      /members:\s*\{\s*some:\s*\{\s*id:\s*member\.id,\s*userId:\s*member\.userId,?\s*\}/,
    );

    expect(body).toMatch(/data:\s*\{\s*ownerId:\s*member\.userId,?\s*\}/);
  });

  it("removes the membership row of the new owner and keeps the old owner as an editor", () => {
    const removal = between(
      transfer,
      "transaction.workspaceMember.deleteMany(",
      "transaction.workspaceMember.upsert(",
    );

    expect(removal).toMatch(/where:\s*\{\s*workspaceId,\s*userId:\s*member\.userId,?\s*\}/);

    const keep = between(transfer, "transaction.workspaceMember.upsert(", "return true;");

    expect(keep).toMatch(/workspaceId_userId:\s*\{\s*workspaceId,\s*userId:\s*user\.id,?\s*\}/);

    expect(keep).toMatch(/update:\s*\{\s*role:\s*FORMER_OWNER_ROLE,?\s*\}/);

    expect(keep).toMatch(
      /create:\s*\{\s*workspaceId,\s*userId:\s*user\.id,\s*role:\s*FORMER_OWNER_ROLE,?\s*\}/,
    );

    expect(keep.match(/role:\s*FORMER_OWNER_ROLE/g)?.length).toBe(2);
  });

  it("cuts the spaces off the workspace id and the choice of the new owner, but not the password", () => {
    expect(rename).toContain('const workspaceId = field(formData, "workspaceId").trim();');

    expect(transfer).toContain('const workspaceId = field(formData, "workspaceId").trim();');

    expect(transfer).toContain('const memberId = field(formData, "memberId").trim();');

    expect(transfer).not.toMatch(/field\(formData, "password"\)\.trim\(\)/);
  });

  it("does not jump to another page inside the transaction", () => {
    const body = between(transfer, "prisma.$transaction(", "if (moved === false)");

    expect(body).not.toContain("redirect(");

    expect(body).not.toContain("back(");

    expect(body).not.toContain("logAccountSecurityEvent(");
  });

  it("logs ids and a reason, and never an email address or a password", () => {
    const calls = transfer.match(/logAccountSecurityEvent\([\s\S]*?\);/g) ?? [];

    expect(calls.length).toBe(4);

    for (const call of calls) {
      expect(call.replace(/"workspace\.[a-z.]+"/, "")).not.toMatch(
        /email|password"?\s*[,:)]\s*field/i,
      );

      expect(call).toContain("workspaceId,");
    }

    const reasons = Array.from(transfer.matchAll(/reason: "([^"]+)"/g), (match) => match[1]);

    expect(reasons).toEqual(["rate-limit", "password", "changed"]);

    expect(transfer).toContain("newOwnerUserId: member.userId");
  });

  it("refreshes the list and the page after a transfer", () => {
    expect(transfer).toContain('revalidatePath("/workspaces");');

    expect(transfer).toContain("revalidatePath(`/workspaces/${workspaceId}`);");
  });
});

describe("what the actions rely on", () => {
  it("has one owner id on a workspace, and a unique membership for each person", () => {
    const workspace = /^model Workspace \{([\s\S]*?)^\}/m.exec(schema);

    expect(workspace?.[1]).toMatch(/^\s+ownerId\s+String\s*$/m);

    const membership = /^model WorkspaceMember \{([\s\S]*?)^\}/m.exec(schema);

    expect(membership?.[1]).toContain("@@unique([workspaceId, userId])");
  });

  it("uses the same name rules as creating a workspace", () => {
    expect(WORKSPACE_NAME_MIN).toBe(2);

    expect(WORKSPACE_NAME_MAX).toBe(80);

    const create = flat(createActions);

    expect(create).toContain("name.length < 2 ||");

    expect(create).toContain("name.length > 80");

    expect(flat(listPage)).toContain("minLength={2} maxLength={80}");
  });
});

describe("rename form", () => {
  it("posts to the action with the two fields that the action reads", () => {
    expect(renameForm).toContain("action={renameWorkspaceAction}");

    const fields = Array.from(rename.matchAll(/field\(formData, "(\w+)"\)/g), (match) => match[1]);

    expect(Array.from(new Set(fields)).sort()).toEqual(["name", "workspaceId"]);

    for (const name of fields) {
      expect(renameForm).toContain(`name="${name}"`);
    }
  });

  it("shows the current name and uses the same length limits as the check", () => {
    expect(renameForm).toContain("defaultValue={currentName}");

    expect(renameForm).toContain("minLength={WORKSPACE_NAME_MIN}");

    expect(renameForm).toContain("maxLength={WORKSPACE_NAME_MAX}");

    expect(renameForm).toContain("required");

    expect(renameForm).toContain('<Label htmlFor="rename-workspace">');

    expect(renameForm).toContain('id="rename-workspace"');
  });

  it("needs no browser code of its own", () => {
    expect(renameForm).not.toContain('"use client"');

    expect(renameForm).not.toContain("useState");
  });
});

describe("transfer form", () => {
  it("posts to the action with the three fields that the action reads", () => {
    expect(transferForm).toContain("action={transferWorkspaceOwnershipAction}");

    const fields = Array.from(
      transfer.matchAll(/field\(formData, "(\w+)"\)/g),
      (match) => match[1],
    );

    expect(Array.from(new Set(fields)).sort()).toEqual(["memberId", "password", "workspaceId"]);

    for (const name of fields) {
      expect(transferForm).toContain(`name="${name}"`);
    }
  });

  it("makes the person choose, and asks for the password", () => {
    expect(transferForm).toContain('<NativeSelect id="transfer-member" name="memberId" required');

    expect(transferForm).toContain('defaultValue=""');

    expect(transferForm).toMatch(/<option value="" disabled>\s*Choose a collaborator\s*<\/option>/);

    expect(transferForm).toContain("value={option.memberId}");

    expect(transferForm).toContain('autoComplete="current-password"');

    expect(transferForm).toContain('describedBy="transfer-note"');

    expect(transferForm).toContain('id="transfer-note"');
  });

  it("warns what the new owner can do and who can undo it", () => {
    const text = flat(transferForm);

    expect(text).toContain("The new owner can invite and remove people");

    expect(text).toContain("delete the workspace");

    expect(text).toContain("You stay in the workspace as an editor");

    expect(text).toContain("Only the new owner can give the workspace back to you");

    expect(transferForm).toContain('variant="destructive"');
  });

  it("needs no browser code of its own", () => {
    expect(transferForm).not.toContain('"use client"');

    expect(transferForm).not.toContain("useState");
  });
});

describe("workspace page", () => {
  const rename = workspacePage.indexOf('<Card id="rename"');

  const transfer = workspacePage.indexOf('<Card id="transfer"');

  const remove = workspacePage.indexOf("border-destructive/40");

  it("shows both cards only to the owner, above the card that deletes the workspace", () => {
    expect(isIncreasing([rename, transfer, remove])).toBe(true);

    for (const card of [rename, transfer]) {
      expect(workspacePage.slice(card - 40, card)).toContain("{isOwner ? (");
    }

    expect(workspacePage).toContain('const isOwner = permission === "OWNER";');
  });

  it("gives the form the id and the current name of this workspace", () => {
    expect(flat(workspacePage)).toContain(
      "<RenameWorkspaceForm workspaceId={workspace.id} currentName={workspace.name} />",
    );

    expect(flat(workspacePage)).toContain(
      "<TransferOwnershipForm workspaceId={workspace.id} options={transferOptions} />",
    );

    expect(workspacePage).toContain("buildTransferOptions(workspace.members)");
  });

  it("explains what to do when nobody else has joined", () => {
    expect(workspacePage).toContain("transferOptions.length > 0 ?");

    expect(flat(workspacePage)).toContain("Nobody else has joined this workspace.");
  });

  it("tells the owner about the alternative to deleting", () => {
    expect(flat(workspacePage)).toContain("transfer ownership instead");
  });

  it("has no other form that changes the owner", () => {
    expect(workspacePage).not.toContain("ownerId:");
  });
});

describe("texts", () => {
  const items = HELP_GROUPS.flatMap((group) => group.items);

  const answer = (id: string) => items.find((item) => item.id === id)?.answer.join(" ") ?? "";

  it("explain renaming in Help", () => {
    const text = answer("rename-workspace");

    expect(text).toContain("Workspace name form");

    expect(text).toContain("Only the owner");
  });

  it("explain the transfer in Help, with the steps and the result", () => {
    const text = answer("transfer-workspace");

    expect(text).toContain("Transfer ownership form");

    expect(text).toContain("already be a collaborator");

    expect(text).toContain("enter your password");

    expect(text).toContain("You stay in the workspace as an editor");

    expect(text).toContain("Only the new owner can give the workspace back to you");
  });

  it("warn in Help and on the Security page that deleting an account deletes owned workspaces", () => {
    expect(answer("delete-account")).toContain("Transfer ownership");

    expect(flat(securityPage)).toContain("Workspaces that you own are deleted with your account.");

    expect(flat(securityPage)).toContain("Transfer ownership");
  });

  it("are the same in the README as in the code", () => {
    const start = readme.indexOf("## Rename a workspace and give it to someone else");

    expect(start).toBeGreaterThan(-1);

    const next = readme.indexOf("\n## ", start + 1);

    expect(next).toBeGreaterThan(start);

    const text = flat(readme.slice(start, next));

    expect(text).toContain(`${WORKSPACE_NAME_MIN} to ${WORKSPACE_NAME_MAX} characters`);

    expect(text).toContain(`${TRANSFER_LIMIT} times every ${TRANSFER_WINDOW_MS / 60_000} minutes`);
  });

  it("add the two log events", () => {
    expect(events).toContain('"workspace.transferred"');

    expect(events).toContain('"workspace.transfer.rejected"');
  });
});
