import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";

import {
  buildDownsideCashScenario,
} from "@/lib/finance/risk-center/calculations";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import type {
  AdjustedCapitalCashPoint,
  CapitalCashPoint,
  CapitalPlanningBasis,
  CapitalPlanningInputs,
  CapitalPlanningReport,
  CapitalStrategyKind,
  CapitalStrategyResult,
} from "@/lib/finance/capital-planning/types";


type NormalizedForecast = {
  period:
    string;

  row:
    ForecastAnalyticsRow;
};


function normalizeForecast(
  rows:
    ForecastAnalyticsRow[],
  latestActualPeriod:
    string |
    null,
): NormalizedForecast[] {
  const normalized =
    rows.flatMap<
      NormalizedForecast
    >(
      (
        row,
      ): NormalizedForecast[] => {
        const period =
          parseMonthKey(
            row.period,
          );


        return period
          ?
            [
              {
                period,
                row,
              },
            ]
          :
            [];
      },
    );


  const ordered =
    [
      ...normalized,
    ].sort(
      (
        left,
        right,
      ) =>
        left.period.localeCompare(
          right.period,
        ),
    );


  if (
    !latestActualPeriod
  ) {
    return ordered;
  }


  const future =
    ordered.filter(
      (
        entry,
      ) =>
        entry.period >
        latestActualPeriod,
    );


  return future.length >
    0
    ?
      future
    :
      ordered;
}


function cashFlowProxy(
  row:
    ForecastAnalyticsRow,
): number {
  return (
    row.cashFlow ??
    row.netIncome ??
    row.ebitda ??
    0
  );
}


export function buildBaseCapitalCashPath({
  rows,
  latestActualPeriod,
  latestActualCash,
}: {
  rows:
    ForecastAnalyticsRow[];

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;
}): CapitalCashPoint[] {
  const normalized =
    normalizeForecast(
      rows,
      latestActualPeriod,
    );


  let runningCash =
    latestActualCash ??
    0;


  return normalized.map(
    (
      entry,
    ) => {
      if (
        entry.row.cashBalance !==
        null
      ) {
        runningCash =
          entry.row.cashBalance;
      }
      else {
        runningCash +=
          cashFlowProxy(
            entry.row,
          );
      }


      return {
        period:
          entry.period,

        cashBalance:
          runningCash,
      };
    },
  );
}


export function buildCapitalSourceCashPath({
  basis,
  rows,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
}: {
  basis:
    CapitalPlanningBasis;

  rows:
    ForecastAnalyticsRow[];

  riskPolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;
}): CapitalCashPoint[] {
  if (
    basis ===
    "DOWNSIDE"
  ) {
    return buildDownsideCashScenario(
      rows,
      riskPolicy,
      latestActualPeriod,
      latestActualCash,
    ).map(
      (
        point,
      ) => ({
        period:
          point.period,

        cashBalance:
          point.stressedCashBalance,
      }),
    );
  }


  return buildBaseCapitalCashPath({
    rows,

    latestActualPeriod,

    latestActualCash,
  });
}


function minimumCash(
  path:
    CapitalCashPoint[],
): number |
  null {
  return path.length ===
    0
    ?
      null
    :
      Math.min(
        ...path.map(
          (
            point,
          ) =>
            point.cashBalance,
        ),
      );
}


function endingCash(
  path:
    CapitalCashPoint[],
): number |
  null {
  return path.length ===
    0
    ?
      null
    :
      path[
        path.length -
        1
      ].cashBalance;
}


function firstCashExhaustion(
  path:
    CapitalCashPoint[],
): string |
  null {
  return path.find(
    (
      point,
    ) =>
      point.cashBalance <=
      0,
  )?.period ??
    null;
}


function clampedRaiseIndex(
  path:
    CapitalCashPoint[],
  requested:
    number,
): number {
  if (
    path.length ===
    0
  ) {
    return 0;
  }


  return Math.min(
    path.length -
      1,
    Math.max(
      0,
      Math.trunc(
        requested,
      ),
    ),
  );
}


export function minimumCapitalRequired({
  path,
  targetCashFloor,
  raisePeriodIndex,
}: {
  path:
    CapitalCashPoint[];

  targetCashFloor:
    number;

  raisePeriodIndex:
    number;
}): number {
  if (
    path.length ===
    0
  ) {
    return 0;
  }


  const index =
    clampedRaiseIndex(
      path,
      raisePeriodIndex,
    );


  const minimumAfterRaise =
    Math.min(
      ...path
        .slice(
          index,
        )
        .map(
          (
            point,
          ) =>
            point.cashBalance,
        ),
    );


  return Math.max(
    0,
    targetCashFloor -
      minimumAfterRaise,
  );
}


