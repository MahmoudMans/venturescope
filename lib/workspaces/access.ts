import {
  notFound,
} from "next/navigation";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  hasWorkspacePermission,
  type WorkspacePermission,
} from "@/lib/workspaces/permissions";


export async function getWorkspacePermission(
  workspaceId:
    string,
  userId:
    string,
): Promise<
  WorkspacePermission |
  null
> {
  const workspace =
    await prisma.workspace.findUnique({
      where: {
        id:
          workspaceId,
      },

      select: {
        ownerId:
          true,

        members: {
          where: {
            userId,
          },

          select: {
            role:
              true,
          },

          take:
            1,
        },
      },
    });


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
    workspace.members[
      0
    ]?.role ??
    null
  );
}


export async function requireWorkspacePermission(
  workspaceId:
    string,
  userId:
    string,
  required:
    WorkspacePermission =
      "VIEWER",
): Promise<
  WorkspacePermission
> {
  const actual =
    await getWorkspacePermission(
      workspaceId,
      userId,
    );


  if (
    !actual ||
    !hasWorkspacePermission(
      actual,
      required,
    )
  ) {
    notFound();
  }


  return actual;
}
