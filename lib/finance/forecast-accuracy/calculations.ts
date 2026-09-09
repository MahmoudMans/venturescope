import {
  ACCURACY_METRICS,
  type AccuracyMetric,
  type ForecastAccuracyFlag,
  type ForecastAccuracyMetricReport,
  type ForecastAccuracyReport,
  type ForecastAccuracyStatistics,
  type ForecastBiasClassification,
  type ForecastObservation,
  type ForecastTrendClassification,
} from "@/lib/finance/forecast-accuracy/types";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import {
  normalizeForecastPeriodKey,
} from "@/lib/finance/actuals/variance";


function forecastValue(
  row:
    ForecastAnalyticsRow,
  metric:
    AccuracyMetric,
): number |
  null {
  switch (
    metric
  ) {
    case "revenue":
      return row.revenue;

    case "cogs":
      return row.cogs;

    case "operatingExpenses":
      return row.operatingExpenses;

    case "ebitda":
      return row.ebitda;

    case "cashFlow":
      return row.cashFlow;

    case "cashBalance":
      return row.cashBalance;

    case "mrr":
      return row.mrr;
  }
}


function actualValue(
  row:
    ActualFinancialPeriod,
  metric:
    AccuracyMetric,
): number |
  null {
  switch (
    metric
  ) {
    case "revenue":
      return row.revenue;

    case "cogs":
      return row.cogs;

    case "operatingExpenses":
      return row.operatingExpenses;

    case "ebitda":
      return row.ebitda;

    case "cashFlow":
      return row.cashFlow;

    case "cashBalance":
      return row.cashBalance;

    case "mrr":
      return row.mrr;
  }
}


/*
 * Signed error convention:
 *
 * forecast - actual
 *
 * Positive = model over-forecasted.
 * Negative = model under-forecasted.
 */
export function forecastObservation(
  period:
    string,
  actual:
    number,
  forecast:
    number,
): ForecastObservation {
  const error =
    forecast -
    actual;


  return {
    period,

    actual,

    forecast,

    error,

    absoluteError:
      Math.abs(
        error,
      ),

    absolutePercentageError:
      actual ===
        0
        ?
          null
        :
          Math.abs(
            error /
            actual,
          ),
  };
}


export function calculateAccuracyStatistics(
  observations:
    ForecastObservation[],
): ForecastAccuracyStatistics {
  if (
    observations.length ===
    0
  ) {
    return {
      observations:
        0,

      actualTotal:
        0,

      forecastTotal:
        0,

      signedError:
        0,

      absoluteError:
        0,

      wape:
        null,

      mape:
        null,

      rmse:
        null,

      biasRate:
        null,

      accuracyScore:
        null,
    };
  }


  const actualTotal =
    observations.reduce(
      (
        total,
        observation,
      ) =>
        total +
        observation.actual,
      0,
    );


  const absoluteActualTotal =
    observations.reduce(
      (
        total,
        observation,
      ) =>
        total +
        Math.abs(
          observation.actual,
        ),
      0,
    );


  const forecastTotal =
    observations.reduce(
      (
        total,
        observation,
      ) =>
        total +
        observation.forecast,
      0,
    );


  const signedError =
    observations.reduce(
      (
        total,
        observation,
      ) =>
        total +
        observation.error,
      0,
    );


  const absoluteError =
    observations.reduce(
      (
        total,
        observation,
      ) =>
        total +
        observation.absoluteError,
      0,
    );


  const percentageErrors =
    observations.flatMap(
      (
        observation,
      ) =>
        observation.absolutePercentageError ===
          null
          ?
            []
          :
            [
              observation.absolutePercentageError,
            ],
    );


  const wape =
    absoluteActualTotal ===
      0
      ?
        null
      :
        absoluteError /
        absoluteActualTotal;


  const mape =
    percentageErrors.length ===
      0
      ?
        null
      :
        percentageErrors.reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ) /
        percentageErrors.length;


  const rmse =
    Math.sqrt(
      observations.reduce(
        (
          total,
          observation,
        ) =>
          total +
          observation.error **
            2,
        0,
      ) /
      observations.length,
    );


  const biasRate =
    absoluteActualTotal ===
      0
      ?
        null
      :
        signedError /
        absoluteActualTotal;


  return {
    observations:
      observations.length,

    actualTotal,

    forecastTotal,

    signedError,

    absoluteError,

    wape,

    mape,

    rmse,

    biasRate,

    accuracyScore:
      wape ===
        null
        ?
          null
        :
          Math.max(
            0,
            1 -
            wape,
          ),
  };
}


