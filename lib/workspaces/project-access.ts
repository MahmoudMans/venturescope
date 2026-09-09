import {
  notFound,
  } from "next/navigation";

import {
  prisma,
  } from "@/lib/db/prisma";

import {
  hasWorkspacePermission,
  resolveProjectPermission,
} from "@/lib/workspaces/permissions";

async function projectWithPermission(
  userId:
    string,
  projectId:
    string,
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id:
          projectId,
      },

      include: {
        workspace: {
          include: {
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
        },
      },
    });

  if (
    !project
  ) {
    return null;
  }

  const permission =
    resolveProjectPermission({
      userId,

      personalOwnerId:
        project.userId,

      workspace:
        project.workspace
          ?
            {
              ownerId:
                project.workspace
                  .ownerId,

              memberRole:
                project.workspace
                  .members[
                    0
                  ]?.role ??
                null,
            }
          :
            null,
    });

  if (
    !permission
  ) {
    return null;
  }

  return {
    project,

    permission,
  };
}

export async function getProjectForViewer(
  userId:
    string,
  projectId:
    string,
) {
  const result =
    await projectWithPermission(
      userId,
      projectId,
    );

  return (
    result?.project ??
    null
  );
}

export async function getProjectForEditor(
  userId:
    string,
  projectId:
    string,
) {
  const result =
    await projectWithPermission(
      userId,
      projectId,
    );

  if (
    !result ||
    !hasWorkspacePermission(
      result.permission,
      "EDITOR",
    )
  ) {
    return null;
  }

  return result.project;
}

export async function requireProjectEditor(
  userId:
    string,
  projectId:
    string,
) {
  const project =
    await getProjectForEditor(
      userId,
      projectId,
    );

  if (
    !project
  ) {
    notFound();
  }

  return project;
}

export async function requireProjectOwner(
  userId:
    string,
  projectId:
    string,
) {
  const result =
    await projectWithPermission(
      userId,
      projectId,
    );

  if (
    !result ||
    !hasWorkspacePermission(
      result.permission,
      "OWNER",
    )
  ) {
    notFound();
  }

  return result.project;
}
