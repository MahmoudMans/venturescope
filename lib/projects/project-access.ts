import { notFound } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/db/prisma";

import {
  getWorkspacePermission,
} from "@/lib/workspaces/access";

import {
  hasWorkspacePermission,
} from "@/lib/workspaces/permissions";


export const getOwnedProject = cache(
  async (
    userId: string,
    projectId: string,
  ) => {
    return prisma.project.findFirst({
      where: {
        id:
          projectId,

        OR: [
          {
            userId:
              userId,
          },

          {
            workspace: {
              is: {
                ownerId:
                  userId,
              },
            },
          },

          {
            workspace: {
              is: {
                members: {
                  some: {
                    userId:
                      userId,
                  },
                },
              },
            },
          },
        ],
      },

      select: {
        id: true,
        userId: true,
        name: true,
        industry: true,
        currency: true,
        startMonth: true,
        horizonMonths: true,
        revenueMode: true,
        modelVersion: true,
        baseAssumptions: true,
        createdAt: true,
        updatedAt: true,

        scenarios: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            name: true,
            type: true,
            modifiers: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        _count: {
          select: {
            financingEvents: true,
            monthlyOverrides: true,
          },
        },
      },
    });
  },
);

export async function requireOwnedProject(
  userId: string,
  projectId: string,
) {
  const project =
    await getOwnedProject(
      userId,
      projectId,
    );

  if (!project) {
    notFound();
  }

  return project;
}

type OwnedProjectArguments =
  Parameters<
    typeof getOwnedProject
  >;

type AccessibleProject =
  NonNullable<
    Awaited<
      ReturnType<
        typeof getOwnedProject
      >
    >
  >;



async function workspacePermissionForAccessibleProject(
  userId:
    string,
  project:
    AccessibleProject,
) {
  const access =
    await prisma.project.findUnique({
      where: {
        id:
          project.id,
      },

      select: {
        workspaceId:
          true,
      },
    });


  if (
    !access?.workspaceId
  ) {
    return null;
  }


  return getWorkspacePermission(
    access.workspaceId,
    userId,
  );
}


async function canEditAccessibleProject(
  userId:
    string,
  project:
    AccessibleProject,
): Promise<boolean> {
  if (
    project.userId ===
    userId
  ) {
    return true;
  }


  const permission =
    await workspacePermissionForAccessibleProject(
      userId,
      project,
    );


  return (
    permission !==
      null &&
    hasWorkspacePermission(
      permission,
      "EDITOR",
    )
  );
}


async function ownsAccessibleProject(
  userId:
    string,
  project:
    AccessibleProject,
): Promise<boolean> {
  if (
    project.userId ===
    userId
  ) {
    return true;
  }


  return (
    await workspacePermissionForAccessibleProject(
      userId,
      project,
    )
  ) ===
    "OWNER";
}


export const getProjectForEditor =
  cache(
    async (
      ...args:
        OwnedProjectArguments
    ) => {
      const project =
        await getOwnedProject(
          ...args
        );


      if (
        !project
      ) {
        return null;
      }


      const userId =
        args[0] as
          string;


      if (
        !await canEditAccessibleProject(
          userId,
          project,
        )
      ) {
        return null;
      }


      return project;
    },
  );


export async function requireProjectEditor(
  ...args:
    OwnedProjectArguments
) {
  const project =
    await getProjectForEditor(
      ...args
    );


  if (
    !project
  ) {
    notFound();
  }


  return project;
}


export const getProjectForOwner =
  cache(
    async (
      ...args:
        OwnedProjectArguments
    ) => {
      const project =
        await getOwnedProject(
          ...args
        );


      if (
        !project
      ) {
        return null;
      }


      const userId =
        args[0] as
          string;


      if (
        !await ownsAccessibleProject(
          userId,
          project,
        )
      ) {
        return null;
      }


      return project;
    },
  );


export async function requireProjectOwner(
  ...args:
    OwnedProjectArguments
) {
  const project =
    await getProjectForOwner(
      ...args
    );


  if (
    !project
  ) {
    notFound();
  }


  return project;
}

