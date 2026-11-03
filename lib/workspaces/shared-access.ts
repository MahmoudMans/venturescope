import { prisma } from "@/lib/db/prisma";
import { toSharedProjectAccess, type SharedProjectAccess } from "@/lib/workspaces/shared-role";

/**
 * How a collaborator reaches a model they do not own. Returns null when the
 * model belongs to the person themselves or is not shared in any workspace.
 */
export async function getSharedProjectAccess(
  userId: string,
  projectId: string,
): Promise<SharedProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },

    select: {
      userId: true,

      user: {
        select: {
          name: true,
        },
      },

      workspace: {
        select: {
          id: true,

          name: true,

          ownerId: true,

          members: {
            where: {
              userId,
            },

            select: {
              role: true,
            },

            take: 1,
          },
        },
      },
    },
  });

  if (project === null || project.userId === userId) {
    return null;
  }

  return toSharedProjectAccess(userId, project.workspace, project.user.name);
}
