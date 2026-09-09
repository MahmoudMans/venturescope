import {
  prisma,
} from "@/lib/db/prisma";

import {
  financialPeriodDate,
} from "@/lib/finance/period-close/validation";

import {
  validateDataImportCsv,
} from "@/lib/data-import/validation";

import type {
  DataImportIssue,
  DataImportType,
  NormalizedActualImportRow,
  NormalizedKpiImportRow,
  NormalizedVarianceImportRow,
} from "@/lib/data-import/types";


function failureText(
  cause:
    unknown,
): string {
  return cause instanceof Error
    ?
      cause.message.slice(
        0,
        500,
      )
    :
      "Data import failed.";
}


function rejectedRows(
  issues:
    DataImportIssue[],
): number {
  return new Set(
    issues.map(
      (
        issue,
      ) =>
        issue.row,
    ),
  ).size;
}


export async function applyGovernedDataImport({
  projectId,
  actorUserId,
  importType,
  fileName,
  csv,
}: {
  projectId:
    string;

  actorUserId:
    string;

  importType:
    DataImportType;

  fileName:
    string;

  csv:
    string;
}) {
  const validation =
    validateDataImportCsv({
      importType,

      csv,
    });


  const batch =
    await prisma.dataImportBatch.create({
      data: {
        projectId,

        importType,

        fileName,

        status:
          "PROCESSING",

        rowCount:
          validation.rowCount,

        createdByUserId:
          actorUserId,
      },

      select: {
        id:
          true,
      },
    });


  if (
    validation.issues.length >
    0
  ) {
    const rejected =
      rejectedRows(
        validation.issues,
      );


    await prisma.$transaction(
      async (
        transaction,
      ) => {
        await transaction.dataImportBatch.update({
          where: {
            id:
              batch.id,
          },

          data: {
            status:
              "FAILED",

            rejectedCount:
              rejected,

            completedAt:
              new Date(),

            errorSummary: {
              message:
                "CSV validation failed.",

              issues:
                validation.issues.slice(
                  0,
                  50,
                ),
            } as never,
          },
        });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "PROJECT",

            action:
              "DATA_IMPORT_VALIDATION_FAILED",

            severity:
              "WARNING",

            actorUserId,

            entityType:
              "DataImportBatch",

            entityId:
              batch.id,

            summary:
              `Data import validation failed: ${fileName}`,

            metadata: {
              importType,

              rowCount:
                validation.rowCount,

              rejectedCount:
                rejected,
            },
          },
        });
      },
    );


    throw new Error(
      `Import contains ${validation.issues.length} validation issue${
        validation.issues.length ===
          1
          ?
            ""
          :
            "s"
      }.`,
    );
  }


  try {
    const result =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          let inserted =
            0;

          let updated =
            0;


          if (
            importType ===
            "ACTUALS"
          ) {
            const rows =
              validation.rows.filter(
                (
                  row,
                ): row is
                  NormalizedActualImportRow =>
                    row.kind ===
                    "ACTUALS",
              );


            for (
              const row
              of rows
            ) {
              const period =
                financialPeriodDate(
                  row.periodKey,
                );


              const existing =
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


              const data = {
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
              };


              if (
                existing
              ) {
                await transaction.actualPeriod.update({
                  where: {
                    id:
                      existing.id,
                  },

                  data,
                });


                updated +=
                  1;
              }
              else {
                await transaction.actualPeriod.create({
                  data: {
                    projectId,

                    period,

                    ...data,
                  },
                });


                inserted +=
                  1;
              }
            }
          }


          if (
            importType ===
            "KPI_TARGETS"
          ) {
            const rows =
              validation.rows.filter(
                (
                  row,
                ): row is
                  NormalizedKpiImportRow =>
                    row.kind ===
                    "KPI_TARGETS",
              );


            for (
              const row
              of rows
            ) {
              const existing =
                await transaction.projectKpiTarget.findUnique({
                  where: {
                    projectId_periodKey_metricCode: {
                      projectId,

                      periodKey:
                        row.periodKey,

                      metricCode:
                        row.metricCode,
                    },
                  },

                  select: {
                    id:
                      true,
                  },
                });


              if (
                existing
              ) {
                await transaction.projectKpiTarget.update({
                  where: {
                    id:
                      existing.id,
                  },

                  data: {
                    targetValue:
                      row.targetValue,

                    ownerName:
                      row.ownerName,

                    note:
                      row.note,
                  },
                });


                updated +=
                  1;
              }
              else {
                await transaction.projectKpiTarget.create({
                  data: {
                    projectId,

                    periodKey:
                      row.periodKey,

                    metricCode:
                      row.metricCode,

                    targetValue:
                      row.targetValue,

                    ownerName:
                      row.ownerName,

                    note:
                      row.note,

                    createdByUserId:
                      actorUserId,
                  },
                });


                inserted +=
                  1;
              }
            }
          }


          if (
            importType ===
            "VARIANCE_COMMENTARY"
          ) {
            const rows =
              validation.rows.filter(
                (
                  row,
                ): row is
                  NormalizedVarianceImportRow =>
                    row.kind ===
                    "VARIANCE_COMMENTARY",
              );


            for (
              const row
              of rows
            ) {
              const existing =
                await transaction.varianceCommentary.findUnique({
                  where: {
                    projectId_periodKey_metricCode: {
                      projectId,

                      periodKey:
                        row.periodKey,

                      metricCode:
                        row.metricCode,
                    },
                  },

                  select: {
                    id:
                      true,
                  },
                });


              const data = {
                causeCode:
                  row.causeCode,

                varianceNature:
                  row.varianceNature,

                explanation:
                  row.explanation,

                correctiveAction:
                  row.correctiveAction,

                ownerName:
                  row.ownerName,

                recoveryPeriodKey:
                  row.recoveryPeriodKey,

                status:
                  row.status,
              };


              if (
                existing
              ) {
                await transaction.varianceCommentary.update({
                  where: {
                    id:
                      existing.id,
                  },

                  data,
                });


                updated +=
                  1;
              }
              else {
                await transaction.varianceCommentary.create({
                  data: {
                    projectId,

                    periodKey:
                      row.periodKey,

                    metricCode:
                      row.metricCode,

                    ...data,

                    createdByUserId:
                      actorUserId,
                  },
                });


                inserted +=
                  1;
              }
            }
          }


          await transaction.dataImportBatch.update({
            where: {
              id:
                batch.id,
            },

            data: {
              status:
                "SUCCEEDED",

              insertedCount:
                inserted,

              updatedCount:
                updated,

              rejectedCount:
                0,

              completedAt:
                new Date(),
            },
          });


          await transaction.projectAuditEvent.create({
            data: {
              projectId,

              category:
                "PROJECT",

              action:
                "DATA_IMPORT_APPLIED",

              severity:
                "INFO",

              actorUserId,

              entityType:
                "DataImportBatch",

              entityId:
                batch.id,

              summary:
                `Data import applied: ${fileName}`,

              metadata: {
                importType,

                rowCount:
                  validation.rowCount,

                insertedCount:
                  inserted,

                updatedCount:
                  updated,
              },
            },
          });


          return {
            inserted,

            updated,
          };
        },
      );


    return {
      batchId:
        batch.id,

      rowCount:
        validation.rowCount,

      insertedCount:
        result.inserted,

      updatedCount:
        result.updated,
    };
  }
  catch (
    cause
  ) {
    const message =
      failureText(
        cause,
      );


    await prisma.$transaction(
      async (
        transaction,
      ) => {
        await transaction.dataImportBatch.update({
          where: {
            id:
              batch.id,
          },

          data: {
            status:
              "FAILED",

            rejectedCount:
              validation.rowCount,

            completedAt:
              new Date(),

            errorSummary: {
              message,
            } as never,
          },
        });


        await transaction.projectAuditEvent.create({
          data: {
            projectId,

            category:
              "PROJECT",

            action:
              "DATA_IMPORT_FAILED",

            severity:
              "WARNING",

            actorUserId,

            entityType:
              "DataImportBatch",

            entityId:
              batch.id,

            summary:
              `Data import failed: ${fileName}`,

            metadata: {
              importType,

              rowCount:
                validation.rowCount,

              message,
            },
          },
        });
      },
    );


    throw new Error(
      message,
    );
  }
}
