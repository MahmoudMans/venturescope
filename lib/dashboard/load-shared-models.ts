import { cache } from "react";

import { toSharedModels, type SharedModel } from "@/lib/dashboard/shared-models";
import { prisma } from "@/lib/db/prisma";

/**
 * Models that other people own but share with the signed-in person through a
 * workspace they own or belong to. Same visibility rule as getOwnedProject.
 * The layout and the dashboard both ask, so the answer is cached per request.
 */
export const loadSharedModels = cache(async (userId: string): Promise<SharedModel[]> => {
  const rows = await prisma.project.findMany({
    where: {
      userId: {
        not: userId,
      },

      workspace: {
        is: {
          OR: [
            {
              ownerId: userId,
            },

            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      },
    },

    orderBy: {
      updatedAt: "desc",
    },

    take: 50,

    select: {
      id: true,

      userId: true,

      name: true,

      industry: true,

      currency: true,

      horizonMonths: true,

      updatedAt: true,

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

  return toSharedModels(rows, userId);
});
