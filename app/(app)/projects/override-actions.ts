"use server";

import {
  auditSecurityEvent,
} from "@/lib/security/audit";

import {
  revalidatePath,
} from "next/cache";

import {
  requireUser,
} from "@/lib/auth/require-user";
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
import type {
  MonthlyOverrideActionState,
} from "@/lib/overrides/action-state";
import {
  monthlyOverrideFieldErrors,
} from "@/lib/overrides/action-state";
import {
  monthlyOverrideValuesFromForm,
  monthlyOverrideValuesToJson,
} from "@/lib/overrides/storage";
import {
  createMonthlyOverrideSchema,
  deleteMonthlyOverrideSchema,
  updateMonthlyOverrideSchema,
} from "@/lib/overrides/validation";
import {
  monthInputToUtcDate,
} from "@/lib/projects/project-dates";

function overrideInput(
  formData: FormData,
) {
  return {
    projectId:
      formData.get(
        "projectId",
      ),

    scenarioId:
      formData.get(
        "scenarioId",
      ) ??
      "",

    month:
      formData.get(
        "month",
      ),

    revenue:
      formData.get(
        "revenue",
      ) ??
      "",

    marketing:
      formData.get(
        "marketing",
      ) ??
      "",

    salaries:
      formData.get(
        "salaries",
      ) ??
      "",

    rent:
      formData.get(
        "rent",
      ) ??
      "",

    cogs:
      formData.get(
        "cogs",
      ) ??
      "",

    cac:
      formData.get(
        "cac",
      ) ??
      "",

    churnRate:
      formData.get(
        "churnRate",
      ) ??
      "",

    arpu:
      formData.get(
        "arpu",
      ) ??
      "",

    note:
      formData.get(
        "note",
      ) ??
      "",
  };
}

async function ownedProject(
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

      startMonth:
        true,

      horizonMonths:
        true,

      scenarios: {
        select: {
          id:
            true,

          name:
            true,
        },
      },
    },
  });
}

function validateTiming(
  project: {
    startMonth: Date;

    horizonMonths: number;
  },
  month: string,
): MonthlyOverrideActionState | null {
  const start =
    dateToMonthKey(
      project.startMonth,
    );

  const end =
    addMonths(
      start,
      project.horizonMonths -
        1,
    );

  if (
    compareMonths(
      month as MonthKey,
      start,
    ) <
      0 ||
    compareMonths(
      month as MonthKey,
      end,
    ) >
      0
  ) {
    return {
      status:
        "error",

      message:
        "The override month must fall inside the project's forecast horizon.",

      errors: {
        month: [
          `Select a month from ${start} through ${end}.`,
        ],
      },
    };
  }

  return null;
}

function validateScenarioScope(
  project: {
    scenarios: Array<{
      id: string;

      name: string;
    }>;
  },
  scenarioId: string,
): MonthlyOverrideActionState | null {
  if (
    scenarioId ===
    ""
  ) {
    return null;
  }

  const belongs =
    project.scenarios.some(
      (
        scenario,
      ) =>
        scenario.id ===
        scenarioId,
    );

  if (
    belongs
  ) {
    return null;
  }

  return {
    status:
      "error",

    message:
      "The selected scenario does not belong to this financial model.",

    errors: {
      scenarioId: [
        "Select a valid project scenario.",
      ],
    },
  };
}

function revalidateOverrideOutputs(
  projectId: string,
) {
  revalidatePath(
    `/projects/${projectId}/timeline`,
  );

  revalidatePath(
    `/projects/${projectId}/overview`,
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
    "/dashboard",
  );
}

