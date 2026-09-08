import {
  decimal,
} from "@/lib/finance/math";
import type {
  MonthlyForecast,
  RevenueMode,
} from "@/lib/finance/types";

export type FinancialDashboardPoint = {
  month: string;

  revenue: number;

  totalExpenses: number;

  ebitda: number;

  endingCash: number;

  financingInflow: number;

  mrr: number;

  grossBurn: number;

  netBurn: number;

  endingCustomers: number | null;

  newCustomers: number | null;

  churnedCustomers: number | null;
};

export type FinancialDashboardData = {
  revenueMode: RevenueMode;

  points: FinancialDashboardPoint[];
};

function chartNumber(
  value:
    | string
    | null,
): number {
  if (
    value === null
  ) {
    return 0;
  }

  const result =
    decimal(
      value,
    ).toNumber();

  return Number.isFinite(
    result,
  )
    ? result
    : 0;
}

function nullableChartNumber(
  value:
    | string
    | null,
): number | null {
  if (
    value === null
  ) {
    return null;
  }

  return chartNumber(
    value,
  );
}

export function buildFinancialDashboardData(
  months: MonthlyForecast[],
  revenueMode: RevenueMode,
): FinancialDashboardData {
  return {
    revenueMode,

    points:
      months.map(
        (
          month,
        ) => ({
          month:
            month.month,

          revenue:
            chartNumber(
              month.revenue,
            ),

          totalExpenses:
            decimal(
              month.cogs,
            )
              .plus(
                month.totalOperatingExpenses,
              )
              .toNumber(),

          ebitda:
            chartNumber(
              month.ebitda,
            ),

          endingCash:
            chartNumber(
              month.endingCash,
            ),

          financingInflow:
            chartNumber(
              month.financingInflows
                .total,
            ),

          mrr:
            chartNumber(
              month.mrr,
            ),

          grossBurn:
            chartNumber(
              month.grossBurn,
            ),

          netBurn:
            chartNumber(
              month.netBurn,
            ),

          endingCustomers:
            nullableChartNumber(
              month.endingCustomers,
            ),

          newCustomers:
            nullableChartNumber(
              month.newCustomers,
            ),

          churnedCustomers:
            nullableChartNumber(
              month.churnedCustomers,
            ),
        }),
      ),
  };
}
