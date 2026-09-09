import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import type {
  KpiMetricCode,
} from "@/lib/finance/scorecard/types";


const MAX_TARGETS_PER_PROJECT =
  120;


export async function saveProjectKpiTarget({
  projectId,
  actorUserId,
  periodKey,
  metricCode,
  targetValue,
  ownerName,
  note,
}: {
  projectId:
    string;

  actorUserId:
    string;

  periodKey:
    string;

  metricCode:
    KpiMetricCode;

  targetValue:
    number;

  ownerName:
    string |
    null;

  note:
    string |
    null;
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const existing =
          await transaction.projectKpiTarget.findUnique({
            where: {
              projectId_periodKey_metricCode: {
                projectId,

                periodKey,

                metricCode,
              },
            },

            select: {
              id:
                true,
            },
          });


        if (
          !existing
        ) {
          const count =
            await transaction.projectKpiTarget.count({
              where: {
                projectId,
              },
            });


          if (
            count >=
            MAX_TARGETS_PER_PROJECT
          ) {
            throw new Error(
              `A project may contain at most ${MAX_TARGETS_PER_PROJECT} KPI targets.`,
            );
          }
        }


        return transaction.projectKpiTarget.upsert({
          where: {
            projectId_periodKey_metricCode: {
              projectId,

              periodKey,

              metricCode,
            },
          },

          create: {
            projectId,

            periodKey,

            metricCode,

            targetValue,

            ownerName,

            note,

            createdByUserId:
              actorUserId,
          },

          update: {
            targetValue,

            ownerName,

            note,
          },

          select: {
            id:
              true,

            periodKey:
              true,

            metricCode:
              true,

            targetValue:
              true,
          },
        });
      },
    );


  logStructured(
    "info",
    "project.kpi-target.saved",
    {
      projectId,

      actorUserId,

      kpiTargetId:
        result.id,

      periodKey:
        result.periodKey,

      metricCode:
        result.metricCode,
    },
  );


  return result;
}


export async function deleteProjectKpiTarget({
  projectId,
  actorUserId,
  targetId,
}: {
  projectId:
    string;

  actorUserId:
    string;

  targetId:
    string;
}) {
  const result =
    await prisma.projectKpiTarget.deleteMany({
      where: {
        id:
          targetId,

        projectId,
      },
    });


  if (
    result.count !==
    1
  ) {
    throw new Error(
      "KPI target was not found in this project.",
    );
  }


  logStructured(
    "info",
    "project.kpi-target.deleted",
    {
      projectId,

      actorUserId,

      kpiTargetId:
        targetId,
    },
  );


  return {
    id:
      targetId,
  };
}
