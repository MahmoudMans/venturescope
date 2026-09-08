import {
  z,
} from "zod";

function decimalString(
  label: string,
  options: {
    min?: number;
    max?: number;
    exclusiveMin?: number;
  } = {},
) {
  return z
    .string()
    .trim()
    .min(
      1,
      `${label} is required.`,
    )
    .refine(
      (value) =>
        /^-?(?:\d+|\d+\.\d+|\.\d+)$/.test(
          value,
        ) &&
        Number.isFinite(
          Number(value),
        ),
      `${label} must be a valid number.`,
    )
    .refine(
      (value) =>
        options.min ===
          undefined ||
        Number(value) >=
          options.min,
      options.min ===
        undefined
        ? `${label} is invalid.`
        : `${label} must be at least ${options.min}.`,
    )
    .refine(
      (value) =>
        options.max ===
          undefined ||
        Number(value) <=
          options.max,
      options.max ===
        undefined
        ? `${label} is invalid.`
        : `${label} must not exceed ${options.max}.`,
    )
    .refine(
      (value) =>
        options.exclusiveMin ===
          undefined ||
        Number(value) >
          options.exclusiveMin,
      options.exclusiveMin ===
        undefined
        ? `${label} is invalid.`
        : `${label} must be greater than ${options.exclusiveMin}.`,
    );
}

function nonNegativeMoney(
  label: string,
) {
  return decimalString(
    label,
    {
      min: 0,
      max: 1_000_000_000_000_000,
    },
  );
}

function percentage(
  label: string,
) {
  return decimalString(
    label,
    {
      min: 0,
      max: 100,
    },
  );
}

function growthRate(
  label: string,
) {
  return decimalString(
    label,
    {
      min: -100,
      max: 10_000,
    },
  );
}

function nonNegativeInteger(
  label: string,
) {
  return z
    .string()
    .trim()
    .regex(
      /^\d+$/,
      `${label} must be a whole number.`,
    )
    .refine(
      (value) =>
        Number(value) <=
        1_000_000_000,
      `${label} is too large.`,
    );
}

export const projectAssumptionIdSchema =
  z
    .string()
    .trim()
    .min(
      1,
      "Project identifier is required.",
    );

export const generalAssumptionsFormSchema =
  z.object({
    projectId:
      projectAssumptionIdSchema,

    startingCash:
      nonNegativeMoney(
        "Starting cash",
      ),

    corporateTaxRate:
      percentage(
        "Corporate tax rate",
      ),
  });

export const directRevenueAssumptionsFormSchema =
  z.object({
    projectId:
      projectAssumptionIdSchema,

    startingMonthlyRevenue:
      nonNegativeMoney(
        "Starting monthly revenue",
      ),

    monthlyGrowthRate:
      growthRate(
        "Monthly revenue growth",
      ),

    recurringRevenuePercentage:
      percentage(
        "Recurring revenue percentage",
      ),

    monthlyOneTimeRevenue:
      nonNegativeMoney(
        "Monthly one-time revenue",
      ),
  });

export const customerRevenueAssumptionsFormSchema =
  z.object({
    projectId:
      projectAssumptionIdSchema,

    startingCustomers:
      nonNegativeInteger(
        "Starting customers",
      ),

    arpu:
      nonNegativeMoney(
        "ARPU",
      ),

    monthlyChurnRate:
      percentage(
        "Monthly churn",
      ),

    cac: decimalString(
      "Customer acquisition cost",
      {
        exclusiveMin: 0,
        max: 1_000_000_000_000_000,
      },
    ),

    organicNewCustomers:
      nonNegativeInteger(
        "Organic new customers",
      ),

    customerAcquisitionGrowthRate:
      growthRate(
        "Customer acquisition growth",
      ),

    arpuGrowthRate:
      growthRate(
        "ARPU growth",
      ),

    monthlyOneTimeRevenue:
      nonNegativeMoney(
        "Monthly one-time revenue",
      ),
  });

export const customOperatingExpenseFormSchema =
  z.object({
    id: z
      .string()
      .trim()
      .min(
        1,
        "Custom expense identifier is required.",
      )
      .max(
        100,
        "Custom expense identifier is too long.",
      ),

    name: z
      .string()
      .trim()
      .min(
        1,
        "Custom expense name is required.",
      )
      .max(
        60,
        "Custom expense name must contain at most 60 characters.",
      ),

    monthlyAmount:
      nonNegativeMoney(
        "Custom monthly expense",
      ),
  });

