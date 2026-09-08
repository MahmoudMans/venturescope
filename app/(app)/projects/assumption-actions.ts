"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireUser,
} from "@/lib/auth/require-user";
import type {
  AssumptionActionState,
} from "@/lib/finance/assumptions/action-state";
import {
  assumptionFieldErrors,
} from "@/lib/finance/assumptions/action-state";
import {
  customerRevenueAssumptionsFormSchema,
  directRevenueAssumptionsFormSchema,
  expenseAssumptionsFormSchema,
  generalAssumptionsFormSchema,
  projectAssumptionIdSchema,
} from "@/lib/finance/assumptions/schemas";
import {
  financialAssumptionsToJson,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import {
  prisma,
} from "@/lib/db/prisma";

async function findOwnedProjectForAssumptions(
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
      revenueMode: true,
      baseAssumptions: true,
    },
  });
}

function revalidateAssumptionPages(
  projectId: string,
) {
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
    "/dashboard",
  );
}

export async function saveGeneralAssumptionsAction(
  _previousState: AssumptionActionState,
  formData: FormData,
): Promise<AssumptionActionState> {
  const user =
    await requireUser();

  const parsed =
    generalAssumptionsFormSchema.safeParse(
      {
        projectId:
          formData.get(
            "projectId",
          ),

        startingCash:
          formData.get(
            "startingCash",
          ),

        corporateTaxRate:
          formData.get(
            "corporateTaxRate",
          ),
      },
    );

  if (
    !parsed.success
  ) {
    return {
      status: "error",

      message:
        "Please correct the highlighted assumptions.",

      errors:
        assumptionFieldErrors(
          parsed.error,
        ),
    };
  }

  const project =
    await findOwnedProjectForAssumptions(
      user.id,
      parsed.data
        .projectId,
    );

  if (!project) {
    return {
      status: "error",
      message:
        "This financial model is no longer available.",
    };
  }

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  const nextAssumptions = {
    ...assumptions,

    completion: {
      ...assumptions.completion,
      general: true,
    },

    general: {
      startingCash:
        parsed.data
          .startingCash,

      corporateTaxRate:
        parsed.data
          .corporateTaxRate,
    },
  };

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
          baseAssumptions:
            financialAssumptionsToJson(
              nextAssumptions,
            ),
        },
      });

    if (
      result.count !== 1
    ) {
      return {
        status: "error",
        message:
          "This financial model is no longer available.",
      };
    }
  } catch (error) {
    console.error(
      "VentureScope general assumption save failed:",
      error,
    );

    return {
      status: "error",
      message:
        "We could not save the general financial assumptions.",
    };
  }

  revalidateAssumptionPages(
    project.id,
  );

  return {
    status: "success",
    message:
      "General financial assumptions saved.",
  };
}