export function firstPreRaiseFloorBreach({
  path,
  targetCashFloor,
  raisePeriodIndex,
}: {
  path:
    CapitalCashPoint[];

  targetCashFloor:
    number;

  raisePeriodIndex:
    number;
}): string |
  null {
  if (
    path.length ===
    0
  ) {
    return null;
  }


  const index =
    clampedRaiseIndex(
      path,
      raisePeriodIndex,
    );


  return path
    .slice(
      0,
      index,
    )
    .find(
      (
        point,
      ) =>
        point.cashBalance <
        targetCashFloor,
    )
    ?.period ??
    null;
}


export function amortizedMonthlyPayment({
  principal,
  annualRate,
  termMonths,
}: {
  principal:
    number;

  annualRate:
    number;

  termMonths:
    number;
}): number {
  if (
    principal <=
    0
  ) {
    return 0;
  }


  if (
    !Number.isInteger(
      termMonths,
    ) ||
    termMonths <=
      0
  ) {
    throw new Error(
      "Debt term must be a positive whole number of months.",
    );
  }


  if (
    annualRate <
      0
  ) {
    throw new Error(
      "Debt interest rate cannot be negative.",
    );
  }


  const monthlyRate =
    annualRate /
    12;


  if (
    monthlyRate ===
      0
  ) {
    return principal /
      termMonths;
  }


  return (
    principal *
    monthlyRate /
    (
      1 -
      (
        1 +
        monthlyRate
      ) **
      -termMonths
    )
  );
}


export function equityDilution({
  equityAmount,
  preMoneyValuation,
}: {
  equityAmount:
    number;

  preMoneyValuation:
    number;
}): number |
  null {
  if (
    equityAmount <=
    0
  ) {
    return 0;
  }


  if (
    preMoneyValuation <=
    0
  ) {
    return null;
  }


  return (
    equityAmount /
    (
      preMoneyValuation +
      equityAmount
    )
  );
}


function strategyMix({
  kind,
  capitalAmount,
  hybridEquityShare,
}: {
  kind:
    CapitalStrategyKind;

  capitalAmount:
    number;

  hybridEquityShare:
    number;
}): {
  equityAmount:
    number;

  debtAmount:
    number;
} {
  switch (
    kind
  ) {
    case "EQUITY":
      return {
        equityAmount:
          capitalAmount,

        debtAmount:
          0,
      };


    case "DEBT":
      return {
        equityAmount:
          0,

        debtAmount:
          capitalAmount,
      };


    case "HYBRID": {
      const equityAmount =
        capitalAmount *
        hybridEquityShare;


      return {
        equityAmount,

        debtAmount:
          capitalAmount -
          equityAmount,
      };
    }
  }
}


export function calculateCapitalStrategy({
  kind,
  path,
  inputs,
}: {
  kind:
    CapitalStrategyKind;

  path:
    CapitalCashPoint[];

  inputs:
    CapitalPlanningInputs;
}): CapitalStrategyResult {
  const capitalAmount =
    Math.max(
      0,
      inputs.capitalAmount,
    );


  const raiseIndex =
    clampedRaiseIndex(
      path,
      inputs.raisePeriodIndex,
    );


  const mix =
    strategyMix({
      kind,

      capitalAmount,

      hybridEquityShare:
        Math.min(
          1,
          Math.max(
            0,
            inputs.hybridEquityShare,
          ),
        ),
    });


  const monthlyDebtService =
    amortizedMonthlyPayment({
      principal:
        mix.debtAmount,

      annualRate:
        inputs.annualDebtRate,

      termMonths:
        inputs.debtTermMonths,
    });


  const totalDebtInterest =
    mix.debtAmount ===
      0
      ?
        0
      :
        (
          monthlyDebtService *
          inputs.debtTermMonths
        ) -
        mix.debtAmount;


  const cashPath:
    AdjustedCapitalCashPoint[] =
      path.map(
        (
          point,
          index,
        ) => {
          const injected =
            index >=
              raiseIndex
              ?
                capitalAmount
              :
                0;


          const elapsedPaymentMonths =
            index >
              raiseIndex
              ?
                Math.min(
                  index -
                    raiseIndex,
                  inputs.debtTermMonths,
                )
              :
                0;


          const cumulativeDebtService =
            monthlyDebtService *
            elapsedPaymentMonths;


          return {
            period:
              point.period,

            sourceCashBalance:
              point.cashBalance,

            adjustedCashBalance:
              point.cashBalance +
              injected -
              cumulativeDebtService,

            cumulativeDebtService,
          };
        },
      );


  const adjustedBalances =
    cashPath.map(
      (
        point,
      ) =>
        point.adjustedCashBalance,
    );


  const minimum =
    adjustedBalances.length ===
      0
      ?
        null
      :
        Math.min(
          ...adjustedBalances,
        );


  const ending =
    adjustedBalances.length ===
      0
      ?
        null
      :
        adjustedBalances[
          adjustedBalances.length -
          1
        ];


  const floorBreach =
    cashPath.find(
      (
        point,
      ) =>
        point.adjustedCashBalance <
        inputs.targetCashFloor,
    );


  const exhaustion =
    cashPath.find(
      (
        point,
      ) =>
        point.adjustedCashBalance <=
        0,
    );


  return {
    kind,

    capitalAmount,

    equityAmount:
      mix.equityAmount,

    debtAmount:
      mix.debtAmount,

    dilution:
      equityDilution({
        equityAmount:
          mix.equityAmount,

        preMoneyValuation:
          inputs.preMoneyValuation,
      }),

    monthlyDebtService,

    totalDebtInterest,

    minimumCash:
      minimum,

    endingCash:
      ending,

    floorBreachPeriod:
      floorBreach?.period ??
      null,

    cashExhaustionPeriod:
      exhaustion?.period ??
      null,

    monthsBelowFloor:
      cashPath.filter(
        (
          point,
        ) =>
          point.adjustedCashBalance <
          inputs.targetCashFloor,
      ).length,

    cashPath,
  };
}


