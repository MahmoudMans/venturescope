import { workspaceRoleLabel } from "@/lib/workspaces/labels";

/** A workspace name has at least this many characters. Creating a workspace uses the same rule. */
export const WORKSPACE_NAME_MIN = 2;

/** A workspace name has at most this many characters. Creating a workspace uses the same rule. */
export const WORKSPACE_NAME_MAX = 80;

export type WorkspaceNameResult = { ok: true; name: string } | { ok: false };

/** Removes the spaces around a workspace name and checks how long it is. */
export function normalizeWorkspaceName(input: string): WorkspaceNameResult {
  const name = input.trim();

  if (name.length < WORKSPACE_NAME_MIN || name.length > WORKSPACE_NAME_MAX) {
    return { ok: false };
  }

  return { ok: true, name };
}

/** An owner can try to give a workspace away this many times in each time window. */
export const TRANSFER_LIMIT = 5;

export const TRANSFER_WINDOW_MS = 15 * 60 * 1000;

/** The person who gives a workspace away stays in it with this role. */
export const FORMER_OWNER_ROLE = "EDITOR" as const;

export type TransferOption = {
  memberId: string;

  label: string;
};

export type TransferMember = {
  id: string;

  role: string;

  user: {
    email: string;

    name: string | null;
  };
};

/**
 * The choices for "who becomes the new owner". Only people who already joined
 * the workspace can be chosen. The list is sorted so that it is easy to scan.
 */
export function buildTransferOptions(members: ReadonlyArray<TransferMember>): TransferOption[] {
  return members
    .map((member) => {
      const name = member.user.name?.trim() ?? "";

      const parts =
        name === "" || name === member.user.email
          ? [member.user.email, workspaceRoleLabel(member.role)]
          : [name, member.user.email, workspaceRoleLabel(member.role)];

      return {
        memberId: member.id,

        label: parts.join(" - "),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
