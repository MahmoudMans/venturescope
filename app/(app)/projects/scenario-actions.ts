"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  prisma,
} from "@/lib/db/prisma";
import type {
  ScenarioActionState,
} from "@/lib/scenarios/action-state";
import {
  scenarioFieldErrors,
} from "@/lib/scenarios/action-state";
import {
  scenarioFormValuesToStorageModifiers,
} from "@/lib/scenarios/modifiers";
import {
  createScenarioSchema,
  scenarioMutationIdentifierSchema,
  updateScenarioSchema,
} from "@/lib/scenarios/validation";
import {
  DEFAULT_PROJECT_SCENARIOS,
} from "@/lib/projects/scenario-defaults";

const MAX_SCENARIOS_PER_PROJECT =
  10;

function scenarioFormInput(
  formData: FormData,
) {
  return {
    projectId:
      formData.get(
        "projectId",
      ),

    name:
      formData.get(
        "name",
      ),

    growthAdjustmentPercentage:
      formData.get(
        "growthAdjustmentPercentage",
      ),

    arpuAdjustmentPercentage:
      formData.get(
        "arpuAdjustmentPercentage",
      ),

    cacAdjustmentPercentage:
      formData.get(
        "cacAdjustmentPercentage",
      ),

    churnDeltaPercentagePoints:
      formData.get(
        "churnDeltaPercentagePoints",
      ),

    cogsDeltaPercentagePoints:
      formData.get(
        "cogsDeltaPercentagePoints",
      ),
  };
}

async function findOwnedProject(
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
      id: true,

      revenueMode:
        true,

      _count: {
        select: {
          scenarios:
            true,
        },
      },
    },
  });
}

function revalidateScenarioOutputs(
  projectId: string,
) {
  revalidatePath(
    `/projects/${projectId}/scenarios`,
  );

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
    "/dashboard",
  );
}

