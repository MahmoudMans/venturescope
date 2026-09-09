import {
  prisma,
} from "@/lib/db/prisma";


export async function isProjectWorkspaceOwner(
  userId:
    string,
  projectId:
    string,
): Promise<boolean> {
  const project =
    await prisma.project.findUnique({
      where: {
        id:
          projectId,
      },

      select: {
        workspaceId:
          true,
      },
    });


  if (
    !project?.workspaceId
  ) {
    return false;
  }


  const membership =
    await prisma.workspaceMember.findFirst({
      where: {
        workspaceId:
          project.workspaceId,

        userId,

        role:
          "OWNER",
      },

      select: {
        id:
          true,
      },
    });


  return Boolean(
    membership,
  );
}


export async function requireProjectWorkspaceOwner(
  userId:
    string,
  projectId:
    string,
) {
  const owner =
    await isProjectWorkspaceOwner(
      userId,
      projectId,
    );


  if (
    !owner
  ) {
    throw new Error(
      "Workspace Owner permission is required to reopen a closed financial period.",
    );
  }
}