export const expenseAssumptionsFormSchema =
  z
    .object({
      projectId:
        projectAssumptionIdSchema,

      salariesMonthly:
        nonNegativeMoney(
          "Monthly salaries",
        ),

      salaryAnnualGrowthRate:
        growthRate(
          "Salary annual growth",
        ),

      rentMonthly:
        nonNegativeMoney(
          "Monthly rent",
        ),

      rentAnnualGrowthRate:
        growthRate(
          "Rent annual growth",
        ),

      marketingMonthly:
        nonNegativeMoney(
          "Monthly marketing",
        ),

      marketingGrowthRate:
        growthRate(
          "Marketing growth",
        ),

      marketingGrowthPeriod:
        z.enum([
          "MONTHLY",
          "ANNUAL",
        ]),

      cogsMethod:
        z.enum([
          "PERCENTAGE",
          "FIXED_MONTHLY",
        ]),

      cogsPercentage:
        percentage(
          "COGS percentage",
        ),

      cogsFixedMonthly:
        nonNegativeMoney(
          "Fixed monthly COGS",
        ),

      software:
        nonNegativeMoney(
          "Software expense",
        ),

      professionalServices:
        nonNegativeMoney(
          "Professional services expense",
        ),

      insurance:
        nonNegativeMoney(
          "Insurance expense",
        ),

      utilities:
        nonNegativeMoney(
          "Utilities expense",
        ),

      travel:
        nonNegativeMoney(
          "Travel expense",
        ),

      other:
        nonNegativeMoney(
          "Other operating expense",
        ),

      customExpenses:
        z
          .array(
            customOperatingExpenseFormSchema,
          )
          .max(
            20,
            "A model can contain at most 20 custom operating expense categories.",
          ),
    })
    .superRefine(
      (
        data,
        context,
      ) => {
        const names =
          new Set<string>();

        data.customExpenses.forEach(
          (
            expense,
            index,
          ) => {
            const normalized =
              expense.name
                .trim()
                .toLowerCase();

            if (
              names.has(
                normalized,
              )
            ) {
              context.addIssue({
                code: "custom",
                path: [
                  "customExpenses",
                  index,
                  "name",
                ],
                message:
                  "Custom expense names must be unique.",
              });
            }

            names.add(
              normalized,
            );
          },
        );
      },
    );

const storageDecimal =
  z.string();

export const financialAssumptionsV1StorageSchema =
  z.object({
    version:
      z.literal(1),

    completion:
      z.object({
        general:
          z.boolean(),

        revenue:
          z.boolean(),

        expenses:
          z.boolean(),
      }),

    general:
      z.object({
        startingCash:
          storageDecimal,

        corporateTaxRate:
          storageDecimal,
      }),

    directRevenue:
      z.object({
        startingMonthlyRevenue:
          storageDecimal,

        monthlyGrowthRate:
          storageDecimal,

        recurringRevenuePercentage:
          storageDecimal,

        monthlyOneTimeRevenue:
          storageDecimal,
      }),

    customerRevenue:
      z.object({
        startingCustomers:
          storageDecimal,

        arpu:
          storageDecimal,

        monthlyChurnRate:
          storageDecimal,

        cac:
          storageDecimal,

        organicNewCustomers:
          storageDecimal,

        customerAcquisitionGrowthRate:
          storageDecimal,

        arpuGrowthRate:
          storageDecimal,

        monthlyOneTimeRevenue:
          storageDecimal,
      }),

    expenses:
      z.object({
        salaries:
          z.object({
            monthlyAmount:
              storageDecimal,

            annualGrowthRate:
              storageDecimal,
          }),

        rent:
          z.object({
            monthlyAmount:
              storageDecimal,

            annualGrowthRate:
              storageDecimal,
          }),

        marketing:
          z.object({
            monthlyAmount:
              storageDecimal,

            growthRate:
              storageDecimal,

            growthPeriod:
              z.enum([
                "MONTHLY",
                "ANNUAL",
              ]),
          }),

        cogs:
          z.object({
            method:
              z.enum([
                "PERCENTAGE",
                "FIXED_MONTHLY",
              ]),

            percentage:
              storageDecimal,

            fixedMonthlyAmount:
              storageDecimal,
          }),

        operatingExpenses:
          z.object({
            software:
              storageDecimal,

            professionalServices:
              storageDecimal,

            insurance:
              storageDecimal,

            utilities:
              storageDecimal,

            travel:
              storageDecimal,

            other:
              storageDecimal,

            custom:
              z.array(
                z.object({
                  id:
                    z.string(),

                  name:
                    z.string(),

                  monthlyAmount:
                    storageDecimal,
                }),
              ),
          }),
      }),
  });
