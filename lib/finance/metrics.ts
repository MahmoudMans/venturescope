import {
  averageDecimals,
  decimal,
  nullableFinancialString,
  percentageRatio,
  sumDecimals,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  AnnualForecast,
  BreakEvenResult,
  FinancialMetrics,
  MonthlyForecast,
  RunwayResult,
} from "@/lib/finance/types";

const SUSTAINED_BREAK_EVEN_MONTHS =
  3;

function calculateRunway(
  months: MonthlyForecast[],
  startingCash: string,
): RunwayResult {
  if (
    decimal(
      startingCash,
    ).lte(
      0,
    )
  ) {
    return {
      status:
        "ZERO",

      months:
        0,

      exhaustedMonth:
        months[0]
          ?.month ??
        null,

      horizonMonths:
        months.length,
    };
  }

  const exhaustedIndex =
    months.findIndex(
      (
        month,
      ) =>
        decimal(
          month.endingCash,
        ).lte(
          0,
        ),
    );

  if (
    exhaustedIndex >=
    0
  ) {
    return {
      status:
        "EXHAUSTED",

      months:
        exhaustedIndex +
        1,

      exhaustedMonth:
        months[
          exhaustedIndex
        ].month,

      horizonMonths:
        months.length,
    };
  }

  const trailingMonths =
    months.slice(
      -Math.min(
        3,
        months.length,
      ),
    );

  const sustainablyCashFlowPositive =
    trailingMonths.length >=
      3 &&
    trailingMonths.every(
      (
        month,
      ) =>
        decimal(
          month.operatingCashFlow,
        ).gte(
          0,
        ),
    );

  if (
    sustainablyCashFlowPositive
  ) {
    return {
      status:
        "CASH_FLOW_POSITIVE",

      months:
        null,

      exhaustedMonth:
        null,

      horizonMonths:
        months.length,
    };
  }

  return {
    status:
      "BEYOND_HORIZON",

    months:
      null,

    exhaustedMonth:
      null,

    horizonMonths:
      months.length,
  };
}

function calculateBreakEven(
  months: MonthlyForecast[],
): BreakEvenResult {
  const firstEbitdaBreakEven =
    months.find(
      (
        month,
      ) =>
        decimal(
          month.ebitda,
        ).gte(
          0,
        ),
    );

  let sustainedBreakEvenMonth:
    | string
    | null =
    null;

  for (
    let index =
      0;
    index <=
    months.length -
      SUSTAINED_BREAK_EVEN_MONTHS;
    index +=
      1
  ) {
    const window =
      months.slice(
        index,
        index +
          SUSTAINED_BREAK_EVEN_MONTHS,
      );

    if (
      window.every(
        (
          month,
        ) =>
          decimal(
            month.ebitda,
          ).gte(
            0,
          ),
      )
    ) {
      sustainedBreakEvenMonth =
        months[
          index
        ].month;

      break;
    }
  }

  return {
    firstEbitdaBreakEvenMonth:
      firstEbitdaBreakEven
        ?.month ??
      null,

    sustainedBreakEvenMonth,

    sustainedMonthsRequired:
      SUSTAINED_BREAK_EVEN_MONTHS,
  };
}

export function calculateFinancialMetrics(
  months: MonthlyForecast[],
  annual: AnnualForecast[],
  startingCash: string,
): FinancialMetrics {
  if (
    months.length ===
    0
  ) {
    throw new Error(
      "Financial metrics require at least one forecast month.",
    );
  }

  const totalRevenue =
    sumDecimals(
      months.map(
        (
          month,
        ) =>
          month.revenue,
      ),
    );

  const totalGrossProfit =
    sumDecimals(
      months.map(
        (
          month,
        ) =>
          month.grossProfit,
      ),
    );

  const totalEbitda =
    sumDecimals(
      months.map(
        (
          month,
        ) =>
          month.ebitda,
      ),
    );

  const totalNetIncome =
    sumDecimals(
      months.map(
        (
          month,
        ) =>
          month.netIncome,
      ),
    );

  const firstAnnual =
    annual[0];

  const lastMonth =
    months[
      months.length -
        1
    ];

  const initialWindow =
    months.slice(
      0,
      Math.min(
        3,
        months.length,
      ),
    );

  const initialThreeMonthAverageGrossBurn =
    averageDecimals(
      initialWindow.map(
        (
          month,
        ) =>
          decimal(
            month.grossBurn,
          ),
      ),
    );

  const initialThreeMonthAverageNetBurn =
    averageDecimals(
      initialWindow.map(
        (
          month,
        ) =>
          decimal(
            month.netBurn,
          ),
      ),
    );

  const grossMargin =
    percentageRatio(
      totalGrossProfit,
      totalRevenue,
    );

  const ebitdaMargin =
    percentageRatio(
      totalEbitda,
      totalRevenue,
    );

  const netMargin =
    percentageRatio(
      totalNetIncome,
      totalRevenue,
    );

  return {
    totalRevenue:
      toFinancialString(
        totalRevenue,
      ),

    totalGrossProfit:
      toFinancialString(
        totalGrossProfit,
      ),

    totalEbitda:
      toFinancialString(
        totalEbitda,
      ),

    totalNetIncome:
      toFinancialString(
        totalNetIncome,
      ),

    firstYearRevenue:
      firstAnnual
        ?.revenue ??
      "0",

    firstYearEbitda:
      firstAnnual
        ?.ebitda ??
      "0",

    endingCash:
      lastMonth.endingCash,

    endingMrr:
      lastMonth.mrr,

    endingArr:
      toFinancialString(
        decimal(
          lastMonth.mrr,
        ).mul(
          12,
        ),
      ),

    endingCustomers:
      lastMonth
        .endingCustomers,

    grossMarginPercentage:
      nullableFinancialString(
        grossMargin,
      ),

    ebitdaMarginPercentage:
      nullableFinancialString(
        ebitdaMargin,
      ),

    netMarginPercentage:
      nullableFinancialString(
        netMargin,
      ),

    initialThreeMonthAverageGrossBurn:
      toFinancialString(
        initialThreeMonthAverageGrossBurn,
      ),

    initialThreeMonthAverageNetBurn:
      toFinancialString(
        initialThreeMonthAverageNetBurn,
      ),

    initialBreakEvenRevenue:
      months[0]
        .breakEvenRevenue,

    runway:
      calculateRunway(
        months,
        startingCash,
      ),

    breakEven:
      calculateBreakEven(
        months,
      ),
  };
}
