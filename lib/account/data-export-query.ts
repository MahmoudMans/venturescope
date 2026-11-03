import { exportedWorkspaceRole, type DataExportSource } from "@/lib/account/data-export";
import { prisma } from "@/lib/db/prisma";

/**
 * Reads everything that belongs to one person: the profile, the workspaces they
 * own or belong to, and the models they own. Models that other people own are
 * left out, even when this person can open them. The password hash and the other
 * sign-in fields are never selected.
 */
export async function loadDataExportSource(userId: string): Promise<DataExportSource | null> {
  const account = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      name: true,

      email: true,

      createdAt: true,

      passwordChangedAt: true,
    },
  });

  if (account === null) {
    return null;
  }

  const [workspaces, projects] = await Promise.all([
    prisma.workspace.findMany({
      where: {
        OR: [
          {
            ownerId: userId,
          },

          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },

      orderBy: [
        {
          createdAt: "asc",
        },

        {
          id: "asc",
        },
      ],

      select: {
        name: true,

        ownerId: true,

        createdAt: true,

        members: {
          where: {
            userId,
          },

          select: {
            role: true,
          },

          take: 1,
        },
      },
    }),

    prisma.project.findMany({
      where: {
        userId,
      },

      orderBy: [
        {
          createdAt: "asc",
        },

        {
          id: "asc",
        },
      ],

      select: {
        name: true,

        industry: true,

        currency: true,

        startMonth: true,

        horizonMonths: true,

        revenueMode: true,

        baseAssumptions: true,

        createdAt: true,

        updatedAt: true,

        workspace: {
          select: {
            name: true,
          },
        },

        scenarios: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,

            name: true,

            type: true,

            modifiers: true,
          },
        },

        financingEvents: {
          orderBy: {
            month: "asc",
          },

          select: {
            name: true,

            type: true,

            month: true,

            amount: true,

            apr: true,

            termMonths: true,

            repaymentStartMonth: true,
          },
        },

        monthlyOverrides: {
          orderBy: {
            month: "asc",
          },

          select: {
            scenarioId: true,

            month: true,

            values: true,

            note: true,
          },
        },

        actualPeriods: {
          orderBy: {
            period: "asc",
          },

          select: {
            period: true,

            revenue: true,

            cogs: true,

            operatingExpenses: true,

            ebitda: true,

            netIncome: true,

            cashFlow: true,

            cashBalance: true,

            mrr: true,

            customers: true,
          },
        },

        kpiTargets: {
          orderBy: [
            {
              periodKey: "asc",
            },

            {
              metricCode: "asc",
            },
          ],

          select: {
            periodKey: true,

            metricCode: true,

            targetValue: true,

            ownerName: true,

            note: true,
          },
        },

        varianceCommentaries: {
          orderBy: [
            {
              periodKey: "asc",
            },

            {
              metricCode: "asc",
            },
          ],

          select: {
            periodKey: true,

            metricCode: true,

            causeCode: true,

            varianceNature: true,

            explanation: true,

            correctiveAction: true,

            ownerName: true,

            recoveryPeriodKey: true,

            status: true,
          },
        },
      },
    }),
  ]);

  return {
    account,

    workspaces: workspaces.map((workspace) => ({
      name: workspace.name,

      role: exportedWorkspaceRole(workspace.ownerId, userId, workspace.members[0]?.role),

      createdAt: workspace.createdAt,
    })),

    models: projects.map((project) => ({
      name: project.name,

      industry: project.industry,

      currency: project.currency,

      startMonth: project.startMonth,

      horizonMonths: project.horizonMonths,

      revenueMode: project.revenueMode,

      baseAssumptions: project.baseAssumptions,

      scenarios: project.scenarios,

      financingEvents: project.financingEvents,

      monthlyOverrides: project.monthlyOverrides,

      createdAt: project.createdAt,

      updatedAt: project.updatedAt,

      workspaceName: project.workspace === null ? null : project.workspace.name,

      actualPeriods: project.actualPeriods,

      kpiTargets: project.kpiTargets,

      varianceCommentaries: project.varianceCommentaries,
    })),
  };
}
