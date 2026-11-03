import { toDashboardSharing, workspaceForPerson } from "@/lib/dashboard/model-sharing-status";
import { ASSUMPTION_SECTION_COUNT, runwayTone, type DashboardModel } from "@/lib/dashboard/summary";
import { prisma } from "@/lib/db/prisma";
import {
  countCompletedAssumptionSections,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import { generateFinancialForecast } from "@/lib/finance/engine";
import { formatCompactCurrencyValue, formatRunway } from "@/lib/finance/formatting";
import { decimal } from "@/lib/finance/math";
import { buildFinancialModelInput } from "@/lib/finance/project-input";

/**
 * Loads every model the signed-in user owns and runs the Base scenario
 * through the same forecast engine used by the analysis pages, so the
 * dashboard shows real figures instead of placeholders. A model that
 * cannot be forecast never breaks the dashboard; it is flagged instead.
 */
export async function loadDashboardModels(userId: string): Promise<DashboardModel[]> {
  const projects = await prisma.project.findMany({
    where: {
      userId,
    },

    orderBy: {
      updatedAt: "desc",
    },

    include: {
      financingEvents: {
        orderBy: {
          month: "asc",
        },
      },

      monthlyOverrides: {
        orderBy: [
          {
            month: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },

      scenarios: {
        orderBy: {
          createdAt: "asc",
        },
      },

      workspace: {
        select: {
          id: true,

          name: true,

          ownerId: true,

          _count: {
            select: {
              members: true,
            },
          },

          members: {
            where: {
              userId,
            },

            select: {
              id: true,
            },

            take: 1,
          },
        },
      },
    },
  });

  return projects.map((project): DashboardModel => {
    const base = {
      id: project.id,

      name: project.name,

      industry: project.industry,

      currency: project.currency,

      startMonth: project.startMonth,

      horizonMonths: project.horizonMonths,

      revenueMode: project.revenueMode,

      updatedAt: project.updatedAt,

      scenarioCount: project.scenarios.length,

      sharing: toDashboardSharing(workspaceForPerson(project.workspace, userId)),
    };

    try {
      const assumptions = parseStoredFinancialAssumptions(project.baseAssumptions);

      const completedSections = countCompletedAssumptionSections(assumptions);

      if (completedSections !== ASSUMPTION_SECTION_COUNT) {
        return {
          ...base,

          status: "SETUP_REQUIRED",

          completedSections,

          snapshot: null,

          metrics: null,
        };
      }

      const scenario =
        project.scenarios.find((candidate) => candidate.type === "BASE") ?? project.scenarios[0];

      const forecast = generateFinancialForecast(buildFinancialModelInput(project, scenario));

      const metrics = forecast.metrics;

      return {
        ...base,

        status: "READY",

        completedSections,

        snapshot: {
          firstYearRevenueLabel: formatCompactCurrencyValue(
            metrics.firstYearRevenue,
            project.currency,
          ),

          endingCashLabel: formatCompactCurrencyValue(metrics.endingCash, project.currency),

          runwayLabel: formatRunway(metrics.runway),

          runwayTone: runwayTone(metrics.runway),
        },

        metrics: {
          firstYearRevenue: decimal(metrics.firstYearRevenue).toNumber(),

          runway: metrics.runway,
        },
      };
    } catch {
      return {
        ...base,

        status: "UNAVAILABLE",

        completedSections: 0,

        snapshot: null,

        metrics: null,
      };
    }
  });
}
