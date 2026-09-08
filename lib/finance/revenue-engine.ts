import type Decimal from "decimal.js";

import type {
  DirectRevenueAssumptions,
} from "@/lib/finance/assumptions/types";
import {
  compoundValue,
  decimal,
  percentageToRate,
} from "@/lib/finance/math";

export type DirectRevenueMonthResult = {
  coreRevenue: Decimal;

  recurringRevenue: Decimal;

  nonRecurringRevenue: Decimal;

  oneTimeRevenue: Decimal;

  totalRevenue: Decimal;

  mrr: Decimal;
};

export function calculateDirectRevenueMonth(
  assumptions: DirectRevenueAssumptions,
  monthIndex: number,
): DirectRevenueMonthResult {
  const monthlyGrowthRate =
    percentageToRate(
      assumptions.monthlyGrowthRate,
    );

  const coreRevenue =
    compoundValue(
      assumptions
        .startingMonthlyRevenue,
      monthlyGrowthRate,
      monthIndex,
    );

  const recurringShare =
    percentageToRate(
      assumptions
        .recurringRevenuePercentage,
    );

  const recurringRevenue =
    coreRevenue.mul(
      recurringShare,
    );

  const coreNonRecurringRevenue =
    coreRevenue.minus(
      recurringRevenue,
    );

  const oneTimeRevenue =
    decimal(
      assumptions
        .monthlyOneTimeRevenue,
    );

  const nonRecurringRevenue =
    coreNonRecurringRevenue.plus(
      oneTimeRevenue,
    );

  const totalRevenue =
    coreRevenue.plus(
      oneTimeRevenue,
    );

  return {
    coreRevenue,
    recurringRevenue,
    nonRecurringRevenue,
    oneTimeRevenue,
    totalRevenue,
    mrr:
      recurringRevenue,
  };
}