export async function saveRevenueAssumptionsAction(
  _previousState: AssumptionActionState,
  formData: FormData,
): Promise<AssumptionActionState> {
  const user =
    await requireUser();

  const projectIdResult =
    projectAssumptionIdSchema.safeParse(
      formData.get(
        "projectId",
      ),
    );

  if (
    !projectIdResult.success
  ) {
    return {
      status: "error",
      message:
        "The financial model identifier is invalid.",
    };
  }

  const project =
    await findOwnedProjectForAssumptions(
      user.id,
      projectIdResult.data,
    );

  if (!project) {
    return {
      status: "error",
      message:
        "This financial model is no longer available.",
    };
  }

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  if (
    project.revenueMode ===
    "DIRECT"
  ) {
    const parsed =
      directRevenueAssumptionsFormSchema.safeParse(
        {
          projectId:
            project.id,

          startingMonthlyRevenue:
            formData.get(
              "startingMonthlyRevenue",
            ),

          monthlyGrowthRate:
            formData.get(
              "monthlyGrowthRate",
            ),

          recurringRevenuePercentage:
            formData.get(
              "recurringRevenuePercentage",
            ),

          monthlyOneTimeRevenue:
            formData.get(
              "monthlyOneTimeRevenue",
            ),
        },
      );

    if (
      !parsed.success
    ) {
      return {
        status: "error",

        message:
          "Please correct the highlighted revenue assumptions.",

        errors:
          assumptionFieldErrors(
            parsed.error,
          ),
      };
    }

    const nextAssumptions = {
      ...assumptions,

      completion: {
        ...assumptions.completion,
        revenue: true,
      },

      directRevenue: {
        startingMonthlyRevenue:
          parsed.data
            .startingMonthlyRevenue,

        monthlyGrowthRate:
          parsed.data
            .monthlyGrowthRate,

        recurringRevenuePercentage:
          parsed.data
            .recurringRevenuePercentage,

        monthlyOneTimeRevenue:
          parsed.data
            .monthlyOneTimeRevenue,
      },
    };

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
            baseAssumptions:
              financialAssumptionsToJson(
                nextAssumptions,
              ),
          },
        });

      if (
        result.count !== 1
      ) {
        return {
          status: "error",
          message:
            "This financial model is no longer available.",
        };
      }
    } catch (error) {
      console.error(
        "VentureScope direct revenue assumption save failed:",
        error,
      );

      return {
        status: "error",
        message:
          "We could not save the revenue assumptions.",
      };
    }
  } else {
    const parsed =
      customerRevenueAssumptionsFormSchema.safeParse(
        {
          projectId:
            project.id,

          startingCustomers:
            formData.get(
              "startingCustomers",
            ),

          arpu:
            formData.get(
              "arpu",
            ),

          monthlyChurnRate:
            formData.get(
              "monthlyChurnRate",
            ),

          cac:
            formData.get(
              "cac",
            ),

          organicNewCustomers:
            formData.get(
              "organicNewCustomers",
            ),

          customerAcquisitionGrowthRate:
            formData.get(
              "customerAcquisitionGrowthRate",
            ),

          arpuGrowthRate:
            formData.get(
              "arpuGrowthRate",
            ),

          monthlyOneTimeRevenue:
            formData.get(
              "monthlyOneTimeRevenue",
            ),
        },
      );

    if (
      !parsed.success
    ) {
      return {
        status: "error",

        message:
          "Please correct the highlighted customer and revenue assumptions.",

        errors:
          assumptionFieldErrors(
            parsed.error,
          ),
      };
    }

    const nextAssumptions = {
      ...assumptions,

      completion: {
        ...assumptions.completion,
        revenue: true,
      },

      customerRevenue: {
        startingCustomers:
          parsed.data
            .startingCustomers,

        arpu:
          parsed.data.arpu,

        monthlyChurnRate:
          parsed.data
            .monthlyChurnRate,

        cac:
          parsed.data.cac,

        organicNewCustomers:
          parsed.data
            .organicNewCustomers,

        customerAcquisitionGrowthRate:
          parsed.data
            .customerAcquisitionGrowthRate,

        arpuGrowthRate:
          parsed.data
            .arpuGrowthRate,

        monthlyOneTimeRevenue:
          parsed.data
            .monthlyOneTimeRevenue,
      },
    };

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
            baseAssumptions:
              financialAssumptionsToJson(
                nextAssumptions,
              ),
          },
        });

      if (
        result.count !== 1
      ) {
        return {
          status: "error",
          message:
            "This financial model is no longer available.",
        };
      }
    } catch (error) {
      console.error(
        "VentureScope customer revenue assumption save failed:",
        error,
      );

      return {
        status: "error",
        message:
          "We could not save the customer and revenue assumptions.",
      };
    }
  }

  revalidateAssumptionPages(
    project.id,
  );

  return {
    status: "success",
    message:
      "Revenue assumptions saved.",
  };
}

