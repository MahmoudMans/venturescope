import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ConsolidationWorkspace,
} from "@/components/consolidation/consolidation-workspace";

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
  financialPeriodKeyFromDate,
} from "@/lib/finance/period-close/validation";

import {
  isProjectWorkspaceOwner,
} from "@/lib/finance/period-close/access";

import {
  parseVentureScopeCurrency,
} from "@/lib/finance/consolidation/validation";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Consolidation Center",

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


export default async function ConsolidationCenterPage({
  params,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    projectId,
  } =
    await params;


  const currentProject =
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !currentProject
  ) {
    notFound();
  }


  const workspaceProject =
    await prisma.project.findUnique({
      where: {
        id:
          projectId,
      },

      select: {
        workspaceId:
          true,
      },
    });


  if (
    !workspaceProject?.workspaceId
  ) {
    notFound();
  }


  const workspaceId =
    workspaceProject.workspaceId;


  const [
    editable,
    settings,
    storedRates,
    projects,
  ] =
    await Promise.all([
      isProjectWorkspaceOwner(
        user.id,
        projectId,
      ),

      prisma.workspaceConsolidationSettings.findUnique({
        where: {
          workspaceId,
        },
      }),

      prisma.workspaceFxRate.findMany({
        where: {
          workspaceId,
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
            effectiveDate:
              "desc",
          },

          {
            baseCurrency:
              "asc",
          },

          {
            quoteCurrency:
              "asc",
          },
        ],

        take:
          500,
      }),

      prisma.project.findMany({
        where: {
          workspaceId,
        },

        select: {
          id:
            true,

          name:
            true,

          industry:
            true,

          currency:
            true,
        },

        orderBy: {
          name:
            "asc",
        },

        take:
          24,
      }),
    ]);


  const projectIds =
    projects.map(
      (
        project,
      ) =>
        project.id,
    );


  const [
    storedActuals,
    storedPolicies,
    storedActions,
  ] =
    projectIds.length >
      0
      ?
        await Promise.all([
          prisma.actualPeriod.findMany({
            where: {
              projectId: {
                in:
                  projectIds,
              },
            },

            orderBy: {
              period:
                "asc",
            },
          }),

          prisma.projectRiskPolicy.findMany({
            where: {
              projectId: {
                in:
                  projectIds,
              },
            },
          }),

          prisma.decisionAction.findMany({
            where: {
              projectId: {
                in:
                  projectIds,
              },
            },

            take:
              1000,
          }),
        ])
      :
        [
          [],
          [],
          [],
        ];


  const actualsByProject =
    new Map<
      string,
      typeof storedActuals
    >();


  for (
    const actual
    of storedActuals
  ) {
    const rows =
      actualsByProject.get(
        actual.projectId,
      ) ??
      [];


    rows.push(
      actual,
    );


    actualsByProject.set(
      actual.projectId,
      rows,
    );
  }


  const policies =
    new Map(
      storedPolicies.map(
        (
          policy,
        ) => [
          policy.projectId,
          policy,
        ],
      ),
    );


  const actions =
    new Map<
      string,
      typeof storedActions
    >();


  for (
    const action
    of storedActions
  ) {
    const rows =
      actions.get(
        action.projectId,
      ) ??
      [];


    rows.push(
      action,
    );


    actions.set(
      action.projectId,
      rows,
    );
  }


  const sources =
    projects.map(
      (
        project,
      ) => {
        const sourceActuals =
          (
            actualsByProject.get(
              project.id,
            ) ??
            []
          ).map(
            (
              row,
            ) => ({
              period:
                financialPeriodKeyFromDate(
                  row.period,
                ),

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


        const latest =
          sourceActuals[
            sourceActuals.length -
            1
          ] ??
          null;


        const policy =
          policies.get(
            project.id,
          );


        return {
          id:
            project.id,

          name:
            project.name,

          industry:
            project.industry ??
            "",

          currency:
            parseVentureScopeCurrency(
              project.currency,
            ),

          actuals:
            sourceActuals,

          riskPolicy:
            policy
              ?
                {
                  minimumCash:
                    decimalNumber(
                      policy.minimumCash,
                    ),

                  minimumRunwayMonths:
                    policy.minimumRunwayMonths,

                  minimumEbitdaMargin:
                    decimalNumber(
                      policy.minimumEbitdaMargin,
                    ),

                  maximumMonthlyBurn:
                    decimalNumber(
                      policy.maximumMonthlyBurn,
                    ),

                  downsideRevenueShock:
                    Number(
                      policy.downsideRevenueShock
                        .toString(),
                    ),

                  downsideCostInflation:
                    Number(
                      policy.downsideCostInflation
                        .toString(),
                    ),
                }
              :
                DEFAULT_PROJECT_RISK_POLICY,

          latestActualPeriod:
            latest?.period ??
            null,

          latestActualCash:
            latest?.cashBalance ??
            null,

          actions:
            (
              actions.get(
                project.id,
              ) ??
              []
            ).map(
              (
                action,
              ) => ({
                status:
                  action.status,

                priority:
                  action.priority,

                dueDate:
                  action.dueDate
                    ?.toISOString() ??
                  null,
              }),
            ),
        };
      },
    );


  const rates =
    storedRates.map(
      (
        rate,
      ) => ({
        id:
          rate.id,

        baseCurrency:
          parseVentureScopeCurrency(
            rate.baseCurrency,
          ),

        quoteCurrency:
          parseVentureScopeCurrency(
            rate.quoteCurrency,
          ),

        rate:
          Number(
            rate.rate
              .toString(),
          ),

        effectiveDate:
          rate.effectiveDate
            .toISOString()
            .slice(
              0,
              10,
            ),

        sourceLabel:
          rate.sourceLabel,

        createdBy:
          rate.createdBy?.name ??
          rate.createdBy?.email ??
          null,

        createdAt:
          rate.createdAt
            .toISOString(),
      }),
    );


  const reportingCurrency =
    settings
      ?
        parseVentureScopeCurrency(
          settings.reportingCurrency,
        )
      :
        parseVentureScopeCurrency(
          currentProject.currency,
        );


  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Consolidated financial reporting
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Consolidation Center
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Convert and consolidate workspace project metrics into one reporting currency using manually governed, dated FX rates while preserving original currencies, rate provenance, and explicit missing-rate controls.
        </p>
      </header>

      <ConsolidationWorkspace
        projectId={
          projectId
        }
        generatedAt={
          new Date()
            .toISOString()
        }
        editable={
          editable
        }
        reportingCurrency={
          reportingCurrency
        }
        rates={
          rates
        }
        projects={
          sources
        }
      />
    </main>
  );
}
