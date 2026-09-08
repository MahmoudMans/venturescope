import Decimal from "decimal.js";

import {
  nullableFinancialString,
  percentageRatio,
  sumDecimals,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  AnnualForecast,
  MonthlyForecast,
} from "@/lib/finance/types";

function decimalField(
  month: MonthlyForecast,
  field:
    | "revenue"
    | "recurringRevenue"
    | "oneTimeRevenue"
    | "cogs"
    | "grossProfit"
    | "salaries"
    | "rent"
    | "marketing"
    | "otherOperatingExpenses"
    | "totalOperatingExpenses"
    | "ebitda"
    | "interestExpense"
    | "tax"
    | "netIncome"
    | "operatingCashFlow"
    | "debtPrincipalRepayment"
    | "netCashMovement"
    | "grossBurn"
    | "netBurn",
): string {
  return month[
    field
  ];
}

export function aggregateAnnualForecast(
  months: MonthlyForecast[],
): AnnualForecast[] {
  const grouped =
    new Map<
      number,
      MonthlyForecast[]
    >();

  for (
    const month
    of months
  ) {
    const existing =
      grouped.get(
        month.year,
      ) ??
      [];

    existing.push(
      month,
    );

    grouped.set(
      month.year,
      existing,
    );
  }

  return Array.from(
    grouped.entries(),
  )
    .sort(
      (
        left,
        right,
      ) =>
        left[0] -
        right[0],
    )
    .map(
      (
        [
          year,
          yearMonths,
        ],
      ) => {
        const sum =
          (
            field:
              | "revenue"
              | "recurringRevenue"
              | "oneTimeRevenue"
              | "cogs"
              | "grossProfit"
              | "salaries"
              | "rent"
              | "marketing"
              | "otherOperatingExpenses"
              | "totalOperatingExpenses"
              | "ebitda"
              | "interestExpense"
              | "tax"
              | "netIncome"
              | "operatingCashFlow"
              | "debtPrincipalRepayment"
              | "netCashMovement"
              | "grossBurn"
              | "netBurn",
          ) =>
            sumDecimals(
              yearMonths.map(
                (
                  month,
                ) =>
                  decimalField(
                    month,
                    field,
                  ),
              ),
            );

        const revenue =
          sum(
            "revenue",
          );

        const grossProfit =
          sum(
            "grossProfit",
          );

        const ebitda =
          sum(
            "ebitda",
          );

        const netIncome =
          sum(
            "netIncome",
          );

        const financingInflow =
          sumDecimals(
            yearMonths.map(
              (
                month,
              ) =>
                month.financingInflows
                  .total,
            ),
          );

        const lastMonth =
          yearMonths[
            yearMonths.length -
              1
          ];

        const grossMargin =
          percentageRatio(
            grossProfit,
            revenue,
          );

        const ebitdaMargin =
          percentageRatio(
            ebitda,
            revenue,
          );

        const netMargin =
          percentageRatio(
            netIncome,
            revenue,
          );

        const averageGrossBurn =
          sum(
            "grossBurn",
          ).div(
            yearMonths.length,
          );

        const averageNetBurn =
          sum(
            "netBurn",
          ).div(
            yearMonths.length,
          );

        return {
          year,

          monthsIncluded:
            yearMonths.length,

          revenue:
            toFinancialString(
              revenue,
            ),

          recurringRevenue:
            toFinancialString(
              sum(
                "recurringRevenue",
              ),
            ),

          oneTimeRevenue:
            toFinancialString(
              sum(
                "oneTimeRevenue",
              ),
            ),

          cogs:
            toFinancialString(
              sum(
                "cogs",
              ),
            ),

          grossProfit:
            toFinancialString(
              grossProfit,
            ),

          grossMarginPercentage:
            nullableFinancialString(
              grossMargin,
            ),

          salaries:
            toFinancialString(
              sum(
                "salaries",
              ),
            ),

          rent:
            toFinancialString(
              sum(
                "rent",
              ),
            ),

          marketing:
            toFinancialString(
              sum(
                "marketing",
              ),
            ),

          otherOperatingExpenses:
            toFinancialString(
              sum(
                "otherOperatingExpenses",
              ),
            ),

          totalOperatingExpenses:
            toFinancialString(
              sum(
                "totalOperatingExpenses",
              ),
            ),

          ebitda:
            toFinancialString(
              ebitda,
            ),

          ebitdaMarginPercentage:
            nullableFinancialString(
              ebitdaMargin,
            ),

          interestExpense:
            toFinancialString(
              sum(
                "interestExpense",
              ),
            ),

          tax:
            toFinancialString(
              sum(
                "tax",
              ),
            ),

          netIncome:
            toFinancialString(
              netIncome,
            ),

          netMarginPercentage:
            nullableFinancialString(
              netMargin,
            ),

          operatingCashFlow:
            toFinancialString(
              sum(
                "operatingCashFlow",
              ),
            ),

          financingInflow:
            toFinancialString(
              financingInflow,
            ),

          debtPrincipalRepayment:
            toFinancialString(
              sum(
                "debtPrincipalRepayment",
              ),
            ),

          netCashMovement:
            toFinancialString(
              sum(
                "netCashMovement",
              ),
            ),

          endingCash:
            lastMonth
              .endingCash,

          endingMrr:
            lastMonth.mrr,

          endingCustomers:
            lastMonth
              .endingCustomers,

          averageGrossBurn:
            toFinancialString(
              averageGrossBurn,
            ),

          averageNetBurn:
            toFinancialString(
              averageNetBurn,
            ),
        };
      },
    );
}
