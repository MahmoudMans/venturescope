"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { financialAssumptionsToJson } from "@/lib/finance/assumptions/storage";
import { monthlyOverrideValuesToJson } from "@/lib/overrides/storage";
import { dateToMonthInput, monthInputToUtcDate } from "@/lib/projects/project-dates";
import { buildSampleModel, SAMPLE_MODEL_NAME } from "@/lib/projects/sample-model";
import { DEFAULT_PROJECT_SCENARIOS } from "@/lib/projects/scenario-defaults";

/**
 * Creates the Orbit Analytics sample model for the signed-in person. A person
 * who already has it is taken to it instead, so pressing the button twice
 * never makes a second copy.
 */
export async function createSampleModelAction(): Promise<void> {
  const user = await requireUser();

  const existing = await prisma.project.findFirst({
    where: {
      userId: user.id,

      name: SAMPLE_MODEL_NAME,
    },

    select: {
      id: true,
    },
  });

  if (existing !== null) {
    redirect(`/projects/${existing.id}/overview`);
  }

  const sample = buildSampleModel(dateToMonthInput(new Date()));

  let projectId: string | null = null;

  try {
    projectId = await prisma.$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: {
          userId: user.id,

          name: sample.name,

          industry: sample.industry,

          currency: sample.currency,

          startMonth: monthInputToUtcDate(sample.startMonth),

          horizonMonths: sample.horizonMonths,

          revenueMode: sample.revenueMode,

          baseAssumptions: financialAssumptionsToJson(sample.assumptions),

          modelVersion: "1.0",

          scenarios: {
            create: DEFAULT_PROJECT_SCENARIOS.map((scenario) => ({
              name: scenario.name,

              type: scenario.type,

              modifiers: scenario.modifiers,
            })),
          },

          financingEvents: {
            create: sample.financingEvents.map((event) => ({
              name: event.name,

              type: event.type,

              month: monthInputToUtcDate(event.month),

              amount: event.amount,

              apr: event.apr,

              termMonths: event.termMonths,

              repaymentStartMonth: event.repaymentStartMonth
                ? monthInputToUtcDate(event.repaymentStartMonth)
                : null,
            })),
          },
        },

        select: {
          id: true,

          scenarios: {
            select: {
              id: true,

              type: true,
            },
          },
        },
      });

      const scenarioIds = new Map(
        project.scenarios.map((scenario): [string, string] => [scenario.type, scenario.id]),
      );

      await transaction.monthlyOverride.createMany({
        data: sample.overrides.map((override) => ({
          projectId: project.id,

          scenarioId:
            override.scenario === "ALL" ? null : (scenarioIds.get(override.scenario) ?? null),

          month: monthInputToUtcDate(override.month),

          values: monthlyOverrideValuesToJson(override.values),

          note: override.note === "" ? null : override.note,
        })),
      });

      return project.id;
    });
  } catch (error) {
    console.error("VentureScope sample model creation failed:", error);
  }

  if (projectId === null) {
    redirect("/dashboard?status=sample-failed");
  }

  revalidatePath("/dashboard");

  redirect(`/projects/${projectId}/overview`);
}
