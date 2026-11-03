import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  PortfolioDashboardWorkspace,
} from "@/components/portfolio-dashboard/portfolio-dashboard-workspace";

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
  parseKpiMetricCode,
} from "@/lib/finance/scorecard/metrics";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Portfolio Dashboard",

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


export default async function PortfolioDashboardPage({
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


  const memberships =
    await prisma.workspaceMember.findMany({
      where: {
        userId:
          user.id,
      },

      select: {
        workspaceId:
          true,

        role:
          true,
      },
    });


  const workspaceIds =
    [
      ...new Set(
        memberships.map(
          (
            membership,
          ) =>
            membership.workspaceId,
        ),
      ),
    ];


  const roleByWorkspace =
    new Map(
      memberships.map(
        (
          membership,
        ) => [
          membership.workspaceId,
          membership.role,
        ],
      ),
    );


  const projectWhere = {
    workspaceId: {
      in:
        workspaceIds,
    },
  };


  const [
    accessibleProjectCount,
    storedProjects,
  ] =
    await Promise.all([
      prisma.project.count({
        where:
          projectWhere,
      }),

      prisma.project.findMany({
        where:
          projectWhere,

        select: {
          id:
            true,

          name:
            true,

          industry:
            true,

          currency:
            true,

          workspaceId:
            true,
        },

        take:
          24,
      }),
    ]);


  const projects =
    storedProjects.sort(
      (
        left,
        right,
      ) => {
        if (
          left.id ===
          projectId
        ) {
          return -1;
        }


        if (
          right.id ===
          projectId
        ) {
          return 1;
        }


        return left.name.localeCompare(
          right.name,
        );
      },
    );


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
    storedTargets,
    storedActions,
    storedPeriodStates,
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

          prisma.projectKpiTarget.findMany({
            where: {
              projectId: {
                in:
                  projectIds,
              },
            },

            orderBy: [
              {
                periodKey:
                  "asc",
              },

              {
                metricCode:
                  "asc",
              },
            ],

            take:
              2880,
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

          prisma.financialPeriodState.findMany({
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
        ])
      :
        [
          [],
          [],
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


  const policyByProject =
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


  const targetsByProject =
    new Map<
      string,
      typeof storedTargets
    >();


  for (
    const target
    of storedTargets
  ) {
    const rows =
      targetsByProject.get(
        target.projectId,
      ) ??
      [];


    rows.push(
      target,
    );


    targetsByProject.set(
      target.projectId,
      rows,
    );
  }


  const actionsByProject =
    new Map<
      string,
      typeof storedActions
    >();


  for (
    const action
    of storedActions
  ) {
    const rows =
      actionsByProject.get(
        action.projectId,
      ) ??
      [];


    rows.push(
      action,
    );


    actionsByProject.set(
      action.projectId,
      rows,
    );
  }


  const statesByProject =
    new Map<
      string,
      typeof storedPeriodStates
    >();


  for (
    const state
    of storedPeriodStates
  ) {
    const rows =
      statesByProject.get(
        state.projectId,
      ) ??
      [];


    rows.push(
      state,
    );


    statesByProject.set(
      state.projectId,
      rows,
    );
  }


  const sources =
    projects.map(
      (
        project,
      ) => {
        const storedProjectActuals =
          actualsByProject.get(
            project.id,
          ) ??
          [];


        const actuals =
          storedProjectActuals.map(
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


        const latestActual =
          actuals[
            actuals.length -
            1
          ] ??
          null;


        const policy =
          policyByProject.get(
            project.id,
          );


        const riskPolicy =
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
                    policy
                      .downsideRevenueShock
                      .toString(),
                  ),

                downsideCostInflation:
                  Number(
                    policy
                      .downsideCostInflation
                      .toString(),
                  ),
              }
            :
              DEFAULT_PROJECT_RISK_POLICY;


        const targets =
          (
            targetsByProject.get(
              project.id,
            ) ??
            []
          ).map(
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
                null,
            }),
          );


        const actions =
          (
            actionsByProject.get(
              project.id,
            ) ??
            []
          ).map(
            (
              action,
            ) => ({
              id:
                action.id,

              title:
                action.title,

              priority:
                action.priority,

              status:
                action.status,

              ownerName:
                action.ownerName,

              dueDate:
                action.dueDate
                  ?.toISOString() ??
                null,
            }),
          );


        const latestState =
          latestActual
            ?
              (
                statesByProject.get(
                  project.id,
                ) ??
                []
              )
                .filter(
                  (
                    state,
                  ) =>
                    financialPeriodKeyFromDate(
                      state.period,
                    ) ===
                    latestActual.period,
                )
                .at(
                  -1,
                ) ??
              null
            :
              null;


        const latestPeriodCloseStatus =
          !latestActual
            ?
              "NO_ACTUALS" as const
            :
          latestState?.status ===
            "CLOSED"
            ?
              "CLOSED" as const
            :
              "OPEN" as const;


        return {
          id:
            project.id,

          name:
            project.name,

          industry:
            project.industry ??
            "",

          currency:
            project.currency,

          role:
            project.workspaceId
              ?
                String(
                  roleByWorkspace.get(
                    project.workspaceId,
                  ) ??
                  "VIEWER",
                )
              :
                "VIEWER",

          isCurrentProject:
            project.id ===
            projectId,

          actuals,

          riskPolicy,

          latestActualPeriod:
            latestActual?.period ??
            null,

          latestActualCash:
            latestActual?.cashBalance ??
            null,

          latestPeriodCloseStatus,

          targets,

          actions,
        };
      },
    );


  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Multi-project management
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Portfolio Executive Dashboard
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Compare the projects you can access, identify where management attention is required, review liquidity and funding exposure by currency, and drill directly into project-level decision and reporting workflows.
        </p>
      </header>

      <PortfolioDashboardWorkspace
        currentProjectId={
          projectId
        }
        accessibleProjectCount={
          accessibleProjectCount
        }
        generatedAt={
          new Date()
            .toISOString()
        }
        projects={
          sources
        }
      />
    </div>
  );
}
