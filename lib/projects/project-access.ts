import { notFound } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/db/prisma";

export const getOwnedProject = cache(
  async (
    userId: string,
    projectId: string,
  ) => {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
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
