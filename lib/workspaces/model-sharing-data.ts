import { cache } from "react";

import { prisma } from "@/lib/db/prisma";
import {
  buildShareTargets,
  describeModelSharing,
  type ModelSharingView,
  type ShareTarget,
  type SharedWorkspaceInput,
} from "@/lib/workspaces/model-sharing";

/**
 * The workspace that a model is shared in, or null when the model is private.
 * The model header and the Settings page both ask for it, so it is cached for one request.
 */
export const loadModelWorkspace = cache(
  async (userId: string, projectId: string): Promise<SharedWorkspaceInput | null> => {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },

      select: {
        workspace: {
          select: {
            id: true,

            name: true,

            ownerId: true,

            _count: {
              select: {
                members: true,
              },
            },

            members: {
              where: {
                userId,
              },

              select: {
                id: true,
              },

              take: 1,
            },
          },
        },
      },
    });

    const workspace = project?.workspace ?? null;

    if (workspace === null) {
      return null;
    }

    return {
      id: workspace.id,

      name: workspace.name,

      memberCount: workspace._count.members,

      personIsInside: workspace.ownerId === userId || workspace.members.length > 0,
    };
  },
);

/** Workspaces where the person may share a model: the ones they own and the ones where they edit. */
export async function loadShareTargets(userId: string): Promise<ShareTarget[]> {
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        {
          ownerId: userId,
        },

        {
          members: {
            some: {
              userId,

              role: {
                in: ["EDITOR", "OWNER"],
              },
            },
          },
        },
      ],
    },

    select: {
      id: true,

      name: true,
    },

    orderBy: {
      name: "asc",
    },

    take: 100,
  });

  return buildShareTargets(workspaces);
}

/** What the Sharing card on the Settings page shows to the owner of a model. */
export async function loadModelSharing(
  userId: string,
  projectId: string,
): Promise<ModelSharingView> {
  const workspace = await loadModelWorkspace(userId, projectId);

  // A shared model needs no list of workspaces: the card only offers to stop sharing.
  const targets = workspace === null ? await loadShareTargets(userId) : [];

  return describeModelSharing({ workspace, targets });
}
