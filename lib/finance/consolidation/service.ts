import {
  prisma,
} from "@/lib/db/prisma";

import type {
  VentureScopeCurrency,
} from "@/lib/finance/consolidation/types";


const MAX_WORKSPACE_FX_RATES =
  500;


export async function saveConsolidationSettings({
  projectId,
  workspaceId,
  actorUserId,
  reportingCurrency,
}: {
  projectId:
    string;

  workspaceId:
    string;

  actorUserId:
    string;

  reportingCurrency:
    VentureScopeCurrency;
}) {
  return prisma.$transaction(
    async (
      transaction,
    ) => {
      const settings =
        await transaction.workspaceConsolidationSettings.upsert({
          where: {
            workspaceId,
          },

          create: {
            workspaceId,

            reportingCurrency,

            createdByUserId:
              actorUserId,

            updatedByUserId:
              actorUserId,
          },

          update: {
            reportingCurrency,

            updatedByUserId:
              actorUserId,
          },
        });


      await transaction.projectAuditEvent.create({
        data: {
          projectId,

          category:
            "PROJECT",

          action:
            "CONSOLIDATION_REPORTING_CURRENCY_UPDATED",

          severity:
            "INFO",

          actorUserId,

          entityType:
            "WorkspaceConsolidationSettings",

          entityId:
            workspaceId,

          summary:
            `Consolidation reporting currency set to ${reportingCurrency}`,

          metadata: {
            workspaceId,

            reportingCurrency,
          },
        },
      });


      return settings;
    },
  );
}


export async function saveWorkspaceFxRate({
  projectId,
  workspaceId,
  actorUserId,
  baseCurrency,
  quoteCurrency,
  rate,
  effectiveDate,
  sourceLabel,
}: {
  projectId:
    string;

  workspaceId:
    string;

  actorUserId:
    string;

  baseCurrency:
    VentureScopeCurrency;

  quoteCurrency:
    VentureScopeCurrency;

  rate:
    number;

  effectiveDate:
    Date;

  sourceLabel:
    string;
}) {
  return prisma.$transaction(
    async (
      transaction,
    ) => {
      const existing =
        await transaction.workspaceFxRate.findUnique({
          where: {
            workspaceId_baseCurrency_quoteCurrency_effectiveDate: {
              workspaceId,

              baseCurrency,

              quoteCurrency,

              effectiveDate,
            },
          },

          select: {
            id:
              true,

            rate:
              true,
          },
        });


      if (
        !existing
      ) {
        const count =
          await transaction.workspaceFxRate.count({
            where: {
              workspaceId,
            },
          });


        if (
          count >=
          MAX_WORKSPACE_FX_RATES
        ) {
          throw new Error(
            `A workspace may contain at most ${MAX_WORKSPACE_FX_RATES} manual FX rates.`,
          );
        }
      }


      const saved =
        await transaction.workspaceFxRate.upsert({
          where: {
            workspaceId_baseCurrency_quoteCurrency_effectiveDate: {
              workspaceId,

              baseCurrency,

              quoteCurrency,

              effectiveDate,
            },
          },

          create: {
            workspaceId,

            baseCurrency,

            quoteCurrency,

            rate,

            effectiveDate,

            sourceLabel,

            createdByUserId:
              actorUserId,
          },

          update: {
            rate,

            sourceLabel,
          },
        });


      await transaction.projectAuditEvent.create({
        data: {
          projectId,

          category:
            "PROJECT",

          action:
            existing
              ?
                "WORKSPACE_FX_RATE_UPDATED"
              :
                "WORKSPACE_FX_RATE_CREATED",

          severity:
            "INFO",

          actorUserId,

          entityType:
            "WorkspaceFxRate",

          entityId:
            saved.id,

          summary:
            `${baseCurrency}/${quoteCurrency} FX rate ${existing ? "updated" : "created"}`,

          metadata: {
            workspaceId,

            baseCurrency,

            quoteCurrency,

            rate,

            effectiveDate:
              effectiveDate
                .toISOString()
                .slice(
                  0,
                  10,
                ),

            sourceLabel,

            previousRate:
              existing?.rate
                .toString() ??
              null,
          },
        },
      });


      return saved;
    },
  );
}


export async function deleteWorkspaceFxRate({
  projectId,
  workspaceId,
  actorUserId,
  rateId,
}: {
  projectId:
    string;

  workspaceId:
    string;

  actorUserId:
    string;

  rateId:
    string;
}) {
  return prisma.$transaction(
    async (
      transaction,
    ) => {
      const rate =
        await transaction.workspaceFxRate.findFirst({
          where: {
            id:
              rateId,

            workspaceId,
          },
        });


      if (
        !rate
      ) {
        throw new Error(
          "FX rate was not found in this workspace.",
        );
      }


      await transaction.workspaceFxRate.delete({
        where: {
          id:
            rate.id,
        },
      });


      await transaction.projectAuditEvent.create({
        data: {
          projectId,

          category:
            "PROJECT",

          action:
            "WORKSPACE_FX_RATE_DELETED",

          severity:
            "WARNING",

          actorUserId,

          entityType:
            "WorkspaceFxRate",

          entityId:
            rate.id,

          summary:
            `${rate.baseCurrency}/${rate.quoteCurrency} FX rate deleted`,

          metadata: {
            workspaceId,

            baseCurrency:
              rate.baseCurrency,

            quoteCurrency:
              rate.quoteCurrency,

            rate:
              rate.rate.toString(),

            effectiveDate:
              rate.effectiveDate
                .toISOString()
                .slice(
                  0,
                  10,
                ),

            sourceLabel:
              rate.sourceLabel,
          },
        },
      });


      return rate;
    },
  );
}