export async function createScenarioAction(
  _previousState: ScenarioActionState,
  formData: FormData,
): Promise<ScenarioActionState> {
  const user =
    await requireUser();

  const parsed =
    createScenarioSchema.safeParse(
      scenarioFormInput(
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
        "Please correct the highlighted scenario information.",

      errors:
        scenarioFieldErrors(
          parsed.error,
        ),
    };
  }

  const project =
    await findOwnedProject(
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

  if (
    project._count
      .scenarios >=
    MAX_SCENARIOS_PER_PROJECT
  ) {
    return {
      status:
        "error",

      message:
        `A VentureScope model can contain at most ${MAX_SCENARIOS_PER_PROJECT} scenarios.`,
    };
  }

  const duplicateName =
    await prisma.scenario.findFirst({
      where: {
        projectId:
          project.id,

        name: {
          equals:
            parsed.data.name,

          mode:
            "insensitive",
        },
      },

      select: {
        id: true,
      },
    });

  if (
    duplicateName
  ) {
    return {
      status:
        "error",

      message:
        "A scenario with this name already exists.",

      errors: {
        name: [
          "Choose a unique scenario name.",
        ],
      },
    };
  }

  const modifiers =
    scenarioFormValuesToStorageModifiers({
      growthAdjustmentPercentage:
        parsed.data
          .growthAdjustmentPercentage,

      arpuAdjustmentPercentage:
        parsed.data
          .arpuAdjustmentPercentage,

      cacAdjustmentPercentage:
        parsed.data
          .cacAdjustmentPercentage,

      churnDeltaPercentagePoints:
        parsed.data
          .churnDeltaPercentagePoints,

      cogsDeltaPercentagePoints:
        parsed.data
          .cogsDeltaPercentagePoints,
    });

  try {
    await prisma.scenario.create({
      data: {
        projectId:
          project.id,

        name:
          parsed.data.name,

        type:
          "CUSTOM",

        modifiers,
      },
    });
  } catch (error) {
    console.error(
      "VentureScope scenario creation failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "We could not create this scenario.",
    };
  }

  revalidateScenarioOutputs(
    project.id,
  );

  return {
    status:
      "success",

    message:
      "Custom scenario created.",
  };
}

export async function updateScenarioAction(
  _previousState: ScenarioActionState,
  formData: FormData,
): Promise<ScenarioActionState> {
  const user =
    await requireUser();

  const parsed =
    updateScenarioSchema.safeParse({
      ...scenarioFormInput(
        formData,
      ),

      scenarioId:
        formData.get(
          "scenarioId",
        ),
    });

  if (
    !parsed.success
  ) {
    return {
      status:
        "error",

      message:
        "Please correct the highlighted scenario information.",

      errors:
        scenarioFieldErrors(
          parsed.error,
        ),
    };
  }

  const project =
    await findOwnedProject(
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
    await prisma.scenario.findFirst({
      where: {
        id:
          parsed.data
            .scenarioId,

        projectId:
          project.id,
      },

      select: {
        id: true,

        name: true,

        type: true,
      },
    });

  if (!existing) {
    return {
      status:
        "error",

      message:
        "This scenario is no longer available.",
    };
  }

  if (
    existing.type ===
    "BASE"
  ) {
    return {
      status:
        "error",

      message:
        "Base Case always represents the project's exact assumptions and cannot contain modifiers.",
    };
  }

  let nextName =
    existing.name;

  if (
    existing.type ===
    "CUSTOM"
  ) {
    const duplicateName =
      await prisma.scenario.findFirst({
        where: {
          projectId:
            project.id,

          id: {
            not:
              existing.id,
          },

          name: {
            equals:
              parsed.data.name,

            mode:
              "insensitive",
          },
        },

        select: {
          id: true,
        },
      });

    if (
      duplicateName
    ) {
      return {
        status:
          "error",

        message:
          "A scenario with this name already exists.",

        errors: {
          name: [
            "Choose a unique scenario name.",
          ],
        },
      };
    }

    nextName =
      parsed.data.name;
  }

  const modifiers =
    scenarioFormValuesToStorageModifiers({
      growthAdjustmentPercentage:
        parsed.data
          .growthAdjustmentPercentage,

      arpuAdjustmentPercentage:
        parsed.data
          .arpuAdjustmentPercentage,

      cacAdjustmentPercentage:
        parsed.data
          .cacAdjustmentPercentage,

      churnDeltaPercentagePoints:
        parsed.data
          .churnDeltaPercentagePoints,

      cogsDeltaPercentagePoints:
        parsed.data
          .cogsDeltaPercentagePoints,
    });

  try {
    const result =
      await prisma.scenario.updateMany({
        where: {
          id:
            existing.id,

          projectId:
            project.id,
        },

        data: {
          name:
            nextName,

          modifiers,
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
          "This scenario is no longer available.",
      };
    }
  } catch (error) {
    console.error(
      "VentureScope scenario update failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "We could not update this scenario.",
    };
  }

  revalidateScenarioOutputs(
    project.id,
  );

  return {
    status:
      "success",

    message:
      "Scenario modifiers updated.",
  };
}

export async function resetScenarioAction(
  formData: FormData,
): Promise<void> {
  const user =
    await requireUser();

  const parsed =
    scenarioMutationIdentifierSchema.safeParse({
      projectId:
        formData.get(
          "projectId",
        ),

      scenarioId:
        formData.get(
          "scenarioId",
        ),
    });

  if (
    !parsed.success
  ) {
    return;
  }

  const project =
    await findOwnedProject(
      user.id,
      parsed.data
        .projectId,
    );

  if (!project) {
    return;
  }

  const scenario =
    await prisma.scenario.findFirst({
      where: {
        id:
          parsed.data
            .scenarioId,

        projectId:
          project.id,
      },

      select: {
        id: true,

        type: true,
      },
    });

  if (
    !scenario ||
    scenario.type ===
      "CUSTOM"
  ) {
    return;
  }

  const defaultScenario =
    DEFAULT_PROJECT_SCENARIOS.find(
      (
        candidate,
      ) =>
        candidate.type ===
        scenario.type,
    );

  if (
    !defaultScenario
  ) {
    return;
  }

  try {
    await prisma.scenario.updateMany({
      where: {
        id:
          scenario.id,

        projectId:
          project.id,
      },

      data: {
        modifiers:
          JSON.parse(
            JSON.stringify(
              defaultScenario.modifiers,
            ),
          ),
      },
    });
  } catch (error) {
    console.error(
      "VentureScope scenario reset failed:",
      error,
    );

    return;
  }

  revalidateScenarioOutputs(
    project.id,
  );
}

export async function deleteScenarioAction(
  formData: FormData,
): Promise<void> {
  const user =
    await requireUser();

  const parsed =
    scenarioMutationIdentifierSchema.safeParse({
      projectId:
        formData.get(
          "projectId",
        ),

      scenarioId:
        formData.get(
          "scenarioId",
        ),
    });

  if (
    !parsed.success
  ) {
    return;
  }

  const project =
    await findOwnedProject(
      user.id,
      parsed.data
        .projectId,
    );

  if (!project) {
    return;
  }

  try {
    await prisma.$transaction([
      prisma.monthlyOverride.deleteMany({
        where: {
          projectId:
            project.id,

          scenarioId:
            parsed.data
              .scenarioId,
        },
      }),

      prisma.scenario.deleteMany({
        where: {
          id:
            parsed.data
              .scenarioId,

          projectId:
            project.id,

          type:
            "CUSTOM",
        },
      }),
    ]);
  } catch (error) {
    console.error(
      "VentureScope scenario deletion failed:",
      error,
    );

    return;
  }

  revalidateScenarioOutputs(
    project.id,
  );
}
