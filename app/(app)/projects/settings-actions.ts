"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  createDefaultFinancialAssumptions,
} from "@/lib/finance/assumptions/defaults";
import {
  financialAssumptionsToJson,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  addMonths,
  compareMonths,
  dateToMonthKey,
} from "@/lib/finance/dates";
import type {
  MonthKey,
} from "@/lib/finance/types";
import {
  prisma,
} from "@/lib/db/prisma";
import {
  monthInputToUtcDate,
} from "@/lib/projects/project-dates";
import {
  DEFAULT_PROJECT_SCENARIOS,
} from "@/lib/projects/scenario-defaults";
import type {
  ProjectSettingsActionState,
} from "@/lib/settings/action-state";
import {
  projectSettingsFieldErrors,
} from "@/lib/settings/action-state";
import {
  settingsProjectIdentifierSchema,
  updateProjectSettingsSchema,
} from "@/lib/settings/validation";

function revalidateProjectSurfaces(
  projectId: string,
) {
  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/projects/${projectId}/overview`,
  );

  revalidatePath(
    `/projects/${projectId}/assumptions`,
  );

  revalidatePath(
    `/projects/${projectId}/revenue`,
  );

  revalidatePath(
    `/projects/${projectId}/expenses`,
  );

  revalidatePath(
    `/projects/${projectId}/financing`,
  );

  revalidatePath(
    `/projects/${projectId}/timeline`,
  );

  revalidatePath(
    `/projects/${projectId}/forecast`,
  );

  revalidatePath(
    `/projects/${projectId}/pnl`,
  );

  revalidatePath(
    `/projects/${projectId}/cash-flow`,
  );

  revalidatePath(
    `/projects/${projectId}/customers`,
  );

  revalidatePath(
    `/projects/${projectId}/scenarios`,
  );

  revalidatePath(
    `/projects/${projectId}/reports`,
  );

  revalidatePath(
    `/projects/${projectId}/settings`,
  );
}

async function getOwnedSettingsProject(
  userId: string,
  projectId: string,
) {
  return prisma.project.findFirst({
    where: {
      id:
        projectId,

      userId,
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

      startMonth:
        true,

      horizonMonths:
        true,

      revenueMode:
        true,

      baseAssumptions:
        true,

      modelVersion:
        true,

      financingEvents: {
        select: {
          id:
            true,

          name:
            true,

          month:
            true,
        },
      },

      monthlyOverrides: {
        select: {
          id:
            true,

          month:
            true,

          scenarioId:
            true,
        },
      },
    },
  });
}

function outsideWindow(
  month: MonthKey,
  startMonth: MonthKey,
  endMonth: MonthKey,
): boolean {
  return (
    compareMonths(
      month,
      startMonth,
    ) <
      0 ||
    compareMonths(
      month,
      endMonth,
    ) >
      0
  );
}

export async function updateProjectSettingsAction(
  _previousState: ProjectSettingsActionState,
  formData: FormData,
): Promise<ProjectSettingsActionState> {
  const user =
    await requireUser();

  const parsed =
    updateProjectSettingsSchema.safeParse({
      projectId:
        formData.get(
          "projectId",
        ),

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
      status:
        "error",

      message:
        "Please correct the highlighted project settings.",

      errors:
        projectSettingsFieldErrors(
          parsed.error,
        ),
    };
  }

  const project =
    await getOwnedSettingsProject(
      user.id,
      parsed.data
        .projectId,
    );

  if (!project) {
    return {
      status:
        "error",

      message:
        "This financial model is no longer available.",
    };
  }

  const nextStart =
    parsed.data
      .startMonth as MonthKey;

  const nextEnd =
    addMonths(
      nextStart,
      parsed.data
        .horizonMonths -
        1,
    );

  const invalidFinancing =
    project.financingEvents.filter(
      (
        event,
      ) =>
        outsideWindow(
          dateToMonthKey(
            event.month,
          ),
          nextStart,
          nextEnd,
        ),
    );

  const invalidOverrides =
    project.monthlyOverrides.filter(
      (
        override,
      ) =>
        outsideWindow(
          dateToMonthKey(
            override.month,
          ),
          nextStart,
          nextEnd,
        ),
    );

  if (
    invalidFinancing.length >
      0 ||
    invalidOverrides.length >
      0
  ) {
    const details: string[] =
      [];

    if (
      invalidFinancing.length >
      0
    ) {
      const sample =
        invalidFinancing
          .slice(
            0,
            3,
          )
          .map(
            (
              event,
            ) =>
              `${event.name} (${dateToMonthKey(
                event.month,
              )})`,
          )
          .join(
            ", ",
          );

      details.push(
        `${invalidFinancing.length} financing event${invalidFinancing.length === 1 ? "" : "s"} would fall outside the new window: ${sample}`,
      );
    }

    if (
      invalidOverrides.length >
      0
    ) {
      const sample =
        invalidOverrides
          .slice(
            0,
            3,
          )
          .map(
            (
              override,
            ) =>
              dateToMonthKey(
                override.month,
              ),
          )
          .join(
            ", ",
          );

      details.push(
        `${invalidOverrides.length} monthly override${invalidOverrides.length === 1 ? "" : "s"} would fall outside the new window: ${sample}`,
      );
    }

    const message =
      `Forecast window change blocked. ${details.join(
        ". ",
      )}. Remove or move those planning events first.`;

    return {
      status:
        "error",

      message,

      errors: {
        startMonth: [
          "The requested forecast window would invalidate existing planning data.",
        ],

        horizonMonths: [
          `Required planning window currently extends beyond ${nextStart} through ${nextEnd}.`,
        ],
      },
    };
  }

  const revenueModeChanged =
    project.revenueMode !==
    parsed.data
      .revenueMode;

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  const nextAssumptions =
    revenueModeChanged
      ? {
          ...assumptions,

          completion: {
            ...assumptions.completion,

            revenue:
              false,
          },
        }
      : assumptions;

  try {
    const result =
      await prisma.project.updateMany({
        where: {
          id:
            project.id,

          userId:
            user.id,
        },

        data: {
          name:
            parsed.data.name,

          industry:
            parsed.data
              .industry ||
            null,

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
              nextAssumptions,
            ),
        },
      });

    if (
      result.count !==
      1
    ) {
      return {
        status:
          "error",

        message:
          "This financial model is no longer available.",
      };
    }
  } catch (error) {
    console.error(
      "VentureScope project settings update failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "We could not save the project settings.",
    };
  }

  revalidateProjectSurfaces(
    project.id,
  );

  return {
    status:
      "success",

    message:
      revenueModeChanged
        ? "Project settings saved. Because the revenue model changed, review and save the Revenue assumptions before analysis resumes."
        : "Project settings saved.",
  };
}

async function resolveOwnedProjectId(
  formData: FormData,
): Promise<{
  userId: string;

  projectId: string;
} | null> {
  const user =
    await requireUser();

  const parsed =
    settingsProjectIdentifierSchema.safeParse(
      formData.get(
        "projectId",
      ),
    );

  if (
    !parsed.success
  ) {
    return null;
  }

  const project =
    await prisma.project.findFirst({
      where: {
        id:
          parsed.data,

        userId:
          user.id,
      },

      select: {
        id:
          true,
      },
    });

  if (!project) {
    return null;
  }

  return {
    userId:
      user.id,

    projectId:
      project.id,
  };
}

export async function resetFinancialAssumptionsAction(
  formData: FormData,
): Promise<void> {
  const owned =
    await resolveOwnedProjectId(
      formData,
    );

  if (!owned) {
    return;
  }

  try {
    await prisma.project.updateMany({
      where: {
        id:
          owned.projectId,

        userId:
          owned.userId,
      },

      data: {
        baseAssumptions:
          financialAssumptionsToJson(
            createDefaultFinancialAssumptions(),
          ),
      },
    });
  } catch (error) {
    console.error(
      "VentureScope financial assumption reset failed:",
      error,
    );

    return;
  }

  revalidateProjectSurfaces(
    owned.projectId,
  );
}

export async function clearFinancingEventsAction(
  formData: FormData,
): Promise<void> {
  const owned =
    await resolveOwnedProjectId(
      formData,
    );

  if (!owned) {
    return;
  }

  try {
    await prisma.financingEvent.deleteMany({
      where: {
        projectId:
          owned.projectId,

        project: {
          userId:
            owned.userId,
        },
      },
    });
  } catch (error) {
    console.error(
      "VentureScope financing clear failed:",
      error,
    );

    return;
  }

  revalidateProjectSurfaces(
    owned.projectId,
  );
}

export async function clearMonthlyOverridesAction(
  formData: FormData,
): Promise<void> {
  const owned =
    await resolveOwnedProjectId(
      formData,
    );

  if (!owned) {
    return;
  }

  try {
    await prisma.monthlyOverride.deleteMany({
      where: {
        projectId:
          owned.projectId,

        project: {
          userId:
            owned.userId,
        },
      },
    });
  } catch (error) {
    console.error(
      "VentureScope monthly override clear failed:",
      error,
    );

    return;
  }

  revalidateProjectSurfaces(
    owned.projectId,
  );
}

export async function resetScenarioLibraryAction(
  formData: FormData,
): Promise<void> {
  const owned =
    await resolveOwnedProjectId(
      formData,
    );

  if (!owned) {
    return;
  }

  try {
    await prisma.$transaction(
      async (
        transaction,
      ) => {
        await transaction.monthlyOverride.deleteMany({
          where: {
            projectId:
              owned.projectId,

            scenarioId: {
              not:
                null,
            },
          },
        });

        await transaction.scenario.deleteMany({
          where: {
            projectId:
              owned.projectId,
          },
        });

        await transaction.scenario.createMany({
          data:
            DEFAULT_PROJECT_SCENARIOS.map(
              (
                scenario,
              ) => ({
                projectId:
                  owned.projectId,

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
              }),
            ),
        });
      },
    );
  } catch (error) {
    console.error(
      "VentureScope scenario library reset failed:",
      error,
    );

    return;
  }

  revalidateProjectSurfaces(
    owned.projectId,
  );
}
