"use server";

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
import type {
  FinancingActionState,
} from "@/lib/financing/action-state";
import {
  financingFieldErrors,
} from "@/lib/financing/action-state";
import {
  createFinancingEventSchema,
  deleteFinancingEventSchema,
  updateFinancingEventSchema,
} from "@/lib/financing/validation";
import {
  prisma,
} from "@/lib/db/prisma";
import {
  monthInputToUtcDate,
} from "@/lib/projects/project-dates";

type ParsedFinancingData = {
  projectId: string;

  name: string;

  type:
    | "EQUITY"
    | "DEBT"
    | "GRANT"
    | "OTHER";

  month: string;

  amount: string;

  apr: string;

  termMonths: string;

  repaymentStartMonth: string;
};

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

      startMonth: true,

      horizonMonths: true,
    },
  });
}

function validateProjectTiming(
  project: {
    startMonth: Date;

    horizonMonths: number;
  },
  data: ParsedFinancingData,
): FinancingActionState | null {
  const forecastStart =
    dateToMonthKey(
      project.startMonth,
    );

  const forecastEnd =
    addMonths(
      forecastStart,
      project.horizonMonths -
        1,
    );

  const financingMonth =
    data.month as MonthKey;

  if (
    compareMonths(
      financingMonth,
      forecastStart,
    ) <
      0 ||
    compareMonths(
      financingMonth,
      forecastEnd,
    ) >
      0
  ) {
    return {
      status: "error",

      message:
        "The financing event must occur inside the project forecast window.",

      errors: {
        month: [
          `Select a month from ${forecastStart} through ${forecastEnd}.`,
        ],
      },
    };
  }

  if (
    data.type ===
      "DEBT" &&
    data.repaymentStartMonth
  ) {
    const earliestRepayment =
      addMonths(
        financingMonth,
        1,
      );

    if (
      compareMonths(
        data.repaymentStartMonth as MonthKey,
        earliestRepayment,
      ) <
      0
    ) {
      return {
        status:
          "error",

        message:
          "Debt repayment must begin after the loan is funded.",

        errors: {
          repaymentStartMonth:
            [
              `Repayment must start in ${earliestRepayment} or later.`,
            ],
        },
      };
    }
  }

  return null;
}

function revalidateFinancingOutputs(
  projectId: string,
) {
  revalidatePath(
    `/projects/${projectId}/financing`,
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
    "/dashboard",
  );
}

function financingInputFromForm(
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

    type:
      formData.get(
        "type",
      ),

    month:
      formData.get(
        "month",
      ),

    amount:
      formData.get(
        "amount",
      ),

    apr:
      formData.get(
        "apr",
      ) ??
      "",

    termMonths:
      formData.get(
        "termMonths",
      ) ??
      "",

    repaymentStartMonth:
      formData.get(
        "repaymentStartMonth",
      ) ??
      "",
  };
}

export async function createFinancingEventAction(
  _previousState: FinancingActionState,
  formData: FormData,
): Promise<FinancingActionState> {
  const user =
    await requireUser();

  const parsed =
    createFinancingEventSchema.safeParse(
      financingInputFromForm(
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
        "Please correct the highlighted financing information.",

      errors:
        financingFieldErrors(
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

  const timingError =
    validateProjectTiming(
      project,
      parsed.data,
    );

  if (
    timingError
  ) {
    return timingError;
  }

  const debt =
    parsed.data.type ===
    "DEBT";

  const repaymentStart =
    debt
      ? (
          parsed.data
            .repaymentStartMonth ||
          addMonths(
            parsed.data
              .month as MonthKey,
            1,
          )
        )
      : null;

  try {
    await prisma.financingEvent.create({
      data: {
        projectId:
          project.id,

        name:
          parsed.data.name,

        type:
          parsed.data.type,

        month:
          monthInputToUtcDate(
            parsed.data.month,
          ),

        amount:
          parsed.data.amount,

        apr:
          debt
            ? parsed.data.apr
            : null,

        termMonths:
          debt
            ? Number(
                parsed.data
                  .termMonths,
              )
            : null,

        repaymentStartMonth:
          repaymentStart
            ? monthInputToUtcDate(
                repaymentStart,
              )
            : null,
      },
    });
  } catch (error) {
    console.error(
      "VentureScope financing creation failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "We could not create this financing event.",
    };
  }

  revalidateFinancingOutputs(
    project.id,
  );

  return {
    status:
      "success",

    message:
      "Financing event created. Forecast cash flow has been refreshed.",
  };
}

export async function updateFinancingEventAction(
  _previousState: FinancingActionState,
  formData: FormData,
): Promise<FinancingActionState> {
  const user =
    await requireUser();

  const parsed =
    updateFinancingEventSchema.safeParse({
      ...financingInputFromForm(
        formData,
      ),

      eventId:
        formData.get(
          "eventId",
        ),
    });

  if (
    !parsed.success
  ) {
    return {
      status:
        "error",

      message:
        "Please correct the highlighted financing information.",

      errors:
        financingFieldErrors(
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
    await prisma.financingEvent.findFirst({
      where: {
        id:
          parsed.data
            .eventId,

        projectId:
          project.id,
      },

      select: {
        id: true,
      },
    });

  if (!existing) {
    return {
      status:
        "error",

      message:
        "This financing event is no longer available.",
    };
  }

  const timingError =
    validateProjectTiming(
      project,
      parsed.data,
    );

  if (
    timingError
  ) {
    return timingError;
  }

  const debt =
    parsed.data.type ===
    "DEBT";

  const repaymentStart =
    debt
      ? (
          parsed.data
            .repaymentStartMonth ||
          addMonths(
            parsed.data
              .month as MonthKey,
            1,
          )
        )
      : null;

  try {
    const result =
      await prisma.financingEvent.updateMany({
        where: {
          id:
            parsed.data
              .eventId,

          projectId:
            project.id,
        },

        data: {
          name:
            parsed.data.name,

          type:
            parsed.data.type,

          month:
            monthInputToUtcDate(
              parsed.data.month,
            ),

          amount:
            parsed.data.amount,

          apr:
            debt
              ? parsed.data.apr
              : null,

          termMonths:
            debt
              ? Number(
                  parsed.data
                    .termMonths,
                )
              : null,

          repaymentStartMonth:
            repaymentStart
              ? monthInputToUtcDate(
                  repaymentStart,
                )
              : null,
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
          "This financing event is no longer available.",
      };
    }
  } catch (error) {
    console.error(
      "VentureScope financing update failed:",
      error,
    );

    return {
      status:
        "error",

      message:
        "We could not update this financing event.",
    };
  }

  revalidateFinancingOutputs(
    project.id,
  );

  return {
    status:
      "success",

    message:
      "Financing event updated. Forecast cash flow has been refreshed.",
  };
}

export async function deleteFinancingEventAction(
  formData: FormData,
): Promise<void> {
  const user =
    await requireUser();

  const parsed =
    deleteFinancingEventSchema.safeParse({
      projectId:
        formData.get(
          "projectId",
        ),

      eventId:
        formData.get(
          "eventId",
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
    await prisma.financingEvent.deleteMany({
      where: {
        id:
          parsed.data
            .eventId,

        projectId:
          project.id,
      },
    });
  } catch (error) {
    console.error(
      "VentureScope financing deletion failed:",
      error,
    );

    return;
  }

  revalidateFinancingOutputs(
    project.id,
  );
}
