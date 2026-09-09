export type WorkspacePermission =
  | "OWNER"
  | "EDITOR"
  | "VIEWER";


const PERMISSION_RANK:
  Record<
    WorkspacePermission,
    number
  > = {
    VIEWER:
      1,

    EDITOR:
      2,

    OWNER:
      3,
  };


export function hasWorkspacePermission(
  actual:
    WorkspacePermission,
  required:
    WorkspacePermission,
): boolean {
  return (
    PERMISSION_RANK[
      actual
    ] >=
    PERMISSION_RANK[
      required
    ]
  );
}


export type ProjectPermissionInput = {
  userId:
    string;

  personalOwnerId:
    string;

  workspace:
    | {
        ownerId:
          string;

        memberRole?:
          WorkspacePermission |
          null;
      }
    | null;
};


export function resolveProjectPermission({
  userId,
  personalOwnerId,
  workspace,
}: ProjectPermissionInput): WorkspacePermission | null {
  if (
    personalOwnerId ===
    userId
  ) {
    return "OWNER";
  }


  if (
    !workspace
  ) {
    return null;
  }


  if (
    workspace.ownerId ===
    userId
  ) {
    return "OWNER";
  }


  return (
    workspace.memberRole ??
    null
  );
}