export async function createMonthlyOverrideAction(
  _previousState: MonthlyOverrideActionState,
  formData: FormData,
): Promise<MonthlyOverrideActionState> {
  const user =
    await requireUser();

  const parsed =
    createMonthlyOverrideSchema.safeParse(
      overrideInput(
        formData,
      ),
    );

  if (
    !parsed.success
  ) {
    return {
      status:
        "error",

      message:
        "Please correct the highlighted monthly override information.",

      errors:
        monthlyOverrideFieldErrors(
          parsed.error,
        ),
    };
  }

  const project =
    await ownedProject(
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

  const timingError =
    validateTiming(
      project,
      parsed.data
        .month,
    );

  if (
    timingError
  ) {
    return timingError;
  }

  const scenarioError =
    validateScenarioScope(
      project,
      parsed.data
        .scenarioId,
    );

  if (
    scenarioError
  ) {
    return scenarioError;
  }

  const scenarioId =
    parsed.data
      .scenarioId ===
    ""
      ? null
      : parsed.data
          .scenarioId;

  const month =
    monthInputToUtcDate(
      parsed.data.month,
    );

  const existing =
    await prisma.monthlyOverride.findFirst({
      where: {
        projectId:
          project.id,

        scenarioId,

        month,
      },

      select: {
        id:
          true,
      },
    });

  if (
    existing
  ) {
    return {
      status:
        "error",

      message:
        "An override already exists for this month and scenario scope.",

      errors: {
        month: [
          "Edit the existing override instead of creating a duplicate.",
        ],
      },
    };
  }

  const values =
    monthlyOverrideValuesFromForm(
      parsed.data,
    );

  try {
    await prisma.monthlyOverride.create({
      data: {
        projectId:
          project.id,

        scenarioId,

        month,

        values:
          monthlyOverrideValuesToJson(
            values,
          ),

        note:
          parsed.data
            .note ||
          null,
      },
    });
  } catch (error) {
    console.error(
      "VentureScope monthly override creation failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "We could not create this monthly override.",
    };
  }

  revalidateOverrideOutputs(
    project.id,
  );

  return {
    status:
      "success",

    message:
      "Monthly override created. Financial forecasts have been refreshed.",
  };
}

export async function updateMonthlyOverrideAction(
  _previousState: MonthlyOverrideActionState,
  formData: FormData,
): Promise<MonthlyOverrideActionState> {
  const user =
    await requireUser();

  const parsed =
    updateMonthlyOverrideSchema.safeParse({
      ...overrideInput(
        formData,
      ),

      overrideId:
        formData.get(
          "overrideId",
        ),
    });

  if (
    !parsed.success
  ) {
    return {
      status:
        "error",

      message:
        "Please correct the highlighted monthly override information.",

      errors:
        monthlyOverrideFieldErrors(
          parsed.error,
        ),
    };
  }

  const project =
    await ownedProject(
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

  const existing =
    await prisma.monthlyOverride.findFirst({
      where: {
        id:
          parsed.data
            .overrideId,

        projectId:
          project.id,
      },

      select: {
        id:
          true,
      },
    });

  if (!existing) {
    return {
      status:
        "error",

      message:
        "This monthly override is no longer available.",
    };
  }

  const timingError =
    validateTiming(
      project,
      parsed.data
        .month,
    );

  if (
    timingError
  ) {
    return timingError;
  }

  const scenarioError =
    validateScenarioScope(
      project,
      parsed.data
        .scenarioId,
    );

  if (
    scenarioError
  ) {
    return scenarioError;
  }

  const scenarioId =
    parsed.data
      .scenarioId ===
    ""
      ? null
      : parsed.data
          .scenarioId;

  const month =
    monthInputToUtcDate(
      parsed.data.month,
    );

  const duplicate =
    await prisma.monthlyOverride.findFirst({
      where: {
        id: {
          not:
            existing.id,
        },

        projectId:
          project.id,

        scenarioId,

        month,
      },

      select: {
        id:
          true,
      },
    });

  if (
    duplicate
  ) {
    return {
      status:
        "error",

      message:
        "Another override already exists for this month and scenario scope.",

      errors: {
        month: [
          "Choose another month or scenario scope.",
        ],
      },
    };
  }

  const values =
    monthlyOverrideValuesFromForm(
      parsed.data,
    );

  try {
    const result =
      await prisma.monthlyOverride.updateMany({
        where: {
          id:
            existing.id,

          projectId:
            project.id,
        },

        data: {
          scenarioId,

          month,

          values:
            monthlyOverrideValuesToJson(
              values,
            ),

          note:
            parsed.data
              .note ||
            null,
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
          "This monthly override is no longer available.",
      };
    }
  } catch (error) {
    console.error(
      "VentureScope monthly override update failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "We could not update this monthly override.",
    };
  }

  revalidateOverrideOutputs(
    project.id,
  );

  return {
    status:
      "success",

    message:
      "Monthly override updated. Financial forecasts have been refreshed.",
  };
}

export async function deleteMonthlyOverrideAction(
  formData: FormData,
): Promise<void> {
  const user =
    await requireUser();

  const parsed =
    deleteMonthlyOverrideSchema.safeParse({
      projectId:
        formData.get(
          "projectId",
        ),

      overrideId:
        formData.get(
          "overrideId",
        ),
    });

  if (
    !parsed.success
  ) {
    return;
  }

  const project =
    await ownedProject(
      user.id,
      parsed.data
        .projectId,
    );

  if (!project) {
    return;
  }

  try {
    await prisma.monthlyOverride.deleteMany({
      where: {
        id:
          parsed.data
            .overrideId,

        projectId:
          project.id,
      },
    });
  } catch (error) {
    console.error(
      "VentureScope monthly override deletion failed:",
      error,
    );

    return;
  }

  auditSecurityEvent({
    action:
      "override.delete",

    userId:
      user.id,

    projectId:
      project.id,

    targetId:
      parsed.data.overrideId,
  });

  revalidateOverrideOutputs(
    project.id,
  );
}
