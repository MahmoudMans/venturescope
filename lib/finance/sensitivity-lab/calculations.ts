import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import {
  buildDownsideCashScenario,
} from "@/lib/finance/risk-center/calculations";

import {
  calculateCapitalPlanningReport,
} from "@/lib/finance/capital-planning/calculations";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import type {
  SensitivityBoundaryPoint,
  SensitivityCell,
  SensitivityCellState,
  SensitivitySurface,
  SensitivitySurfaceSummary,
} from "@/lib/finance/sensitivity-lab/types";


export function buildSensitivityAxis(
  maximumRate:
    number,
  points:
    number,
): number[] {
  if (
    !Number.isFinite(
      maximumRate,
    ) ||
    maximumRate <
      0 ||
    maximumRate >
      1
  ) {
    throw new Error(
      "Sensitivity maximum rate must be between 0 and 100%.",
    );
  }


  if (
    !Number.isInteger(
      points,
    ) ||
    points <
      2 ||
    points >
      7
  ) {
    throw new Error(
      "Sensitivity grid must contain between 2 and 7 points per axis.",
    );
  }


  const divisor =
    points -
    1;


  return Array.from(
    {
      length:
        points,
    },
    (
      _,
      index,
    ) => {
      const raw =
        maximumRate *
        index /
        divisor;


      /*
       * Sensitivity rates are model coordinates rather than
       * accumulated financial arithmetic. Canonicalizing the
       * coordinate avoids IEEE-754 representations such as
       * 0.30000000000000004 and keeps grid keys, comparisons,
       * tests, and UI labels deterministic.
       */
      return Number(
        raw.toFixed(
          12,
        ),
      );
    },
  );
}


function minimum(
  values:
    number[],
): number |
  null {
  return values.length ===
    0
    ?
      null
    :
      Math.min(
        ...values,
      );
}


function ending(
  values:
    number[],
): number |
  null {
  return values.length ===
    0
    ?
      null
    :
      values[
        values.length -
        1
      ];
}


function stateForCell({
  minimumCash,
  exhaustionPeriod,
  targetCashFloor,
}: {
  minimumCash:
    number |
    null;

  exhaustionPeriod:
    string |
    null;

  targetCashFloor:
    number;
}): SensitivityCellState {
  if (
    exhaustionPeriod !==
    null
  ) {
    return "CASH_EXHAUSTION";
  }


  if (
    minimumCash !==
      null &&
    minimumCash <
      targetCashFloor
  ) {
    return "FLOOR_BREACH";
  }


  return "RESILIENT";
}


export function calculateSensitivityCell({
  rows,
  basePolicy,
  latestActualPeriod,
  latestActualCash,
  targetCashFloor,
  revenueShock,
  costInflation,
}: {
  rows:
    ForecastAnalyticsRow[];

  basePolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  targetCashFloor:
    number;

  revenueShock:
    number;

  costInflation:
    number;
}): SensitivityCell {
  if (
    revenueShock <
      0 ||
    revenueShock >
      1
  ) {
    throw new Error(
      "Revenue shock must be between 0 and 100%.",
    );
  }


  if (
    costInflation <
      0 ||
    costInflation >
      1
  ) {
    throw new Error(
      "Cost inflation must be between 0 and 100%.",
    );
  }


  if (
    targetCashFloor <
      0
  ) {
    throw new Error(
      "Target cash floor cannot be negative.",
    );
  }


  const policy:
    ProjectRiskPolicy = {
      ...basePolicy,

      minimumCash:
        targetCashFloor,

      downsideRevenueShock:
        revenueShock,

      downsideCostInflation:
        costInflation,
    };


  const downside =
    buildDownsideCashScenario(
      rows,
      policy,
      latestActualPeriod,
      latestActualCash,
    );


  const balances =
    downside.map(
      (
        point,
      ) =>
        point.stressedCashBalance,
    );


  const minimumCash =
    minimum(
      balances,
    );


  const endingCash =
    ending(
      balances,
    );


  const cashExhaustionPeriod =
    downside.find(
      (
        point,
      ) =>
        point.stressedCashBalance <=
        0,
    )?.period ??
    null;


  const capital =
    calculateCapitalPlanningReport({
      basis:
        "DOWNSIDE",

      rows,

      riskPolicy:
        policy,

      latestActualPeriod,

      latestActualCash,

      inputs: {
        targetCashFloor,

        raisePeriodIndex:
          0,

        capitalAmount:
          0,

        preMoneyValuation:
          0,

        annualDebtRate:
          0,

        debtTermMonths:
          36,

        hybridEquityShare:
          0.50,
      },
    });


  return {
    revenueShock,

    costInflation,

    minimumCash,

    endingCash,

    cashExhaustionPeriod,

    capitalNeed:
      capital
        .requiredCapitalAfterRaise,

    state:
      stateForCell({
        minimumCash,

        exhaustionPeriod:
          cashExhaustionPeriod,

        targetCashFloor,
      }),
  };
}