function rollingStatistics(
  observations:
    ForecastObservation[],
  periods:
    number,
): ForecastAccuracyStatistics {
  return calculateAccuracyStatistics(
    observations.slice(
      -periods,
    ),
  );
}


export function classifyBias(
  statistics:
    ForecastAccuracyStatistics,
): ForecastBiasClassification {
  if (
    statistics.observations <
      2 ||
    statistics.biasRate ===
      null
  ) {
    return "INSUFFICIENT_DATA";
  }


  if (
    Math.abs(
      statistics.biasRate,
    ) <
    0.05
  ) {
    return "BALANCED";
  }


  return statistics.biasRate >
    0
    ?
      "OVER_FORECASTING"
    :
      "UNDER_FORECASTING";
}


export function classifyTrend(
  observations:
    ForecastObservation[],
): ForecastTrendClassification {
  if (
    observations.length <
    6
  ) {
    return "INSUFFICIENT_DATA";
  }


  const recent =
    calculateAccuracyStatistics(
      observations.slice(
        -3,
      ),
    );


  const previous =
    calculateAccuracyStatistics(
      observations.slice(
        -6,
        -3,
      ),
    );


  if (
    recent.wape ===
      null ||
    previous.wape ===
      null
  ) {
    return "INSUFFICIENT_DATA";
  }


  const difference =
    recent.wape -
    previous.wape;


  if (
    difference <=
    -0.02
  ) {
    return "IMPROVING";
  }


  if (
    difference >=
    0.02
  ) {
    return "WORSENING";
  }


  return "STABLE";
}


function observationsForMetric(
  actuals:
    ActualFinancialPeriod[],
  forecasts:
    ForecastAnalyticsRow[],
  metric:
    AccuracyMetric,
): ForecastObservation[] {
  const forecastByPeriod =
    new Map<
      string,
      ForecastAnalyticsRow
    >();


  for (
    const forecast
    of forecasts
  ) {
    const period =
      normalizeForecastPeriodKey(
        forecast.period,
      );


    if (
      period
    ) {
      forecastByPeriod.set(
        period,
        forecast,
      );
    }
  }


  return actuals.flatMap(
    (
      actual,
    ) => {
      const forecast =
        forecastByPeriod.get(
          actual.period,
        );


      if (
        !forecast
      ) {
        return [];
      }


      const actualMetric =
        actualValue(
          actual,
          metric,
        );


      const forecastMetric =
        forecastValue(
          forecast,
          metric,
        );


      if (
        actualMetric ===
          null ||
        forecastMetric ===
          null
      ) {
        return [];
      }


      return [
        forecastObservation(
          actual.period,
          actualMetric,
          forecastMetric,
        ),
      ];
    },
  );
}


function metricReport(
  actuals:
    ActualFinancialPeriod[],
  forecasts:
    ForecastAnalyticsRow[],
  metric:
    AccuracyMetric,
): ForecastAccuracyMetricReport {
  const observations =
    observationsForMetric(
      actuals,
      forecasts,
      metric,
    );


  const overall =
    calculateAccuracyStatistics(
      observations,
    );


  return {
    metric,

    observations,

    overall,

    rolling3:
      rollingStatistics(
        observations,
        3,
      ),

    rolling6:
      rollingStatistics(
        observations,
        6,
      ),

    rolling12:
      rollingStatistics(
        observations,
        12,
      ),

    bias:
      classifyBias(
        overall,
      ),

    trend:
      classifyTrend(
        observations,
      ),
  };
}


