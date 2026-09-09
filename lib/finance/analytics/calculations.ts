import Decimal from "decimal.js";

import type {
  AdvancedFinancialAnalytics,
  AnnualCashFlow,
  DcfAssumptions,
  DcfResult,
  DcfSensitivityMatrix,
  ForecastAnalyticsRow,
  OperatingAnalytics,
  UnitEconomics,
} from "@/lib/finance/analytics/types";


function decimal(
  value:
    number,
): Decimal {
  return new Decimal(
    value,
  );
}


function valueOrZero(
  value:
    number |
    null,
): number {
  return value ??
    0;
}


function sumMetric(
  rows:
    ForecastAnalyticsRow[],
  metric:
    keyof ForecastAnalyticsRow,
): number {
  return rows.reduce(
    (
      total,
      row,
    ) => {
      const value =
        row[
          metric
        ];


      if (
        typeof value !==
        "number"
      ) {
        return total;
      }


      return total +
        value;
    },
    0,
  );
}


function lastNumber(
  rows:
    ForecastAnalyticsRow[],
  metric:
    keyof ForecastAnalyticsRow,
): number |
  null {
  for (
    let index =
      rows.length -
      1;
    index >=
      0;
    index -=
      1
  ) {
    const value =
      rows[
        index
      ][
        metric
      ];


    if (
      typeof value ===
        "number"
    ) {
      return value;
    }
  }


  return null;
}


function firstNumber(
  rows:
    ForecastAnalyticsRow[],
  metric:
    keyof ForecastAnalyticsRow,
): number |
  null {
  for (
    const row
    of rows
  ) {
    const value =
      row[
        metric
      ];


    if (
      typeof value ===
        "number"
    ) {
      return value;
    }
  }


  return null;
}


function grossProfitForRow(
  row:
    ForecastAnalyticsRow,
): number {
  if (
    row.grossProfit !==
    null
  ) {
    return row.grossProfit;
  }


  return (
    valueOrZero(
      row.revenue,
    ) -
    valueOrZero(
      row.cogs,
    )
  );
}


function cashFlowForRow(
  row:
    ForecastAnalyticsRow,
): number {
  if (
    row.cashFlow !==
    null
  ) {
    return row.cashFlow;
  }


  if (
    row.netIncome !==
    null
  ) {
    return row.netIncome;
  }


  return valueOrZero(
    row.ebitda,
  );
}


export function annualizeForecast(
  rows:
    ForecastAnalyticsRow[],
): AnnualCashFlow[] {
  const annual:
    AnnualCashFlow[] =
      [];


  for (
    let start =
      0;
    start <
      rows.length &&
    annual.length <
      5;
    start +=
      12
  ) {
    const block =
      rows.slice(
        start,
        start +
          12,
      );


    if (
      block.length ===
      0
    ) {
      continue;
    }


    annual.push({
      year:
        annual.length +
        1,

      freeCashFlow:
        block.reduce(
          (
            total,
            row,
          ) =>
            total +
            cashFlowForRow(
              row,
            ),
          0,
        ),

      revenue:
        sumMetric(
          block,
          "revenue",
        ),

      ebitda:
        sumMetric(
          block,
          "ebitda",
        ),
    });
  }


  return annual;
}


