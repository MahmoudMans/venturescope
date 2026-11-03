"use server";

import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  createDefaultFinancialAssumptions,
} from "@/lib/finance/assumptions/defaults";
import {
  financialAssumptionsToJson,
} from "@/lib/finance/assumptions/storage";
import type {
  CreateProjectState,
  RenameProjectState,
} from "@/lib/projects/action-state";
import {
  monthInputToUtcDate,
} from "@/lib/projects/project-dates";
import {
  createProjectSchema,
  projectIdentifierSchema,
  renameProjectSchema,
} from "@/lib/projects/project-validation";
import {
  DEFAULT_PROJECT_SCENARIOS,
} from "@/lib/projects/scenario-defaults";
import {
  prisma,
} from "@/lib/db/prisma";

export async function createProjectAction(
  _previousState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const user =
    await requireUser();

  const parsed =
    createProjectSchema.safeParse({
      name:
        formData.get(
          "name",
        ),

      industry:
        formData.get(
          "industry",
        ),

      currency:
        formData.get(
          "currency",
        ),

      startMonth:
        formData.get(
          "startMonth",
        ),

      horizonMonths:
        formData.get(
          "horizonMonths",
        ),

      revenueMode:
        formData.get(
          "revenueMode",
        ),
    });

  if (
    !parsed.success
  ) {
    return {
      message:
        "Please correct the highlighted model information.",

      errors:
        parsed.error
          .flatten()
          .fieldErrors,
    };
  }

  let projectId: string;

  try {
    const project =
      await prisma.project.create({
        data: {
          userId:
            user.id,

          name:
            parsed.data
              .name,

          industry:
            parsed.data
              .industry,

          currency:
            parsed.data
              .currency,

          startMonth:
            monthInputToUtcDate(
              parsed.data
                .startMonth,
            ),

          horizonMonths:
            parsed.data
              .horizonMonths,

          revenueMode:
            parsed.data
              .revenueMode,

          baseAssumptions:
            financialAssumptionsToJson(
              createDefaultFinancialAssumptions(),
            ),

          modelVersion:
            "1.0",

          scenarios: {
            create:
              DEFAULT_PROJECT_SCENARIOS.map(
                (
                  scenario,
                ) => ({
                  name:
                    scenario.name,

                  type:
                    scenario.type,

                  modifiers:
                    scenario.modifiers,
                }),
              ),
          },
        },

        select: {
          id: true,
        },
      });

    projectId =
      project.id;
  } catch (error) {
    console.error(
      "VentureScope project creation failed:",
      error,
    );

    return {
      message:
        "We could not create this financial model. Your information has not been saved.",
    };
  }

  revalidatePath(
    "/dashboard",
  );

  redirect(
    `/projects/${projectId}/overview`,
  );
}

