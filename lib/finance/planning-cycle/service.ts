import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import {
  newForecastBaselineSnapshot,
} from "@/lib/finance/planning-cycle/baseline";

import type {
  ForecastBaselineKind,
} from "@/lib/finance/planning-cycle/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";


const MAX_BASELINES =
  20;


export async function createForecastBaseline({
  projectId,
  actorUserId,
  name,
  kind,
  modelVersion,
  rows,
}: {
  projectId:
    string;

  actorUserId:
    string;

  name:
    string;

  kind:
    ForecastBaselineKind;

  modelVersion:
    string;

  rows:
    ForecastAnalyticsRow[];
}) {
  const snapshot =
    newForecastBaselineSnapshot(
      rows,
    );


  const baseline =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const count =
          await transaction.forecastBaseline.count({
            where: {
              projectId,
            },
          });


        if (
          count >=
          MAX_BASELINES
        ) {
          throw new Error(
            `A project may contain at most ${MAX_BASELINES} immutable forecast baselines.`,
          );
        }


        return transaction.forecastBaseline.create({
          data: {
            projectId,

            name,

            kind,

            modelVersion,

            snapshot:
              snapshot as never,

            createdByUserId:
              actorUserId,
          },

          select: {
            id:
              true,

            name:
              true,

            kind:
              true,

            createdAt:
              true,
          },
        });
      },
    );


  logStructured(
    "info",
    "project.forecast-baseline.created",
    {
      projectId,

      actorUserId,

      baselineId:
        baseline.id,

      baselineName:
        baseline.name,

      baselineKind:
        baseline.kind,
    },
  );


  return baseline;
}
