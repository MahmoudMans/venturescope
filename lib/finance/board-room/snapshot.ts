import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import {
  calculateVarianceReport,
} from "@/lib/finance/actuals/variance";

import {
  calculateForecastAccuracyReport,
} from "@/lib/finance/forecast-accuracy/calculations";

import {
  calculateLiquidityRiskReport,
} from "@/lib/finance/risk-center/calculations";

import {
  calculateCapitalPlanningReport,
} from "@/lib/finance/capital-planning/calculations";

import {
  buildExecutiveDecisionSignals,
} from "@/lib/finance/decision-center/signals";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import type {
  ExecutiveActionState,
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";


function isOpenStatus(
  status:
    string,
): boolean {
  return (
    status !==
      "DONE" &&
    status !==
      "DISMISSED"
  );
}


export function buildExecutiveReviewSnapshot({
  capturedAt,
  actuals,
  forecasts,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
  actions,
}: {
  capturedAt:
    string;

  actuals:
    ActualFinancialPeriod[];

  forecasts:
    ForecastAnalyticsRow[];

  riskPolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  actions:
    ExecutiveActionState[];
}): ExecutiveReviewSnapshot {
  const variance =
    calculateVarianceReport(
      actuals,
      forecasts,
    );


  const accuracy =
    calculateForecastAccuracyReport(
      actuals,
      forecasts,
    );


  const risk =
    calculateLiquidityRiskReport({
      rows:
        forecasts,

      policy:
        riskPolicy,

      latestActualPeriod,

      latestActualCash,
    });


  const capital =
    calculateCapitalPlanningReport({
      basis:
        "DOWNSIDE",

      rows:
        forecasts,

      riskPolicy,

      latestActualPeriod,

      latestActualCash,

      inputs: {
        targetCashFloor:
          Math.max(
            0,
            riskPolicy.minimumCash ??
            0,
          ),

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


  const forecastBiasCount =
    accuracy.metrics.filter(
      (
        metric,
      ) =>
        metric.bias ===
          "OVER_FORECASTING" ||
        metric.bias ===
          "UNDER_FORECASTING",
    ).length;


  const signals =
    buildExecutiveDecisionSignals({
      actualPeriods:
        actuals.length,

      revenueVarianceRate:
        variance.summary
          .revenueVarianceRate,

      ebitdaVarianceRate:
        variance.summary
          .ebitdaVarianceRate,

      forecastAccuracyScore:
        accuracy
          .overallAccuracyScore,

      forecastBiasCount,

      liquidityRiskLevel:
        risk.level,

      downsideCashExhaustionPeriod:
        risk
          .firstDownsideCashExhaustionPeriod,

      requiredCapital:
        capital
          .requiredCapitalAfterRaise,
    });


  const capturedTime =
    new Date(
      capturedAt,
    ).getTime();


  const openActions =
    actions.filter(
      (
        action,
      ) =>
        isOpenStatus(
          action.status,
        ),
    );


  const criticalOpen =
    openActions.filter(
      (
        action,
      ) =>
        action.priority ===
        "CRITICAL",
    ).length;


  const overdue =
    openActions.filter(
      (
        action,
      ) => {
        if (
          !action.dueDate
        ) {
          return false;
        }


        const due =
          new Date(
            action.dueDate,
          ).getTime();


        return (
          Number.isFinite(
            due,
          ) &&
          due <
            capturedTime
        );
      },
    ).length;


  const done =
    actions.filter(
      (
        action,
      ) =>
        action.status ===
        "DONE",
    ).length;


  return {
    schemaVersion:
      1,

    capturedAt,

    kpis: {
      actualPeriods:
        actuals.length,

      matchedPeriods:
        variance.summary
          .matchedPeriods,

      revenueVarianceRate:
        variance.summary
          .revenueVarianceRate,

      ebitdaVarianceRate:
        variance.summary
          .ebitdaVarianceRate,

      forecastAccuracyScore:
        accuracy
          .overallAccuracyScore,

      forecastWape:
        accuracy
          .overallWape,

      liquidityRiskLevel:
        risk.level,

      liquidityRiskScore:
        risk.score,

      minimumForecastCash:
        risk.minimumForecastCash,

      minimumDownsideCash:
        risk.minimumDownsideCash,

      downsideCashExhaustionPeriod:
        risk
          .firstDownsideCashExhaustionPeriod,

      capitalNeed:
        capital
          .requiredCapitalAfterRaise,
    },

    actions: {
      open:
        openActions.length,

      criticalOpen,

      overdue,

      done,
    },

    signals,
  };
}
