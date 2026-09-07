import { z } from "zod";

import {
  PROJECT_CURRENCY_VALUES,
  PROJECT_HORIZONS,
  REVENUE_MODE_VALUES,
} from "@/lib/projects/project-options";

const projectNameSchema = z
  .string()
  .trim()
  .min(
    2,
    "Company name must contain at least 2 characters.",
  )
  .max(
    100,
    "Company name must contain at most 100 characters.",
  );

const projectIdSchema = z
  .string()
  .trim()
  .min(
    1,
    "Project identifier is required.",
  );

const startMonthSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    "Select a valid forecast start month.",
  );

export const createProjectSchema = z.object({
  name: projectNameSchema,

  industry: z
    .string()
    .trim()
    .max(
      100,
      "Industry must contain at most 100 characters.",
    )
    .transform((value) =>
      value.length === 0
        ? null
        : value,
    ),

  currency: z.enum(
    PROJECT_CURRENCY_VALUES,
  ),

  startMonth: startMonthSchema,

  horizonMonths: z.coerce
    .number()
    .int()
    .refine(
      (value) =>
        PROJECT_HORIZONS.includes(
          value as (typeof PROJECT_HORIZONS)[number],
        ),
      {
        message:
          "Forecast horizon must be 12, 24, 36, 48 or 60 months.",
      },
    ),

  revenueMode: z.enum(
    REVENUE_MODE_VALUES,
  ),
});

export const renameProjectSchema = z.object({
  projectId: projectIdSchema,
  name: projectNameSchema,
});

export const projectIdentifierSchema =
  projectIdSchema;
