"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/prisma";
import { financialAssumptionsToJson } from "@/lib/finance/assumptions/storage";
import { monthlyOverrideValuesToJson } from "@/lib/overrides/storage";
import {
  BACKUP_TOO_LARGE_MESSAGE,
  MAX_BACKUP_BYTES,
  type ImportModelState,
} from "@/lib/projects/backup-limits";
import { parseModelBackup, restoredModelName } from "@/lib/projects/model-backup";
import { findBackupCalculationProblem } from "@/lib/projects/model-backup-check";
import { monthInputToUtcDate } from "@/lib/projects/project-dates";

/**
 * Restores a downloaded backup as a new model that belongs to the signed-in
 * person. The file is checked completely before anything is saved, and the
 * model is saved in one transaction, so a failure never leaves half a model.
 */
export async function importModelAction(
  _previousState: ImportModelState,
  formData: FormData,
): Promise<ImportModelState> {
  const user = await requireUser();

  const entry = formData.get("backup");

  const file = entry instanceof File ? entry : null;

  if (file === null || file.size === 0) {
    return { message: "Choose the backup file you downloaded from a model." };
  }

  if (file.size > MAX_BACKUP_BYTES) {
    return { message: BACKUP_TOO_LARGE_MESSAGE };
  }

  let text: string;

  try {
    text = await file.text();
  } catch {
    return { message: "We could not read this file. Please try again." };
  }

  const parsed = parseModelBackup(text);

  if (parsed.ok === false) {
    return { message: parsed.message };
  }

  const problem = findBackupCalculationProblem(parsed.model);

  if (problem !== null) {
    return { message: problem };
  }

  const model = parsed.model;

  const sameName = await prisma.project.findFirst({
    where: {
      userId: user.id,

      name: model.name,
    },

    select: {
      id: true,
    },
  });

  let projectId: string | null = null;

  try {
    projectId = await prisma.$transaction(async (transaction) => {
      const project = await transaction.project.create({
        data: {
          userId: user.id,

          name: restoredModelName(model.name, sameName !== null),

          industry: model.industry,

          currency: model.currency,

          startMonth: monthInputToUtcDate(model.startMonth),

          horizonMonths: model.horizonMonths,

          revenueMode: model.revenueMode,

          baseAssumptions: financialAssumptionsToJson(model.assumptions),

          modelVersion: "1.0",

          scenarios: {
            create: model.scenarios.map((scenario) => ({
              name: scenario.name,

              type: scenario.type,

              modifiers: scenario.modifiers,
            })),
          },
        },

        select: {
          id: true,

          scenarios: {
            select: {
              id: true,

              name: true,
            },
          },
        },
      });

      if (model.financingEvents.length > 0) {
        await transaction.financingEvent.createMany({
          data: model.financingEvents.map((event) => ({
            projectId: project.id,

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
        });
      }

      if (model.overrides.length > 0) {
        const scenarioIds = new Map(
          project.scenarios.map((scenario): [string, string] => [scenario.name, scenario.id]),
        );

        await transaction.monthlyOverride.createMany({
          data: model.overrides.map((override) => ({
            projectId: project.id,

            scenarioId:
              override.scenario === null ? null : (scenarioIds.get(override.scenario) ?? null),

            month: monthInputToUtcDate(override.month),

            values: monthlyOverrideValuesToJson(override.values),

            note: override.note === "" ? null : override.note,
          })),
        });
      }

      return project.id;
    });
  } catch (error) {
    console.error("VentureScope backup restore failed:", error);
  }

  if (projectId === null) {
    return {
      message: "We could not restore this backup. Nothing was saved, so you can try again.",
    };
  }

  revalidatePath("/dashboard");

  redirect(`/projects/${projectId}/overview`);
}
