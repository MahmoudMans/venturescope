import type { WorkspacePermission } from "@/lib/workspaces/permissions";

export type WorkspaceRoleInput = {
  ownerId: string;

  /** Only the signed-in person's own membership rows are needed. */
  members: ReadonlyArray<{ role: string }>;
};

/** Shown when the owner of a shared model has no saved name. */
export const UNKNOWN_OWNER_NAME = "A teammate";

/** A person's name for screens, with a neutral fallback for a blank one. */
export function ownerDisplayName(name: string | null | undefined): string {
  return name?.trim() || UNKNOWN_OWNER_NAME;
}

/** The signed-in person's role in a workspace: the owner, or what their membership says. */
export function resolveWorkspaceRole(
  userId: string,
  workspace: WorkspaceRoleInput,
): WorkspacePermission {
  if (workspace.ownerId === userId) {
    return "OWNER";
  }

  const role = workspace.members[0]?.role;

  if (role === "OWNER" || role === "EDITOR") {
    return role;
  }

  return "VIEWER";
}

export type SharedProjectAccess = {
  workspaceId: string;

  workspaceName: string;

  role: WorkspacePermission;

  /** The person who owns the model itself, not the workspace. */
  ownerName: string;
};

/** How a person reaches a model through a workspace, or null when it is not in one. */
export function toSharedProjectAccess(
  userId: string,
  workspace: ({ id: string; name: string } & WorkspaceRoleInput) | null,
  modelOwnerName: string | null | undefined,
): SharedProjectAccess | null {
  if (workspace === null) {
    return null;
  }

  return {
    workspaceId: workspace.id,

    workspaceName: workspace.name,

    role: resolveWorkspaceRole(userId, workspace),

    ownerName: ownerDisplayName(modelOwnerName),
  };
}
