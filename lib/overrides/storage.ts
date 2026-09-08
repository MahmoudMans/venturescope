import type {
  Prisma,
} from "@/generated/prisma/client";

import type {
  MonthlyOverrideValues,
} from "@/lib/finance/types";

export const MONTHLY_OVERRIDE_FIELDS = [
  "revenue",
  "marketing",
  "salaries",
  "rent",
  "cogs",
  "cac",
  "churnRate",
  "arpu",
] as const;

export type MonthlyOverrideField =
  (typeof MONTHLY_OVERRIDE_FIELDS)[number];

export function monthlyOverrideValuesFromForm(
  data: {
    revenue: string;

    marketing: string;

    salaries: string;

    rent: string;

    cogs: string;

    cac: string;

    churnRate: string;

    arpu: string;
  },
): MonthlyOverrideValues {
  const values: MonthlyOverrideValues =
    {};

  for (
    const field
    of MONTHLY_OVERRIDE_FIELDS
  ) {
    const value =
      data[field].trim();

    if (
      value !==
      ""
    ) {
      values[field] =
        value;
    }
  }

  return values;
}

export function monthlyOverrideValuesToJson(
  values: MonthlyOverrideValues,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(
      values,
    ),
  ) as Prisma.InputJsonValue;
}
