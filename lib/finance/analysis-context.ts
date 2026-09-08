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

export async function getBaseFinancialAnalysis(
  userId: string,
  projectId: string,
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

        scenarios: {
          where: {
            type:
              "BASE",
          },

          orderBy: {
            createdAt:
              "asc",
          },

          take:
            1,
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
    };
  }

  const baseScenario =
    project.scenarios[0];

  const input =
    buildFinancialModelInput(
      project,
      baseScenario,
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

    forecast,
  };
}
