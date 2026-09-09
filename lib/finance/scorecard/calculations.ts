import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";

import {
  calculateForecastAccuracyReport,
} from "@/lib/finance/forecast-accuracy/calculations";

import {
  calculateLiquidityRiskReport,
} from "@/lib/finance/risk-center/calculations";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import {
  kpiMetricDefinition,
} from "@/lib/finance/scorecard/metrics";

import type {
  KpiMetricCode,
  KpiScorecardRow,
  KpiTargetStatus,
  KpiTargetView,
  KpiValueSource,
  ManagementScorecard,
} from "@/lib/finance/scorecard/types";


type KpiObservedValue = {
  value:
    number |
    null;

  source:
    KpiValueSource;
};


function actualForPeriod(
  actuals:
    ActualFinancialPeriod[],
  period:
    string,
): ActualFinancialPeriod |
  null {
  return actuals.find(
    (
      actual,
    ) =>
      actual.period ===
      period,
  ) ??
    null;
}


function forecastForPeriod(
  forecasts:
    ForecastAnalyticsRow[],
  period:
    string,
): ForecastAnalyticsRow |
  null {
  return forecasts.find(
    (
      forecast,
    ) =>
      parseMonthKey(
        forecast.period,
      ) ===
      period,
  ) ??
    null;
}


function periodValue({
  metric,
  period,
  actuals,
  forecasts,
}: {
  metric:
    KpiMetricCode;

  period:
    string;

  actuals:
    ActualFinancialPeriod[];

  forecasts:
    ForecastAnalyticsRow[];
}): KpiObservedValue {
  const actual =
    actualForPeriod(
      actuals,
      period,
    );


  const forecast =
    forecastForPeriod(
      forecasts,
      period,
    );


  const actualValue = () => {
    if (
      !actual
    ) {
      return null;
    }


    switch (
      metric
    ) {
      case "REVENUE":
        return actual.revenue;


      case "EBITDA_MARGIN":
        if (
          actual.revenue ===
            null ||
          actual.ebitda ===
            null ||
          actual.revenue ===
            0
        ) {
          return null;
        }


        return (
          actual.ebitda /
          actual.revenue
        );


      case "CASH_BALANCE":
        return actual.cashBalance;


      case "MRR":
        return actual.mrr;


      case "CUSTOMERS":
        return actual.customers;


      case "RUNWAY_MONTHS":
      case "FORECAST_ACCURACY":
        return null;
    }
  };


  const observedActual =
    actualValue();


  if (
    observedActual !==
    null
  ) {
    return {
      value:
        observedActual,

      source:
        "ACTUAL",
    };
  }


  if (
    !forecast
  ) {
    return {
      value:
        null,

      source:
        "UNAVAILABLE",
    };
  }


  switch (
    metric
  ) {
    case "REVENUE":
      return {
        value:
          forecast.revenue,

        source:
          forecast.revenue ===
            null
            ?
              "UNAVAILABLE"
            :
              "FORECAST",
      };


    case "EBITDA_MARGIN":
      if (
        forecast.revenue ===
          null ||
        forecast.ebitda ===
          null ||
        forecast.revenue ===
          0
      ) {
        return {
          value:
            null,

          source:
            "UNAVAILABLE",
        };
      }


      return {
        value:
          forecast.ebitda /
          forecast.revenue,

        source:
          "FORECAST",
      };


    case "CASH_BALANCE":
      return {
        value:
          forecast.cashBalance,

        source:
          forecast.cashBalance ===
            null
            ?
              "UNAVAILABLE"
            :
              "FORECAST",
      };


    case "MRR":
      return {
        value:
          forecast.mrr,

        source:
          forecast.mrr ===
            null
            ?
              "UNAVAILABLE"
            :
              "FORECAST",
      };


    case "CUSTOMERS":
      return {
        value:
          forecast.customers,

        source:
          forecast.customers ===
            null
            ?
              "UNAVAILABLE"
            :
              "FORECAST",
      };


    case "RUNWAY_MONTHS":
    case "FORECAST_ACCURACY":
      return {
        value:
          null,

        source:
          "UNAVAILABLE",
      };
  }
}


