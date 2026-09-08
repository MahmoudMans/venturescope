import type Decimal from "decimal.js";

import type {
  ExpenseAssumptions,
} from "@/lib/finance/assumptions/types";
import {
  annualPercentageToMonthlyRate,
  compoundValue,
  decimal,
  percentageToRate,
  sumDecimals,
} from "@/lib/finance/math";

export type MonthlyExpenseProfile = {
  salaries: Decimal;
  rent: Decimal;
  marketing: Decimal;

  software: Decimal;
  professionalServices: Decimal;
  insurance: Decimal;
  utilities: Decimal;
  travel: Decimal;
  other: Decimal;
  custom: Decimal;

  otherOperatingExpenses: Decimal;

  totalOperatingExpensesBeforeCogs: Decimal;

  cogsMethod:
    | "PERCENTAGE"
    | "FIXED_MONTHLY";

  cogsPercentageRate: Decimal;

  fixedMonthlyCogs: Decimal;
};

function growthRateForPeriod(
  percentage: string,
  period:
    | "MONTHLY"
    | "ANNUAL",
): Decimal {
  if (
    period ===
    "ANNUAL"
  ) {
    return annualPercentageToMonthlyRate(
      percentage,
    );
  }

  return percentageToRate(
    percentage,
  );
}

export function calculateMonthlyExpenseProfile(
  assumptions: ExpenseAssumptions,
  monthIndex: number,
): MonthlyExpenseProfile {
  const salaryMonthlyRate =
    annualPercentageToMonthlyRate(
      assumptions.salaries
        .annualGrowthRate,
    );

  const rentMonthlyRate =
    annualPercentageToMonthlyRate(
      assumptions.rent
        .annualGrowthRate,
    );

  const marketingRate =
    growthRateForPeriod(
      assumptions.marketing
        .growthRate,
      assumptions.marketing
        .growthPeriod,
    );

  const salaries =
    compoundValue(
      assumptions.salaries
        .monthlyAmount,
      salaryMonthlyRate,
      monthIndex,
    );

  const rent =
    compoundValue(
      assumptions.rent
        .monthlyAmount,
      rentMonthlyRate,
      monthIndex,
    );

  const marketing =
    compoundValue(
      assumptions.marketing
        .monthlyAmount,
      marketingRate,
      monthIndex,
    );

  const software =
    decimal(
      assumptions.operatingExpenses
        .software,
    );

  const professionalServices =
    decimal(
      assumptions.operatingExpenses
        .professionalServices,
    );

  const insurance =
    decimal(
      assumptions.operatingExpenses
        .insurance,
    );

  const utilities =
    decimal(
      assumptions.operatingExpenses
        .utilities,
    );

  const travel =
    decimal(
      assumptions.operatingExpenses
        .travel,
    );

  const other =
    decimal(
      assumptions.operatingExpenses
        .other,
    );

  const custom =
    sumDecimals(
      assumptions.operatingExpenses
        .custom.map(
          (
            expense,
          ) =>
            expense.monthlyAmount,
        ),
    );

  const otherOperatingExpenses =
    sumDecimals([
      software,
      professionalServices,
      insurance,
      utilities,
      travel,
      other,
      custom,
    ]);

  const totalOperatingExpensesBeforeCogs =
    sumDecimals([
      salaries,
      rent,
      marketing,
      otherOperatingExpenses,
    ]);

  return {
    salaries,
    rent,
    marketing,

    software,
    professionalServices,
    insurance,
    utilities,
    travel,
    other,
    custom,

    otherOperatingExpenses,

    totalOperatingExpensesBeforeCogs,

    cogsMethod:
      assumptions.cogs
        .method,

    cogsPercentageRate:
      percentageToRate(
        assumptions.cogs
          .percentage,
      ),

    fixedMonthlyCogs:
      decimal(
        assumptions.cogs
          .fixedMonthlyAmount,
      ),
  };
}

export function calculateCogs(
  profile: MonthlyExpenseProfile,
  revenue: Decimal,
): Decimal {
  if (
    profile.cogsMethod ===
    "FIXED_MONTHLY"
  ) {
    return profile.fixedMonthlyCogs;
  }

  return revenue.mul(
    profile.cogsPercentageRate,
  );
}