export function calculateCapitalPlanningReport({
  basis,
  rows,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
  inputs,
}: {
  basis:
    CapitalPlanningBasis;

  rows:
    ForecastAnalyticsRow[];

  riskPolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  inputs:
    CapitalPlanningInputs;
}): CapitalPlanningReport {
  if (
    inputs.targetCashFloor <
      0
  ) {
    throw new Error(
      "Target cash floor cannot be negative.",
    );
  }


  if (
    inputs.capitalAmount <
      0
  ) {
    throw new Error(
      "Capital amount cannot be negative.",
    );
  }


  if (
    inputs.preMoneyValuation <
      0
  ) {
    throw new Error(
      "Pre-money valuation cannot be negative.",
    );
  }


  if (
    inputs.annualDebtRate <
      0 ||
    inputs.annualDebtRate >
      1
  ) {
    throw new Error(
      "Annual debt rate must be between 0 and 100%.",
    );
  }


  if (
    !Number.isInteger(
      inputs.debtTermMonths,
    ) ||
    inputs.debtTermMonths <
      1 ||
    inputs.debtTermMonths >
      120
  ) {
    throw new Error(
      "Debt term must be between 1 and 120 months.",
    );
  }


  if (
    inputs.hybridEquityShare <
      0 ||
    inputs.hybridEquityShare >
      1
  ) {
    throw new Error(
      "Hybrid equity share must be between 0 and 100%.",
    );
  }


  const sourcePath =
    buildCapitalSourceCashPath({
      basis,

      rows,

      riskPolicy,

      latestActualPeriod,

      latestActualCash,
    });


  const raisePeriodIndex =
    clampedRaiseIndex(
      sourcePath,
      inputs.raisePeriodIndex,
    );


  const requiredCapitalAfterRaise =
    minimumCapitalRequired({
      path:
        sourcePath,

      targetCashFloor:
        inputs.targetCashFloor,

      raisePeriodIndex,
    });


  const preRaiseFloorBreachPeriod =
    firstPreRaiseFloorBreach({
      path:
        sourcePath,

      targetCashFloor:
        inputs.targetCashFloor,

      raisePeriodIndex,
    });


  return {
    basis,

    targetCashFloor:
      inputs.targetCashFloor,

    raisePeriodIndex,

    raisePeriod:
      sourcePath[
        raisePeriodIndex
      ]?.period ??
      null,

    sourcePath,

    sourceMinimumCash:
      minimumCash(
        sourcePath,
      ),

    sourceEndingCash:
      endingCash(
        sourcePath,
      ),

    sourceCashExhaustionPeriod:
      firstCashExhaustion(
        sourcePath,
      ),

    requiredCapitalAfterRaise,

    preRaiseFloorBreachPeriod,

    strategies: (
      [
        "EQUITY",
        "DEBT",
        "HYBRID",
      ] as const
    ).map(
      (
        kind,
      ) =>
        calculateCapitalStrategy({
          kind,

          path:
            sourcePath,

          inputs: {
            ...inputs,

            raisePeriodIndex,
          },
        }),
    ),
  };
}
