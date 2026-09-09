import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";


export async function closeFinancialPeriod({
  projectId,
  actorUserId,
  period,
  periodKey,
  reason,
}: {
  projectId:
    string;

  actorUserId:
    string;

  period:
    Date;

  periodKey:
    string;

  reason:
    string |
    null;
}) {
  const now =
    new Date();


  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const actual =
          await transaction.actualPeriod.findFirst({
            where: {
              projectId,

              period,
            },

            select: {
              id:
                true,
            },
          });


        if (
          !actual
        ) {
          throw new Error(
            `Actuals for ${periodKey} do not exist and cannot be closed.`,
          );
        }


        const existing =
          await transaction.financialPeriodState.findUnique({
            where: {
              projectId_period: {
                projectId,

                period,
              },
            },
          });


        if (
          existing?.status ===
          "CLOSED"
        ) {
          throw new Error(
            `${periodKey} is already closed.`,
          );
        }


        const sequence =
          (
            existing?.closeSequence ??
            0
          ) +
          1;


        const state =
          await transaction.financialPeriodState.upsert({
            where: {
              projectId_period: {
                projectId,

                period,
              },
            },

            create: {
              projectId,

              period,

              status:
                "CLOSED",

              closeSequence:
                sequence,

              closedAt:
                now,

              closedByUserId:
                actorUserId,
            },

            update: {
              status:
                "CLOSED",

              closeSequence:
                sequence,

              closedAt:
                now,

              closedByUserId:
                actorUserId,

              reopenedAt:
                null,

              reopenedByUserId:
                null,
            },
          });


        const event =
          await transaction.financialPeriodEvent.create({
            data: {
              projectId,

              period,

              action:
                "CLOSED",

              actorUserId,

              reason,

              sequence,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "FINANCIAL_CLOSE",

            action:
              "FINANCIAL_PERIOD_CLOSED",

            severity:
              "INFO",

            actorUserId,

            entityType:
              "FinancialPeriodEvent",

            entityId:
              event.id,

            summary:
              `Financial period closed: ${periodKey}`,

            metadata: {
              periodKey,

              closeSequence:
                sequence,

              reason,
            },
          },
        });


        return state;
      },
    );


  logStructured(
    "info",
    "project.financial-period.closed",
    {
      projectId,

      actorUserId,

      periodKey,

      closeSequence:
        result.closeSequence,
    },
  );


  return result;
}


export async function reopenFinancialPeriod({
  projectId,
  actorUserId,
  period,
  periodKey,
  reason,
}: {
  projectId:
    string;

  actorUserId:
    string;

  period:
    Date;

  periodKey:
    string;

  reason:
    string;
}) {
  const now =
    new Date();


  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        const existing =
          await transaction.financialPeriodState.findUnique({
            where: {
              projectId_period: {
                projectId,

                period,
              },
            },
          });


        if (
          !existing ||
          existing.status !==
            "CLOSED"
        ) {
          throw new Error(
            `${periodKey} is not currently closed.`,
          );
        }


        const state =
          await transaction.financialPeriodState.update({
            where: {
              projectId_period: {
                projectId,

                period,
              },
            },

            data: {
              status:
                "OPEN",

              reopenedAt:
                now,

              reopenedByUserId:
                actorUserId,
            },
          });


        const event =
          await transaction.financialPeriodEvent.create({
            data: {
              projectId,

              period,

              action:
                "REOPENED",

              actorUserId,

              reason,

              sequence:
                existing.closeSequence,
            },
          });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "FINANCIAL_CLOSE",

            action:
              "FINANCIAL_PERIOD_REOPENED",

            severity:
              "WARNING",

            actorUserId,

            entityType:
              "FinancialPeriodEvent",

            entityId:
              event.id,

            summary:
              `Financial period reopened: ${periodKey}`,

            metadata: {
              periodKey,

              closeSequence:
                existing.closeSequence,

              reason,
            },
          },
        });


        return state;
      },
    );


  logStructured(
    "warn",
    "project.financial-period.reopened",
    {
      projectId,

      actorUserId,

      periodKey,

      closeSequence:
        result.closeSequence,
    },
  );


  return result;
}