function statusForValue({
  metric,
  current,
  target,
}: {
  metric:
    KpiMetricCode;

  current:
    number |
    null;

  target:
    number;
}): {
  status:
    KpiTargetStatus;

  threshold:
    number;
} {
  const definition =
    kpiMetricDefinition(
      metric,
    );


  const tolerance =
    definition
      .atRiskTolerance(
        target,
      );


  const threshold =
    target -
    tolerance;


  if (
    current ===
    null
  ) {
    return {
      status:
        "UNAVAILABLE",

      threshold,
    };
  }


  if (
    current >=
    target
  ) {
    return {
      status:
        "ON_TRACK",

      threshold,
    };
  }


  if (
    current >=
    threshold
  ) {
    return {
      status:
        "AT_RISK",

      threshold,
    };
  }


  return {
    status:
      "OFF_TRACK",

    threshold,
  };
}


const STATUS_ORDER = {
  OFF_TRACK:
    0,

  AT_RISK:
    1,

  UNAVAILABLE:
    2,

  ON_TRACK:
    3,
} as const;


export function calculateManagementScorecard({
  targets,
  actuals,
  forecasts,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
}: {
  targets:
    KpiTargetView[];

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
}): ManagementScorecard {
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


  const analyticsValue = (
    metric:
      KpiMetricCode,
  ): KpiObservedValue => {
    switch (
      metric
    ) {
      case "RUNWAY_MONTHS":
        return {
          value:
            risk.runwayMonths ??
            (
              risk.forecastPeriods >
                0
                ?
                  risk.forecastPeriods
                :
                  null
            ),

          source:
            risk.forecastPeriods >
              0
              ?
                "LIVE_ANALYTICS"
              :
                "UNAVAILABLE",
        };


      case "FORECAST_ACCURACY":
        return {
          value:
            accuracy
              .overallAccuracyScore,

          source:
            accuracy
              .overallAccuracyScore ===
              null
              ?
                "UNAVAILABLE"
              :
                "LIVE_ANALYTICS",
        };


      case "REVENUE":
      case "EBITDA_MARGIN":
      case "CASH_BALANCE":
      case "MRR":
      case "CUSTOMERS":
        return {
          value:
            null,

          source:
            "UNAVAILABLE",
        };
    }
  };


  const rows:
    KpiScorecardRow[] =
      targets.map(
        (
          target,
        ) => {
          const observed =
            target.metricCode ===
              "RUNWAY_MONTHS" ||
            target.metricCode ===
              "FORECAST_ACCURACY"
              ?
                analyticsValue(
                  target.metricCode,
                )
              :
                periodValue({
                  metric:
                    target.metricCode,

                  period:
                    target.periodKey,

                  actuals,

                  forecasts,
                });


          const result =
            statusForValue({
              metric:
                target.metricCode,

              current:
                observed.value,

              target:
                target.targetValue,
            });


          return {
            target,

            currentValue:
              observed.value,

            source:
              observed.source,

            status:
              result.status,

            gap:
              observed.value ===
                null
                ?
                  null
                :
                  observed.value -
                  target.targetValue,

            atRiskThreshold:
              result.threshold,
          };
        },
      )
        .sort(
          (
            left,
            right,
          ) => {
            const status =
              STATUS_ORDER[
                left.status
              ] -
              STATUS_ORDER[
                right.status
              ];


            if (
              status !==
              0
            ) {
              return status;
            }


            const period =
              right.target
                .periodKey
                .localeCompare(
                  left.target
                    .periodKey,
                );


            if (
              period !==
              0
            ) {
              return period;
            }


            return left.target
              .metricCode
              .localeCompare(
                right.target
                  .metricCode,
              );
          },
        );


  const periods =
    new Set(
      rows.map(
        (
          row,
        ) =>
          row.target
            .periodKey,
      ),
    );


  return {
    rows,

    summary: {
      total:
        rows.length,

      onTrack:
        rows.filter(
          (
            row,
          ) =>
            row.status ===
            "ON_TRACK",
        ).length,

      atRisk:
        rows.filter(
          (
            row,
          ) =>
            row.status ===
            "AT_RISK",
        ).length,

      offTrack:
        rows.filter(
          (
            row,
          ) =>
            row.status ===
            "OFF_TRACK",
        ).length,

      unavailable:
        rows.filter(
          (
            row,
          ) =>
            row.status ===
            "UNAVAILABLE",
        ).length,

      trackedPeriods:
        periods.size,
    },
  };
}