export async function saveExpenseAssumptionsAction(
  _previousState: AssumptionActionState,
  formData: FormData,
): Promise<AssumptionActionState> {
  const user =
    await requireUser();

  const customIds =
    formData
      .getAll(
        "customExpenseId",
      )
      .map(
        String,
      );

  const customNames =
    formData
      .getAll(
        "customExpenseName",
      )
      .map(
        String,
      );

  const customAmounts =
    formData
      .getAll(
        "customExpenseMonthlyAmount",
      )
      .map(
        String,
      );

  const customExpenses =
    customIds.map(
      (
        id,
        index,
      ) => ({
        id,

        name:
          customNames[
            index
          ] ?? "",

        monthlyAmount:
          customAmounts[
            index
          ] ?? "",
      }),
    );

  const parsed =
    expenseAssumptionsFormSchema.safeParse(
      {
        projectId:
          formData.get(
            "projectId",
          ),

        salariesMonthly:
          formData.get(
            "salariesMonthly",
          ),

        salaryAnnualGrowthRate:
          formData.get(
            "salaryAnnualGrowthRate",
          ),

        rentMonthly:
          formData.get(
            "rentMonthly",
          ),

        rentAnnualGrowthRate:
          formData.get(
            "rentAnnualGrowthRate",
          ),

        marketingMonthly:
          formData.get(
            "marketingMonthly",
          ),

        marketingGrowthRate:
          formData.get(
            "marketingGrowthRate",
          ),

        marketingGrowthPeriod:
          formData.get(
            "marketingGrowthPeriod",
          ),

        cogsMethod:
          formData.get(
            "cogsMethod",
          ),

        cogsPercentage:
          formData.get(
            "cogsPercentage",
          ),

        cogsFixedMonthly:
          formData.get(
            "cogsFixedMonthly",
          ),

        software:
          formData.get(
            "software",
          ),

        professionalServices:
          formData.get(
            "professionalServices",
          ),

        insurance:
          formData.get(
            "insurance",
          ),

        utilities:
          formData.get(
            "utilities",
          ),

        travel:
          formData.get(
            "travel",
          ),

        other:
          formData.get(
            "other",
          ),

        customExpenses,
      },
    );

  if (
    !parsed.success
  ) {
    return {
      status: "error",

      message:
        "Please correct the highlighted expense assumptions.",

      errors:
        assumptionFieldErrors(
          parsed.error,
        ),
    };
  }

  const project =
    await findOwnedProjectForAssumptions(
      user.id,
      parsed.data
        .projectId,
    );

  if (!project) {
    return {
      status: "error",
      message:
        "This financial model is no longer available.",
    };
  }

  const assumptions =
    parseStoredFinancialAssumptions(
      project.baseAssumptions,
    );

  const nextAssumptions = {
    ...assumptions,

    completion: {
      ...assumptions.completion,
      expenses: true,
    },

    expenses: {
      salaries: {
        monthlyAmount:
          parsed.data
            .salariesMonthly,

        annualGrowthRate:
          parsed.data
            .salaryAnnualGrowthRate,
      },

      rent: {
        monthlyAmount:
          parsed.data
            .rentMonthly,

        annualGrowthRate:
          parsed.data
            .rentAnnualGrowthRate,
      },

      marketing: {
        monthlyAmount:
          parsed.data
            .marketingMonthly,

        growthRate:
          parsed.data
            .marketingGrowthRate,

        growthPeriod:
          parsed.data
            .marketingGrowthPeriod,
      },

      cogs: {
        method:
          parsed.data
            .cogsMethod,

        percentage:
          parsed.data
            .cogsPercentage,

        fixedMonthlyAmount:
          parsed.data
            .cogsFixedMonthly,
      },

      operatingExpenses: {
        software:
          parsed.data
            .software,

        professionalServices:
          parsed.data
            .professionalServices,

        insurance:
          parsed.data
            .insurance,

        utilities:
          parsed.data
            .utilities,

        travel:
          parsed.data
            .travel,

        other:
          parsed.data
            .other,

        custom:
          parsed.data
            .customExpenses,
      },
    },
  };

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
          baseAssumptions:
            financialAssumptionsToJson(
              nextAssumptions,
            ),
        },
      });

    if (
      result.count !== 1
    ) {
      return {
        status: "error",
        message:
          "This financial model is no longer available.",
      };
    }
  } catch (error) {
    console.error(
      "VentureScope expense assumption save failed:",
      error,
    );

    return {
      status: "error",
      message:
        "We could not save the expense assumptions.",
    };
  }

  revalidateAssumptionPages(
    project.id,
  );

  return {
    status: "success",
    message:
      "Expense assumptions saved.",
  };
}
