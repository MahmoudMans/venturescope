import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import type {
  VarianceCauseCode,
  VarianceCommentaryStatus,
  VarianceMetricCode,
  VarianceNature,
} from "@/lib/finance/variance-review/types";


const MAX_COMMENTARIES_PER_PROJECT =
  1000;


export async function saveVarianceCommentary({
  projectId,
  actorUserId,
  periodKey,
  metricCode,
  causeCode,
  varianceNature,
  explanation,
  correctiveAction,
  ownerName,
  recoveryPeriodKey,
  status,
}: {
  projectId:
    string;

  actorUserId:
    string;

  periodKey:
    string;

  metricCode:
    VarianceMetricCode;

  causeCode:
    VarianceCauseCode;

  varianceNature:
    VarianceNature;

  explanation:
    string;

  correctiveAction:
    string |
    null;

  ownerName:
    string |
    null;

  recoveryPeriodKey:
    string |
    null;

  status:
    VarianceCommentaryStatus;
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const existing =
          await transaction.varianceCommentary.findUnique({
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

              status:
                true,

              causeCode:
                true,
            },
          });


        if (
          !existing
        ) {
          const count =
            await transaction.varianceCommentary.count({
              where: {
                projectId,
              },
            });


          if (
            count >=
            MAX_COMMENTARIES_PER_PROJECT
          ) {
            throw new Error(
              `A project may contain at most ${MAX_COMMENTARIES_PER_PROJECT} variance commentaries.`,
            );
          }
        }


        const saved =
          await transaction.varianceCommentary.upsert({
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

              causeCode,

              varianceNature,

              explanation,

              correctiveAction,

              ownerName,

              recoveryPeriodKey,

              status,

              createdByUserId:
                actorUserId,
            },

            update: {
              causeCode,

              varianceNature,

              explanation,

              correctiveAction,

              ownerName,

              recoveryPeriodKey,

              status,
            },

            select: {
              id:
                true,

              periodKey:
                true,

              metricCode:
                true,

              status:
                true,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "VARIANCE_REVIEW",

            action:
              existing
                ?
                  "VARIANCE_COMMENTARY_UPDATED"
                :
                  "VARIANCE_COMMENTARY_CREATED",

            severity:
              status ===
                "OPEN"
                ?
                  "WARNING"
                :
                  "INFO",

            actorUserId,

            entityType:
              "VarianceCommentary",

            entityId:
              saved.id,

            summary:
              `${existing ? "Variance commentary updated" : "Variance commentary created"}: ${metricCode} ${periodKey}`,

            metadata: {
              periodKey,

              metricCode,

              causeCode,

              varianceNature,

              status,

              previousStatus:
                existing?.status ??
                null,

              previousCauseCode:
                existing?.causeCode ??
                null,

              recoveryPeriodKey,
            },
          },
        });


        return saved;
      },
    );


  logStructured(
    "info",
    "project.variance-commentary.saved",
    {
      projectId,

      actorUserId,

      varianceCommentaryId:
        result.id,

      periodKey:
        result.periodKey,

      metricCode:
        result.metricCode,

      status:
        result.status,
    },
  );


  return result;
}


export async function deleteVarianceCommentary({
  projectId,
  actorUserId,
  commentaryId,
}: {
  projectId:
    string;

  actorUserId:
    string;

  commentaryId:
    string;
}) {
  const commentary =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const existing =
          await transaction.varianceCommentary.findFirst({
            where: {
              id:
                commentaryId,

              projectId,
            },

            select: {
              id:
                true,

              periodKey:
                true,

              metricCode:
                true,

              status:
                true,

              causeCode:
                true,
            },
          });


        if (
          !existing
        ) {
          throw new Error(
            "Variance commentary was not found in this project.",
          );
        }


        await transaction.varianceCommentary.delete({
          where: {
            id:
              existing.id,
          },
        });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "VARIANCE_REVIEW",

            action:
              "VARIANCE_COMMENTARY_DELETED",

            severity:
              "WARNING",

            actorUserId,

            entityType:
              "VarianceCommentary",

            entityId:
              existing.id,

            summary:
              `Variance commentary deleted: ${existing.metricCode} ${existing.periodKey}`,

            metadata: {
              periodKey:
                existing.periodKey,

              metricCode:
                existing.metricCode,

              status:
                existing.status,

              causeCode:
                existing.causeCode,
            },
          },
        });


        return existing;
      },
    );


  logStructured(
    "info",
    "project.variance-commentary.deleted",
    {
      projectId,

      actorUserId,

      varianceCommentaryId:
        commentaryId,
    },
  );


  return {
    id:
      commentary.id,
  };
}
