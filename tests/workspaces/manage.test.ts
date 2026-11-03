import { describe, expect, it } from "vitest";

import {
  getWorkspaceNotice,
  workspaceRoleDescription,
  workspaceRoleLabel,
} from "@/lib/workspaces/labels";
import {
  FORMER_OWNER_ROLE,
  TRANSFER_LIMIT,
  TRANSFER_WINDOW_MS,
  WORKSPACE_NAME_MAX,
  WORKSPACE_NAME_MIN,
  buildTransferOptions,
  normalizeWorkspaceName,
  type TransferMember,
} from "@/lib/workspaces/manage";

function member(
  id: string,
  email: string,
  name: string | null,
  role: string = "EDITOR",
): TransferMember {
  return { id, role, user: { email, name } };
}

describe("normalizeWorkspaceName", () => {
  it("removes the spaces around the name and keeps the rest as it is", () => {
    expect(normalizeWorkspaceName("  Finance Team  ")).toEqual({
      ok: true,
      name: "Finance Team",
    });

    expect(normalizeWorkspaceName("\tFinance   team\n")).toEqual({
      ok: true,
      name: "Finance   team",
    });

    expect(normalizeWorkspaceName("Equipe Finance & Co.")).toEqual({
      ok: true,
      name: "Equipe Finance & Co.",
    });
  });

  it("accepts 2 to 80 characters", () => {
    expect(WORKSPACE_NAME_MIN).toBe(2);

    expect(WORKSPACE_NAME_MAX).toBe(80);

    expect(normalizeWorkspaceName("ab")).toEqual({ ok: true, name: "ab" });

    expect(normalizeWorkspaceName("x".repeat(80))).toEqual({ ok: true, name: "x".repeat(80) });
  });

  it("refuses a name that is too short or too long", () => {
    expect(normalizeWorkspaceName("")).toEqual({ ok: false });

    expect(normalizeWorkspaceName("a")).toEqual({ ok: false });

    expect(normalizeWorkspaceName("x".repeat(81))).toEqual({ ok: false });
  });

  it("counts the length after the spaces around the name are removed", () => {
    expect(normalizeWorkspaceName("   ")).toEqual({ ok: false });

    expect(normalizeWorkspaceName("   a   ")).toEqual({ ok: false });

    expect(normalizeWorkspaceName(`  ${"x".repeat(80)}  `)).toEqual({
      ok: true,
      name: "x".repeat(80),
    });

    expect(normalizeWorkspaceName(` ${"x".repeat(81)} `)).toEqual({ ok: false });
  });
});

describe("limits", () => {
  it("allows 5 tries in 15 minutes", () => {
    expect(TRANSFER_LIMIT).toBe(5);

    expect(TRANSFER_WINDOW_MS).toBe(15 * 60 * 1000);
  });

  it("keeps the old owner in the workspace as an editor", () => {
    expect(FORMER_OWNER_ROLE).toBe("EDITOR");
  });
});

describe("buildTransferOptions", () => {
  it("gives nothing to choose when nobody else joined", () => {
    expect(buildTransferOptions([])).toEqual([]);
  });

  it("shows the name, the email address and the role of each collaborator", () => {
    expect(
      buildTransferOptions([
        member("m1", "amira@example.com", "Amira Ben Salah", "EDITOR"),
        member("m2", "karim@example.com", "Karim", "VIEWER"),
      ]),
    ).toEqual([
      { memberId: "m1", label: "Amira Ben Salah - amira@example.com - Editor" },
      { memberId: "m2", label: "Karim - karim@example.com - Viewer" },
    ]);
  });

  it("uses the email address alone when a person has no usable name", () => {
    expect(buildTransferOptions([member("m1", "a@example.com", null)])[0].label).toBe(
      "a@example.com - Editor",
    );

    expect(buildTransferOptions([member("m1", "a@example.com", "   ")])[0].label).toBe(
      "a@example.com - Editor",
    );

    expect(buildTransferOptions([member("m1", "a@example.com", "a@example.com")])[0].label).toBe(
      "a@example.com - Editor",
    );
  });

  it("sorts the choices and keeps the id of each member", () => {
    const options = buildTransferOptions([
      member("m3", "z@example.com", "Zoe"),
      member("m1", "a@example.com", "Amira"),
      member("m2", "m@example.com", "Mehdi"),
    ]);

    expect(options.map((option) => option.memberId)).toEqual(["m1", "m2", "m3"]);
  });

  it("does not change the list that it is given", () => {
    const members = [member("m2", "b@example.com", "Bob"), member("m1", "a@example.com", "Ann")];

    const copy = JSON.parse(JSON.stringify(members));

    buildTransferOptions(members);

    expect(members).toEqual(copy);
  });

  it("uses the same role words as the rest of the workspace pages", () => {
    for (const role of ["EDITOR", "VIEWER"]) {
      const [option] = buildTransferOptions([member("m1", "a@example.com", "Ann", role)]);

      expect(option.label.endsWith(` - ${workspaceRoleLabel(role)}`)).toBe(true);
    }
  });
});

describe("notices for the two new actions", () => {
  it("confirm a rename and a transfer", () => {
    expect(getWorkspaceNotice("workspace-renamed")).toEqual({
      tone: "success",
      message: "Workspace renamed.",
    });

    const transferred = getWorkspaceNotice("ownership-transferred");

    expect(transferred?.tone).toBe("success");

    expect(transferred?.message).toContain("You are now an editor");
  });

  it("explain every problem that the actions can report", () => {
    for (const code of [
      "not-owner",
      "transfer-no-member",
      "transfer-password",
      "transfer-rate-limit",
      "transfer-changed",
    ]) {
      const notice = getWorkspaceNotice(code);

      expect(notice?.tone, code).toBe("error");

      expect(notice?.message.endsWith("."), code).toBe(true);

      expect(notice?.message, code).toBe(notice?.message.trim());
    }
  });

  it("tell the person that a wrong password changed nothing", () => {
    expect(getWorkspaceNotice("transfer-password")?.message).toContain("Ownership was not changed");
  });

  it("reuse the message about the length of a name", () => {
    expect(getWorkspaceNotice("invalid-name")?.message).toBe(
      `A workspace name needs ${WORKSPACE_NAME_MIN} to ${WORKSPACE_NAME_MAX} characters.`,
    );
  });

  it("are fixed texts without placeholders, so a message cannot repeat what was typed", () => {
    for (const code of [
      "workspace-renamed",
      "ownership-transferred",
      "not-owner",
      "transfer-no-member",
      "transfer-password",
      "transfer-rate-limit",
      "transfer-changed",
    ]) {
      expect(getWorkspaceNotice(code)?.message ?? "", code).not.toMatch(/\$\{|\{\w*\}|%s/);
    }
  });
});

describe("what an owner can do", () => {
  it("is described for the people who read about roles", () => {
    const text = workspaceRoleDescription("OWNER");

    expect(text).toContain("rename the workspace");

    expect(text).toContain("give it to another collaborator");

    expect(text).toContain("delete the workspace");
  });

  it("is not promised to the other roles", () => {
    for (const role of ["EDITOR", "VIEWER"]) {
      expect(workspaceRoleDescription(role)).not.toMatch(/rename|give it to/i);
    }
  });
});
