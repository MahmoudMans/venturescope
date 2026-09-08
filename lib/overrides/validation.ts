import {
  z,
} from "zod";

const MONTH_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])$/;

function optionalNumber(
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
    .refine(
      (
        value,
      ) =>
        value === "" ||
        (
          /^-?(?:\d+|\d+\.\d+|\.\d+)$/.test(
            value,
          ) &&
          Number.isFinite(
            Number(
              value,
            ),
          )
        ),
      `${label} must be a valid number.`,
    )
    .refine(
      (
        value,
      ) =>
        value === "" ||
        options.min ===
          undefined ||
        Number(
          value,
        ) >=
          options.min,
      options.min ===
        undefined
        ? `${label} is invalid.`
        : `${label} must be at least ${options.min}.`,
    )
    .refine(
      (
        value,
      ) =>
        value === "" ||
        options.max ===
          undefined ||
        Number(
          value,
        ) <=
          options.max,
      options.max ===
        undefined
        ? `${label} is invalid.`
        : `${label} must not exceed ${options.max}.`,
    )
    .refine(
      (
        value,
      ) =>
        value === "" ||
        options.exclusiveMin ===
          undefined ||
        Number(
          value,
        ) >
          options.exclusiveMin,
      options.exclusiveMin ===
        undefined
        ? `${label} is invalid.`
        : `${label} must be greater than ${options.exclusiveMin}.`,
    );
}

const nonNegativeMoney =
  (
    label: string,
  ) =>
    optionalNumber(
      label,
      {
        min:
          0,

        max:
          1_000_000_000_000_000,
      },
    );

const fields = {
  projectId:
    z
      .string()
      .trim()
      .min(
        1,
        "Project identifier is required.",
      ),

  scenarioId:
    z
      .string()
      .trim(),

  month:
    z
      .string()
      .trim()
      .regex(
        MONTH_PATTERN,
        "Select a valid override month.",
      ),

  revenue:
    nonNegativeMoney(
      "Revenue override",
    ),

  marketing:
    nonNegativeMoney(
      "Marketing override",
    ),

  salaries:
    nonNegativeMoney(
      "Salary override",
    ),

  rent:
    nonNegativeMoney(
      "Rent override",
    ),

  cogs:
    nonNegativeMoney(
      "COGS override",
    ),

  cac:
    optionalNumber(
      "CAC override",
      {
        exclusiveMin:
          0,

        max:
          1_000_000_000_000_000,
      },
    ),

  churnRate:
    optionalNumber(
      "Churn override",
      {
        min:
          0,

        max:
          100,
      },
    ),

  arpu:
    nonNegativeMoney(
      "ARPU override",
    ),

  note:
    z
      .string()
      .trim()
      .max(
        240,
        "Override note must contain at most 240 characters.",
      ),
};

function withAtLeastOneOverride<
  T extends z.ZodRawShape,
>(
  schema: z.ZodObject<T>,
) {
  return schema.superRefine(
    (
      data,
      context,
    ) => {
      const candidate =
        data as Record<
          string,
          unknown
        >;

      const overrideFields = [
        "revenue",
        "marketing",
        "salaries",
        "rent",
        "cogs",
        "cac",
        "churnRate",
        "arpu",
      ];

      const anyConfigured =
        overrideFields.some(
          (
            field,
          ) =>
            typeof candidate[
              field
            ] ===
              "string" &&
            (
              candidate[
                field
              ] as string
            ).trim() !==
              "",
        );

      if (
        !anyConfigured
      ) {
        context.addIssue({
          code:
            "custom",

          path: [
            "revenue",
          ],

          message:
            "Configure at least one monthly override value.",
        });
      }
    },
  );
}

export const createMonthlyOverrideSchema =
  withAtLeastOneOverride(
    z.object(
      fields,
    ),
  );

export const updateMonthlyOverrideSchema =
  withAtLeastOneOverride(
    z.object({
      ...fields,

      overrideId:
        z
          .string()
          .trim()
          .min(
            1,
            "Override identifier is required.",
          ),
    }),
  );

export const deleteMonthlyOverrideSchema =
  z.object({
    projectId:
      fields.projectId,

    overrideId:
      z
        .string()
        .trim()
        .min(
          1,
          "Override identifier is required.",
        ),
  });
