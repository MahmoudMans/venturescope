import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ScorecardWorkspace,
} from "@/components/scorecard/scorecard-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  DEFAULT_PROJECT_RISK_POLICY,
} from "@/lib/finance/risk-center/policy";

import {
  parseKpiMetricCode,
} from "@/lib/finance/scorecard/metrics";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Management Scorecard",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


function decimalNumber(
  value:
    {
      toString():
        string;
    } |
    null,
): number |
  null {
  return value ===
    null
    ?
      null
    :
      Number(
        value.toString(),
      );
}


export default async function ScorecardPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;

  searchParams:
    Promise<{
      status?:
        string;

      message?:
        string;
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    projectId,
  } =
    await params;


  const project =
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !project
  ) {
    notFound();
  }


  const [
    editableProject,
    storedActuals,
    storedPolicy,
    storedTargets,
    status,
  ] =
    await Promise.all([
      getProjectForEditor(
        user.id,
        projectId,
      ),

      prisma.actualPeriod.findMany({
        where: {
          projectId,
        },

        orderBy: {
          period:
            "asc",
        },
      }),

      prisma.projectRiskPolicy.findUnique({
        where: {
          projectId,
        },
      }),

      prisma.projectKpiTarget.findMany({
        where: {
          projectId,
        },

        include: {
          createdBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },
        },

        orderBy: [
          {
            periodKey:
              "desc",
          },

          {
            metricCode:
              "asc",
          },
        ],

        take:
          120,
      }),

      searchParams,
    ]);


  const actuals =
    storedActuals.map(
      (
        row,
      ) => ({
        period:
          `${row.period
            .getUTCFullYear()
            .toString()
            .padStart(
              4,
              "0",
            )}-${(
            row.period.getUTCMonth() +
            1
          )
            .toString()
            .padStart(
              2,
              "0",
            )}`,

        revenue:
          decimalNumber(
            row.revenue,
          ),

        cogs:
          decimalNumber(
            row.cogs,
          ),

        operatingExpenses:
          decimalNumber(
            row.operatingExpenses,
          ),

        ebitda:
          decimalNumber(
            row.ebitda,
          ),

        netIncome:
          decimalNumber(
            row.netIncome,
          ),

        cashFlow:
          decimalNumber(
            row.cashFlow,
          ),

        cashBalance:
          decimalNumber(
            row.cashBalance,
          ),

        mrr:
          decimalNumber(
            row.mrr,
          ),

        customers:
          row.customers,
      }),
    );


  const riskPolicy =
    storedPolicy
      ?
        {
          minimumCash:
            decimalNumber(
              storedPolicy.minimumCash,
            ),

          minimumRunwayMonths:
            storedPolicy.minimumRunwayMonths,

          minimumEbitdaMargin:
            decimalNumber(
              storedPolicy.minimumEbitdaMargin,
            ),

          maximumMonthlyBurn:
            decimalNumber(
              storedPolicy.maximumMonthlyBurn,
            ),

          downsideRevenueShock:
            Number(
              storedPolicy
                .downsideRevenueShock
                .toString(),
            ),

          downsideCostInflation:
            Number(
              storedPolicy
                .downsideCostInflation
                .toString(),
            ),
        }
      :
        DEFAULT_PROJECT_RISK_POLICY;


  const latestActual =
    actuals[
      actuals.length -
      1
    ] ??
    null;


  const targets =
    storedTargets.map(
      (
        target,
      ) => ({
        id:
          target.id,

        periodKey:
          target.periodKey,

        metricCode:
          parseKpiMetricCode(
            target.metricCode,
          ),

        targetValue:
          Number(
            target.targetValue
              .toString(),
          ),

        ownerName:
          target.ownerName,

        note:
          target.note,

        createdAt:
          target.createdAt
            .toISOString(),

        updatedAt:
          target.updatedAt
            .toISOString(),

        createdBy:
          target.createdBy?.name ??
          target.createdBy?.email ??
          null,
      }),
    );


  const defaultPeriod =
    latestActual?.period ??
    new Date()
      .toISOString()
      .slice(
        0,
        7,
      );


  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Management performance
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          KPI Targets &amp; Management Scorecard
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Define management commitments and compare them with Actuals, the live forecast, runway, and historical forecast accuracy.
        </p>
      </header>

      {
        status.status
          ?
            (
              <div
                role={
                  status.status ===
                    "error"
                    ?
                      "alert"
                    :
                      "status"
                }
                className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
              >
                {
                  status.status ===
                    "saved"
                    ?
                      "KPI target saved successfully."
                    :
                  status.status ===
                    "deleted"
                    ?
                      "KPI target deleted successfully."
                    :
                      status.message ??
                      "The scorecard operation could not be completed."
                }
              </div>
            )
          :
            null
      }

      <ScorecardWorkspace
        projectId={
          projectId
        }
        currency={
          project.currency
        }
        editable={
          Boolean(
            editableProject,
          )
        }
        defaultPeriod={
          defaultPeriod
        }
        actuals={
          actuals
        }
        riskPolicy={
          riskPolicy
        }
        latestActualPeriod={
          latestActual?.period ??
          null
        }
        latestActualCash={
          latestActual?.cashBalance ??
          null
        }
        targets={
          targets
        }
      />
    </div>
  );
}