function buildBoundary({
  cells,
  revenueShocks,
}: {
  cells:
    SensitivityCell[];

  revenueShocks:
    number[];
}): SensitivityBoundaryPoint[] {
  return revenueShocks.map(
    (
      revenueShock,
    ) => {
      const resilientCosts =
        cells
          .filter(
            (
              cell,
            ) =>
              Math.abs(
                cell.revenueShock -
                revenueShock,
              ) <
              1e-12 &&
              cell.capitalNeed ===
              0,
          )
          .map(
            (
              cell,
            ) =>
              cell.costInflation,
          );


      return {
        revenueShock,

        maximumCostInflationWithoutFunding:
          resilientCosts.length ===
            0
            ?
              null
            :
              Math.max(
                ...resilientCosts,
              ),
      };
    },
  );
}


function summarize(
  cells:
    SensitivityCell[],
): SensitivitySurfaceSummary {
  const minimumCashValues =
    cells.flatMap(
      (
        cell,
      ) =>
        cell.minimumCash ===
          null
          ?
            []
          :
            [
              cell.minimumCash,
            ],
    );


  const exhaustionPeriods =
    cells.flatMap(
      (
        cell,
      ) =>
        cell.cashExhaustionPeriod
          ?
            [
              cell.cashExhaustionPeriod,
            ]
          :
            [],
    )
      .sort();


  return {
    totalCells:
      cells.length,

    resilientCells:
      cells.filter(
        (
          cell,
        ) =>
          cell.state ===
          "RESILIENT",
      ).length,

    floorBreachCells:
      cells.filter(
        (
          cell,
        ) =>
          cell.state ===
          "FLOOR_BREACH",
      ).length,

    cashExhaustionCells:
      cells.filter(
        (
          cell,
        ) =>
          cell.state ===
          "CASH_EXHAUSTION",
      ).length,

    worstMinimumCash:
      minimum(
        minimumCashValues,
      ),

    maximumCapitalNeed:
      cells.length ===
        0
        ?
          0
        :
          Math.max(
            ...cells.map(
              (
                cell,
              ) =>
                cell.capitalNeed,
            ),
          ),

    earliestCashExhaustionPeriod:
      exhaustionPeriods[
        0
      ] ??
      null,
  };
}


export function calculateSensitivitySurface({
  rows,
  basePolicy,
  latestActualPeriod,
  latestActualCash,
  targetCashFloor,
  revenueShocks,
  costInflations,
}: {
  rows:
    ForecastAnalyticsRow[];

  basePolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  targetCashFloor:
    number;

  revenueShocks:
    number[];

  costInflations:
    number[];
}): SensitivitySurface {
  if (
    revenueShocks.length <
      2 ||
    revenueShocks.length >
      7 ||
    costInflations.length <
      2 ||
    costInflations.length >
      7
  ) {
    throw new Error(
      "Sensitivity surfaces require between 2 and 7 values on each axis.",
    );
  }


  const normalizedRevenue =
    [
      ...revenueShocks,
    ].sort(
      (
        left,
        right,
      ) =>
        left -
        right,
    );


  const normalizedCosts =
    [
      ...costInflations,
    ].sort(
      (
        left,
        right,
      ) =>
        left -
        right,
    );


  const cells =
    normalizedRevenue.flatMap(
      (
        revenueShock,
      ) =>
        normalizedCosts.map(
          (
            costInflation,
          ) =>
            calculateSensitivityCell({
              rows,

              basePolicy,

              latestActualPeriod,

              latestActualCash,

              targetCashFloor,

              revenueShock,

              costInflation,
            }),
        ),
    );


  return {
    revenueShocks:
      normalizedRevenue,

    costInflations:
      normalizedCosts,

    targetCashFloor,

    cells,

    boundary:
      buildBoundary({
        cells,

        revenueShocks:
          normalizedRevenue,
      }),

    summary:
      summarize(
        cells,
      ),
  };
}
