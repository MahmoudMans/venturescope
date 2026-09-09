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

              targetValue:
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


        const saved =
          await transaction.projectKpiTarget.upsert({
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


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "SCORECARD",

            action:
              existing
                ?
                  "KPI_TARGET_UPDATED"
                :
                  "KPI_TARGET_CREATED",

            severity:
              "INFO",

            actorUserId,

            entityType:
              "ProjectKpiTarget",

            entityId:
              saved.id,

            summary:
              `${existing ? "KPI target updated" : "KPI target created"}: ${metricCode} ${periodKey}`,

            metadata: {
              periodKey,

              metricCode,

              targetValue:
                saved.targetValue.toString(),

              previousTargetValue:
                existing
                  ?
                    existing.targetValue.toString()
                  :
                    null,
            },
          },
        });


        return saved;
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
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const target =
          await transaction.projectKpiTarget.findFirst({
            where: {
              id:
                targetId,

              projectId,
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


        if (
          !target
        ) {
          throw new Error(
            "KPI target was not found in this project.",
          );
        }


        await transaction.projectKpiTarget.delete({
          where: {
            id:
              target.id,
          },
        });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "SCORECARD",

            action:
              "KPI_TARGET_DELETED",

            severity:
              "WARNING",

            actorUserId,

            entityType:
              "ProjectKpiTarget",

            entityId:
              target.id,

            summary:
              `KPI target deleted: ${target.metricCode} ${target.periodKey}`,

            metadata: {
              periodKey:
                target.periodKey,

              metricCode:
                target.metricCode,

              targetValue:
                target.targetValue.toString(),
            },
          },
        });


        return target;
      },
    );


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
      result.id,
  };
}
