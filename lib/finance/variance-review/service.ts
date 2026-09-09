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


        return transaction.varianceCommentary.upsert({
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
  const result =
    await prisma.varianceCommentary.deleteMany({
      where: {
        id:
          commentaryId,

        projectId,
      },
    });


  if (
    result.count !==
    1
  ) {
    throw new Error(
      "Variance commentary was not found in this project.",
    );
  }


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
      commentaryId,
  };
}