export function calculateDcf(
  rows:
    ForecastAnalyticsRow[],
  assumptions:
    DcfAssumptions,
): DcfResult |
  null {
  const annualCashFlows =
    annualizeForecast(
      rows,
    );


  if (
    annualCashFlows.length ===
      0 ||
    assumptions.discountRate <=
      assumptions.terminalGrowthRate ||
    assumptions.discountRate <=
      0
  ) {
    return null;
  }


  const discountRate =
    decimal(
      assumptions.discountRate,
    );


  const terminalGrowth =
    decimal(
      assumptions.terminalGrowthRate,
    );


  let presentValue =
    decimal(
      0,
    );


  annualCashFlows.forEach(
    (
      year,
      index,
    ) => {
      const denominator =
        decimal(
          1,
        )
          .plus(
            discountRate,
          )
          .pow(
            index +
              1,
          );


      presentValue =
        presentValue.plus(
          decimal(
            year.freeCashFlow,
          ).dividedBy(
            denominator,
          ),
        );
    },
  );


  const terminalCashFlow =
    decimal(
      annualCashFlows[
        annualCashFlows.length -
        1
      ].freeCashFlow,
    );


  const terminalValue =
    terminalCashFlow
      .times(
        decimal(
          1,
        ).plus(
          terminalGrowth,
        ),
      )
      .dividedBy(
        discountRate.minus(
          terminalGrowth,
        ),
      );


  const terminalDiscount =
    decimal(
      1,
    )
      .plus(
        discountRate,
      )
      .pow(
        annualCashFlows.length,
      );


  const presentTerminal =
    terminalValue.dividedBy(
      terminalDiscount,
    );


  const enterpriseValue =
    presentValue.plus(
      presentTerminal,
    );


  const endingCash =
    lastNumber(
      rows,
      "cashBalance",
    ) ??
    0;


  return {
    enterpriseValue:
      enterpriseValue.toNumber(),

    equityValueProxy:
      enterpriseValue
        .plus(
          endingCash,
        )
        .toNumber(),

    presentValueOfForecast:
      presentValue.toNumber(),

    presentValueOfTerminalValue:
      presentTerminal.toNumber(),

    terminalValue:
      terminalValue.toNumber(),

    annualCashFlows,
  };
}


function clamp(
  value:
    number,
  minimum:
    number,
  maximum:
    number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}


function uniqueSorted(
  values:
    number[],
): number[] {
  return [
    ...new Set(
      values.map(
        (
          value,
        ) =>
          Number(
            value.toFixed(
              4,
            ),
          ),
      ),
    ),
  ].sort(
    (
      left,
      right,
    ) =>
      left -
      right,
  );
}


export function calculateDcfSensitivity(
  rows:
    ForecastAnalyticsRow[],
  assumptions:
    DcfAssumptions,
): DcfSensitivityMatrix {
  const discountRates =
    uniqueSorted(
      [
        -0.04,
        -0.02,
        0,
        0.02,
        0.04,
      ].map(
        (
          delta,
        ) =>
          clamp(
            assumptions.discountRate +
              delta,
            0.01,
            0.8,
          ),
      ),
    );


  const terminalGrowthRates =
    uniqueSorted(
      [
        -0.02,
        -0.01,
        0,
        0.01,
        0.02,
      ].map(
        (
          delta,
        ) =>
          clamp(
            assumptions.terminalGrowthRate +
              delta,
            -0.05,
            0.15,
          ),
      ),
    );


  return {
    discountRates,

    terminalGrowthRates,

    cells:
      terminalGrowthRates.flatMap(
        (
          terminalGrowthRate,
        ) =>
          discountRates.map(
            (
              discountRate,
            ) => ({
              discountRate,

              terminalGrowthRate,

              enterpriseValue:
                terminalGrowthRate >=
                  discountRate -
                    0.0025
                  ?
                    null
                  :
                    calculateDcf(
                      rows,
                      {
                        discountRate,

                        terminalGrowthRate,
                      },
                    )
                      ?.enterpriseValue ??
                    null,
            }),
          ),
      ),
  };
}


