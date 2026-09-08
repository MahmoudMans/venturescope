import type {
  Prisma,
} from "@/generated/prisma/client";

import {
  createDefaultFinancialAssumptions,
} from "@/lib/finance/assumptions/defaults";
import {
  financialAssumptionsV1StorageSchema,
} from "@/lib/finance/assumptions/schemas";
import type {
  FinancialAssumptionsV1,
} from "@/lib/finance/assumptions/types";

export function parseStoredFinancialAssumptions(
  value: unknown,
): FinancialAssumptionsV1 {
  const parsed =
    financialAssumptionsV1StorageSchema.safeParse(
      value,
    );

  if (
    parsed.success
  ) {
    return parsed.data;
  }

  return createDefaultFinancialAssumptions();
}

export function financialAssumptionsToJson(
  assumptions: FinancialAssumptionsV1,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(
      assumptions,
    ),
  ) as Prisma.InputJsonValue;
}

export function countCompletedAssumptionSections(
  assumptions: FinancialAssumptionsV1,
): number {
  return [
    assumptions.completion
      .general,
    assumptions.completion
      .revenue,
    assumptions.completion
      .expenses,
  ].filter(
    Boolean,
  ).length;
}
