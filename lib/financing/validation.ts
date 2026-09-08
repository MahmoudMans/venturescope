import {
  z,
} from "zod";

const MONTH_PATTERN =
  /^\d{4}-(0[1-9]|1[0-2])$/;

function positiveMoney(
  label: string,
) {
  return z
    .string()
    .trim()
    .min(
      1,
      `${label} is required.`,
    )
    .refine(
      (
        value,
      ) =>
        /^-?(?:\d+|\d+\.\d+|\.\d+)$/.test(
          value,
        ) &&
        Number.isFinite(
          Number(
            value,
          ),
        ),
      `${label} must be a valid number.`,
    )
    .refine(
      (
        value,
      ) =>
        Number(
          value,
        ) >
        0,
      `${label} must be greater than 0.`,
    )
    .refine(
      (
        value,
      ) =>
        Number(
          value,
        ) <=
        1_000_000_000_000_000,
      `${label} is too large.`,
    );
}

function optionalApr() {
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
      "APR must be a valid number.",
    )
    .refine(
      (
        value,
      ) =>
        value === "" ||
        (
          Number(
            value,
          ) >=
            0 &&
          Number(
            value,
          ) <=
            100
        ),
      "APR must be between 0% and 100%.",
    );
}

const baseFinancingSchema =
  z
    .object({
      projectId:
        z
          .string()
          .trim()
          .min(
            1,
            "Project identifier is required.",
          ),

      name:
        z
          .string()
          .trim()
          .min(
            2,
            "Financing name must contain at least 2 characters.",
          )
          .max(
            100,
            "Financing name must contain at most 100 characters.",
          ),

      type:
        z.enum([
          "EQUITY",
          "DEBT",
          "GRANT",
          "OTHER",
        ]),

      month:
        z
          .string()
          .trim()
          .regex(
            MONTH_PATTERN,
            "Select a valid financing month.",
          ),

      amount:
        positiveMoney(
          "Financing amount",
        ),

      apr:
        optionalApr(),

      termMonths:
        z
          .string()
          .trim()
          .refine(
            (
              value,
            ) =>
              value === "" ||
              /^\d+$/.test(
                value,
              ),
            "Loan term must be a whole number of months.",
          )
          .refine(
            (
              value,
            ) =>
              value === "" ||
              (
                Number(
                  value,
                ) >=
                  1 &&
                Number(
                  value,
                ) <=
                  600
              ),
            "Loan term must be between 1 and 600 months.",
          ),

      repaymentStartMonth:
        z
          .string()
          .trim()
          .refine(
            (
              value,
            ) =>
              value === "" ||
              MONTH_PATTERN.test(
                value,
              ),
            "Select a valid repayment start month.",
          ),
    })
    .superRefine(
      (
        data,
        context,
      ) => {
        if (
          data.type !==
          "DEBT"
        ) {
          return;
        }

        if (
          data.apr ===
          ""
        ) {
          context.addIssue({
            code: "custom",
            path: [
              "apr",
            ],
            message:
              "APR is required for debt financing.",
          });
        }

        if (
          data.termMonths ===
          ""
        ) {
          context.addIssue({
            code: "custom",
            path: [
              "termMonths",
            ],
            message:
              "Loan term is required for debt financing.",
          });
        }
      },
    );

export const createFinancingEventSchema =
  baseFinancingSchema;

export const updateFinancingEventSchema =
  baseFinancingSchema.and(
    z.object({
      eventId:
        z
          .string()
          .trim()
          .min(
            1,
            "Financing event identifier is required.",
          ),
    }),
  );

export const deleteFinancingEventSchema =
  z.object({
    projectId:
      z
        .string()
        .trim()
        .min(
          1,
          "Project identifier is required.",
        ),

    eventId:
      z
        .string()
        .trim()
        .min(
          1,
          "Financing event identifier is required.",
        ),
  });
