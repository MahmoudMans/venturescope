import {
  countCompletedAssumptionSections,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  generateScenarioComparison,
} from "@/lib/finance/comparison";
import {
  generateFinancialForecast,
} from "@/lib/finance/engine";
import {
  buildFinancialModelInput,
  mapPersistedScenario,
} from "@/lib/finance/project-input";
import {
  prisma,
} from "@/lib/db/prisma";

export async function loadReportContext(
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
        scenarios: {
          orderBy: {
            createdAt:
              "asc",
          },
        },

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
      },
    });

  if (!project) {
    return null;
  }

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  const completedSections =
    countCompletedAssumptionSections(
      assumptions,
    );

  const missingSections:
    Array<
      | "general"
      | "revenue"
      | "expenses"
    > = [];

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
    ) ??
    project.scenarios[0];

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
    baseScenario;

  if (
    completedSections !==
    3
  ) {
    return {
      ready:
        false as const,

      project,

      assumptions,

      missingSections,

      completedSections,

      selectedScenario,

      baseScenario,
    };
  }

  const selectedInput =
    buildFinancialModelInput(
      project,
      selectedScenario,
    );

  const forecast =
    generateFinancialForecast(
      selectedInput,
    );

  const baseInput =
    buildFinancialModelInput(
      project,
      baseScenario,
    );

  const scenarioInputs =
    project.scenarios.map(
      (
        scenario,
      ) =>
        mapPersistedScenario(
          scenario,
        ),
    );

  const comparison =
    generateScenarioComparison(
      baseInput,
      scenarioInputs,
    );

  return {
    ready:
      true as const,

    project,

    assumptions,

    missingSections,

    completedSections,

    selectedScenario,

    baseScenario,

    selectedInput,

    forecast,

    comparison,
  };
}

export type ReportContext =
  Awaited<
    ReturnType<
      typeof loadReportContext
    >
  >;

export type ReadyReportContext =
  Extract<
    NonNullable<
      ReportContext
    >,
    {
      ready: true;
    }
  >;