export function calculateUnitEconomics(
  rows:
    ForecastAnalyticsRow[],
): UnitEconomics {
  const trailing =
    rows.slice(
      -12,
    );


  const revenue =
    sumMetric(
      trailing,
      "revenue",
    );


  const grossProfit =
    trailing.reduce(
      (
        total,
        row,
      ) =>
        total +
        grossProfitForRow(
          row,
        ),
      0,
    );


  const grossMarginRate =
    revenue !==
      0
      ?
        grossProfit /
        revenue
      :
        null;


  const latestMrr =
    lastNumber(
      rows,
      "mrr",
    );


  const latestCustomers =
    lastNumber(
      rows,
      "customers",
    );


  const monthlyArpu =
    latestMrr !==
      null &&
    latestCustomers !==
      null &&
    latestCustomers >
      0
      ?
        latestMrr /
        latestCustomers
      :
        null;


  const cac =
    lastNumber(
      rows,
      "cac",
    );


  const churnRate =
    lastNumber(
      rows,
      "churnRate",
    );


  const lifetimeValue =
    monthlyArpu !==
      null &&
    grossMarginRate !==
      null &&
    churnRate !==
      null &&
    churnRate >
      0
      ?
        (
          monthlyArpu *
          grossMarginRate
        ) /
        churnRate
      :
        null;


  const ltvToCac =
    lifetimeValue !==
      null &&
    cac !==
      null &&
    cac >
      0
      ?
        lifetimeValue /
        cac
      :
        null;


  const cacPaybackMonths =
    cac !==
      null &&
    monthlyArpu !==
      null &&
    grossMarginRate !==
      null &&
    monthlyArpu *
      grossMarginRate >
      0
      ?
        cac /
        (
          monthlyArpu *
          grossMarginRate
        )
      :
        null;


  return {
    monthlyArpu,

    grossMarginRate,

    lifetimeValue,

    cac,

    ltvToCac,

    cacPaybackMonths,

    churnRate,
  };
}


export function calculateOperatingAnalytics(
  rows:
    ForecastAnalyticsRow[],
): OperatingAnalytics {
  const trailing =
    rows.slice(
      -12,
    );


  const previous =
    rows.slice(
      -24,
      -12,
    );


  const trailingRevenue =
    sumMetric(
      trailing,
      "revenue",
    );


  const previousRevenue =
    sumMetric(
      previous,
      "revenue",
    );


  const trailingEbitda =
    sumMetric(
      trailing,
      "ebitda",
    );


  const revenueGrowthRate =
    previous.length >
      0 &&
    previousRevenue !==
      0
      ?
        (
          trailingRevenue -
          previousRevenue
        ) /
        Math.abs(
          previousRevenue,
        )
      :
        null;


  const ebitdaMarginRate =
    trailingRevenue !==
      0
      ?
        trailingEbitda /
        trailingRevenue
      :
        null;


  const trailingGrossProfit =
    trailing.reduce(
      (
        total,
        row,
      ) =>
        total +
        grossProfitForRow(
          row,
        ),
      0,
    );


  const contributionMarginRate =
    trailingRevenue !==
      0
      ?
        trailingGrossProfit /
        trailingRevenue
      :
        null;


  const ruleOf40 =
    revenueGrowthRate !==
      null &&
    ebitdaMarginRate !==
      null
      ?
        revenueGrowthRate +
        ebitdaMarginRate
      :
        null;


  const trailingCashFlow =
    trailing.reduce(
      (
        total,
        row,
      ) =>
        total +
        cashFlowForRow(
          row,
        ),
      0,
    );


  const netBurn =
    Math.max(
      0,
      -trailingCashFlow,
    );


  const endingMrr =
    lastNumber(
      trailing,
      "mrr",
    );


  const startingMrr =
    firstNumber(
      trailing,
      "mrr",
    );


  const netNewArr =
    endingMrr !==
      null &&
    startingMrr !==
      null
      ?
        Math.max(
          0,
          (
            endingMrr -
            startingMrr
          ) *
            12,
        )
      :
        0;


  const burnMultiple =
    netBurn >
      0 &&
    netNewArr >
      0
      ?
        netBurn /
        netNewArr
      :
        null;


  return {
    trailingRevenue,

    trailingEbitda,

    revenueGrowthRate,

    ebitdaMarginRate,

    contributionMarginRate,

    ruleOf40,

    burnMultiple,

    endingCashBalance:
      lastNumber(
        rows,
        "cashBalance",
      ),
  };
}


export function calculateAdvancedAnalytics(
  rows:
    ForecastAnalyticsRow[],
  assumptions:
    DcfAssumptions,
): AdvancedFinancialAnalytics {
  return {
    rowCount:
      rows.length,

    dcf:
      calculateDcf(
        rows,
        assumptions,
      ),

    sensitivity:
      calculateDcfSensitivity(
        rows,
        assumptions,
      ),

    unitEconomics:
      calculateUnitEconomics(
        rows,
      ),

    operating:
      calculateOperatingAnalytics(
        rows,
      ),
  };
}
