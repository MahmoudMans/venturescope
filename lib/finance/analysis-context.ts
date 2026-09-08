import {
  notFound,
} from "next/navigation";

import {
  countCompletedAssumptionSections,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  generateFinancialForecast,
} from "@/lib/finance/engine";
import {
  buildFinancialModelInput,
} from "@/lib/finance/project-input";
import {
  prisma,
} from "@/lib/db/prisma";

export type MissingAssumptionSection =
  | "general"
  | "revenue"
  | "expenses";

export async function getFinancialAnalysis(
  userId: string,
  projectId: string,
  scenarioId?: string,
) {
  const project =
    await prisma.project.findFirst({
      where: {
        id:
          projectId,

        userId,
      },

      include: {
        financingEvents: {
          orderBy: {
            month:
              "asc",
          },
        },

        monthlyOverrides: {
          orderBy: [
            {
              month:
                "asc",
            },
            {
              createdAt:
                "asc",
            },
          ],
        },

        scenarios: {
          orderBy: {
            createdAt:
              "asc",
          },
        },
      },
    });

  if (!project) {
    notFound();
  }

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  const completedSections =
    countCompletedAssumptionSections(
      assumptions,
    );

  const missingSections: MissingAssumptionSection[] =
    [];

  if (
    !assumptions.completion
      .general
  ) {
    missingSections.push(
      "general",
    );
  }

  if (
    !assumptions.completion
      .revenue
  ) {
    missingSections.push(
      "revenue",
    );
  }

  if (
    !assumptions.completion
      .expenses
  ) {
    missingSections.push(
      "expenses",
    );
  }

  const baseScenario =
    project.scenarios.find(
      (
        scenario,
      ) =>
        scenario.type ===
        "BASE",
    );

  const requestedScenario =
    scenarioId
      ? project.scenarios.find(
          (
            scenario,
          ) =>
            scenario.id ===
            scenarioId,
        )
      : undefined;

  const selectedScenario =
    requestedScenario ??
    baseScenario ??
    project.scenarios[0];

  if (
    completedSections !==
    3
  ) {
    return {
      ready:
        false as const,

      project,

      assumptions,

      completedSections,

      missingSections,

      baseScenario,

      selectedScenario,
    };
  }

  const input =
    buildFinancialModelInput(
      project,
      selectedScenario,
    );

  const forecast =
    generateFinancialForecast(
      input,
    );

  return {
    ready:
      true as const,

    project,

    assumptions,

    completedSections,

    missingSections,

    baseScenario,

    selectedScenario,

    forecast,
  };
}

export async function getBaseFinancialAnalysis(
  userId: string,
  projectId: string,
) {
  return getFinancialAnalysis(
    userId,
    projectId,
  );
}