export async function renameProjectAction(
  _previousState: RenameProjectState,
  formData: FormData,
): Promise<RenameProjectState> {
  const user =
    await requireUser();

  const parsed =
    renameProjectSchema.safeParse({
      projectId:
        formData.get(
          "projectId",
        ),

      name:
        formData.get(
          "name",
        ),
    });

  if (
    !parsed.success
  ) {
    return {
      message:
        "Enter a valid model name.",

      errors:
        parsed.error
          .flatten()
          .fieldErrors,
    };
  }

  try {
    const result =
      await prisma.project.updateMany({
        where: {
          id:
            parsed.data
              .projectId,

          userId:
            user.id,
        },

        data: {
          name:
            parsed.data
              .name,
        },
      });

    if (
      result.count ===
      0
    ) {
      return {
        message:
          "This financial model is no longer available.",
      };
    }
  } catch (error) {
    console.error(
      "VentureScope project rename failed:",
      error,
    );

    return {
      message:
        "We could not rename this financial model.",
    };
  }

  const projectId =
    parsed.data
      .projectId;

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/projects/${projectId}/overview`,
  );

  const requestedReturnTo =
    formData.get(
      "returnTo",
    );

  const projectReturnTo =
    `/projects/${projectId}/overview`;

  const safeReturnTo =
    requestedReturnTo ===
    projectReturnTo
      ? projectReturnTo
      : "/dashboard?status=model-renamed";

  redirect(
    safeReturnTo,
  );
}

export async function deleteProjectAction(
  formData: FormData,
): Promise<void> {
  const user =
    await requireUser();

  const parsed =
    projectIdentifierSchema.safeParse(
      formData.get(
        "projectId",
      ),
    );

  if (
    !parsed.success
  ) {
    redirect(
      "/dashboard?status=model-missing",
    );
  }

  let outcome:
    | "model-deleted"
    | "model-missing"
    | "delete-failed" =
      "model-deleted";

  try {
    const result =
      await prisma.project.deleteMany({
        where: {
          id:
            parsed.data,

          userId:
            user.id,
        },
      });

    if (
      result.count ===
      0
    ) {
      outcome =
        "model-missing";
    }
  } catch (error) {
    console.error(
      "VentureScope project deletion failed:",
      error,
    );

    outcome =
      "delete-failed";
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/workspaces",
    "layout",
  );

  redirect(
    `/dashboard?status=${outcome}`,
  );
}

export async function duplicateProjectAction(
  projectId: string,
): Promise<void> {
  const user =
    await requireUser();

  const parsed =
    projectIdentifierSchema.safeParse(
      projectId,
    );

  if (
    !parsed.success
  ) {
    redirect(
      "/dashboard",
    );
  }

  const source =
    await prisma.project.findFirst({
      where: {
        id:
          parsed.data,

        userId:
          user.id,
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
          orderBy: {
            month:
              "asc",
          },
        },
      },
    });

  if (!source) {
    redirect(
      "/dashboard?status=model-missing",
    );
  }

  let duplicateId: string;

  try {
    const duplicate =
      await prisma.$transaction(
        async (
          transaction,
        ) => {
          const createdProject =
            await transaction.project.create({
              data: {
                userId:
                  user.id,

                name:
                  `${source.name} (Copy)`,

                industry:
                  source.industry,

                currency:
                  source.currency,

                startMonth:
                  source.startMonth,

                horizonMonths:
                  source.horizonMonths,

                revenueMode:
                  source.revenueMode,

                baseAssumptions:
                  JSON.parse(
                    JSON.stringify(
                      source.baseAssumptions,
                    ),
                  ),

                modelVersion:
                  source.modelVersion,
              },

              select: {
                id: true,
              },
            });

          const scenarioIdMap =
            new Map<
              string,
              string
            >();

          for (
            const scenario
            of source.scenarios
          ) {
            const createdScenario =
              await transaction.scenario.create({
                data: {
                  projectId:
                    createdProject.id,

                  name:
                    scenario.name,

                  type:
                    scenario.type,

                  modifiers:
                    JSON.parse(
                      JSON.stringify(
                        scenario.modifiers,
                      ),
                    ),
                },

                select: {
                  id: true,
                },
              });

            scenarioIdMap.set(
              scenario.id,
              createdScenario.id,
            );
          }

          if (
            source
              .financingEvents
              .length >
            0
          ) {
            await transaction
              .financingEvent
              .createMany({
                data:
                  source.financingEvents.map(
                    (
                      event,
                    ) => ({
                      projectId:
                        createdProject.id,

                      name:
                        event.name,

                      type:
                        event.type,

                      month:
                        event.month,

                      amount:
                        event.amount,

                      apr:
                        event.apr,

                      termMonths:
                        event.termMonths,

                      repaymentStartMonth:
                        event.repaymentStartMonth,
                    }),
                  ),
              });
          }

          if (
            source
              .monthlyOverrides
              .length >
            0
          ) {
            await transaction
              .monthlyOverride
              .createMany({
                data:
                  source.monthlyOverrides.map(
                    (
                      override,
                    ) => ({
                      projectId:
                        createdProject.id,

                      scenarioId:
                        override.scenarioId
                          ? scenarioIdMap.get(
                              override.scenarioId,
                            ) ??
                            null
                          : null,

                      month:
                        override.month,

                      values:
                        JSON.parse(
                          JSON.stringify(
                            override.values,
                          ),
                        ),

                      note:
                        override.note,
                    }),
                  ),
              });
          }

          return createdProject;
        },
      );

    duplicateId =
      duplicate.id;
  } catch (error) {
    console.error(
      "VentureScope project duplication failed:",
      error,
    );

    redirect(
      "/dashboard?status=copy-failed",
    );
  }

  revalidatePath(
    "/dashboard",
  );

  redirect(
    `/projects/${duplicateId}/overview`,
  );
}