function managementFlags(
  reports:
    ForecastAccuracyMetricReport[],
): ForecastAccuracyFlag[] {
  const flags:
    ForecastAccuracyFlag[] =
      [];


  for (
    const report
    of reports
  ) {
    const {
      overall,
      rolling3,
      bias,
      trend,
      metric,
    } =
      report;


    if (
      overall.observations <
      3
    ) {
      continue;
    }


    if (
      overall.wape !==
        null &&
      overall.wape >=
        0.3
    ) {
      flags.push({
        severity:
          "CRITICAL",

        metric,

        code:
          "HIGH_FORECAST_ERROR",

        message:
          `${metric} forecast error is above 30% WAPE.`,
      });
    }
    else if (
      overall.wape !==
        null &&
      overall.wape >=
        0.2
    ) {
      flags.push({
        severity:
          "WARNING",

        metric,

        code:
          "ELEVATED_FORECAST_ERROR",

        message:
          `${metric} forecast error is above 20% WAPE.`,
      });
    }


    if (
      bias ===
        "OVER_FORECASTING"
    ) {
      flags.push({
        severity:
          "WARNING",

        metric,

        code:
          "PERSISTENT_OVER_FORECAST",

        message:
          `${metric} has persistent positive forecast bias.`,
      });
    }


    if (
      bias ===
        "UNDER_FORECASTING"
    ) {
      flags.push({
        severity:
          "INFO",

        metric,

        code:
          "PERSISTENT_UNDER_FORECAST",

        message:
          `${metric} has persistent negative forecast bias.`,
      });
    }


    if (
      trend ===
        "WORSENING" &&
      rolling3.wape !==
        null
    ) {
      flags.push({
        severity:
          rolling3.wape >=
            0.25
            ?
              "CRITICAL"
            :
              "WARNING",

        metric,

        code:
          "ACCURACY_WORSENING",

        message:
          `${metric} forecast accuracy deteriorated over the latest three matched periods.`,
      });
    }
  }


  const severityOrder = {
    CRITICAL:
      0,

    WARNING:
      1,

    INFO:
      2,
  };


  return flags.sort(
    (
      left,
      right,
    ) =>
      severityOrder[
        left.severity
      ] -
      severityOrder[
        right.severity
      ],
  );
}


export function calculateForecastAccuracyReport(
  actuals:
    ActualFinancialPeriod[],
  forecasts:
    ForecastAnalyticsRow[],
): ForecastAccuracyReport {
  const metrics =
    ACCURACY_METRICS.map(
      (
        metric,
      ) =>
        metricReport(
          actuals,
          forecasts,
          metric,
        ),
    );


  const usable =
    metrics.filter(
      (
        report,
      ) =>
        report.overall.wape !==
          null,
    );


  const overallWape =
    usable.length ===
      0
      ?
        null
      :
        usable.reduce(
          (
            total,
            report,
          ) =>
            total +
            (
              report.overall.wape ??
              0
            ),
          0,
        ) /
        usable.length;


  const latestPeriod =
    actuals.length ===
      0
      ?
        null
      :
        [
          ...actuals,
        ]
          .sort(
            (
              left,
              right,
            ) =>
              left.period.localeCompare(
                right.period,
              ),
          )
          .at(
            -1,
          )
          ?.period ??
        null;


  const matchedPeriods =
    Math.max(
      0,
      ...metrics.map(
        (
          report,
        ) =>
          report.overall.observations,
      ),
    );


  return {
    matchedPeriods,

    metrics,

    flags:
      managementFlags(
        metrics,
      ),

    overallWape,

    overallAccuracyScore:
      overallWape ===
        null
        ?
          null
        :
          Math.max(
            0,
            1 -
            overallWape,
          ),

    latestPeriod,
  };
}
