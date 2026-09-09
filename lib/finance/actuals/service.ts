import {
  prisma,
} from "@/lib/db/prisma";

import {
  logStructured,
} from "@/lib/observability/logger";

import type {
  ActualImportRow,
} from "@/lib/finance/actuals/types";


export async function importActualPeriods({
  projectId,
  actorUserId,
  rows,
}: {
  projectId:
    string;

  actorUserId:
    string;

  rows:
    ActualImportRow[];
}) {
  const result =
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        for (
          const row
          of rows
        ) {
          await transaction.actualPeriod.upsert({
            where: {
              projectId_period: {
                projectId,

                period:
                  row.period,
              },
            },

            create: {
              projectId,

              period:
                row.period,

              revenue:
                row.revenue,

              cogs:
                row.cogs,

              operatingExpenses:
                row.operatingExpenses,

              ebitda:
                row.ebitda,

              netIncome:
                row.netIncome,

              cashFlow:
                row.cashFlow,

              cashBalance:
                row.cashBalance,

              mrr:
                row.mrr,

              customers:
                row.customers,

              source:
                "CSV",
            },

            update: {
              revenue:
                row.revenue,

              cogs:
                row.cogs,

              operatingExpenses:
                row.operatingExpenses,

              ebitda:
                row.ebitda,

              netIncome:
                row.netIncome,

              cashFlow:
                row.cashFlow,

              cashBalance:
                row.cashBalance,

              mrr:
                row.mrr,

              customers:
                row.customers,

              source:
                "CSV",
            },
          });
        }


        return {
          imported:
            rows.length,
        };
      },
    );


  logStructured(
    "info",
    "project.actuals.imported",
    {
      projectId,

      actorUserId,

      importedPeriods:
        result.imported,
    },
  );


  return result;
}


export async function clearProjectActuals({
  projectId,
  actorUserId,
}: {
  projectId:
    string;

  actorUserId:
    string;
}) {
  const result =
    await prisma.actualPeriod.deleteMany({
      where: {
        projectId,
      },
    });


  logStructured(
    "info",
    "project.actuals.cleared",
    {
      projectId,

      actorUserId,

      deletedPeriods:
        result.count,
    },
  );


  return result;
}
