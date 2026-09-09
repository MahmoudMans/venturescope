import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import {
  ACTUAL_METRICS,
  type ActualFinancialPeriod,
  type ActualMetric,
  type ForecastVarianceReport,
  type MetricVariance,
} from "@/lib/finance/actuals/types";

import {
  parseMonthKey,
} from "@/lib/finance/actuals/month";


const LOWER_IS_BETTER =
  new Set<
    ActualMetric
  >([
    "cogs",
    "operatingExpenses",
  ]);


function forecastMetric(
  row:
    ForecastAnalyticsRow,
  metric:
    ActualMetric,
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

    case "netIncome":
      return row.netIncome;

    case "cashFlow":
      return row.cashFlow;

    case "cashBalance":
      return row.cashBalance;

    case "mrr":
      return row.mrr;

    case "customers":
      return row.customers;
  }
}


export function normalizeForecastPeriodKey(
  raw:
    string,
): string |
  null {
  return parseMonthKey(
    raw,
  );
}


export function metricVariance(
  metric:
    ActualMetric,
  actual:
    number,
  forecast:
    number,
): MetricVariance {
  const variance =
    actual -
    forecast;


  const varianceRate =
    forecast ===
      0
      ?
        null
      :
        variance /
        Math.abs(
          forecast,
        );


  const favorable =
    variance ===
      0
      ?
        null
      :
        LOWER_IS_BETTER.has(
          metric,
        )
          ?
            variance <
            0
          :
            variance >
            0;


  return {
    actual,
    forecast,
    variance,
    varianceRate,
    favorable,
  };
}


export function calculateVarianceReport(
  actuals:
    ActualFinancialPeriod[],
  forecasts:
    ForecastAnalyticsRow[],
): ForecastVarianceReport {
  const forecastByPeriod =
    new Map<
      string,
      ForecastAnalyticsRow
    >();


  for (
    const forecast
    of forecasts
  ) {
    const key =
      normalizeForecastPeriodKey(
        forecast.period,
      );


    if (
      key
    ) {
      forecastByPeriod.set(
        key,
        forecast,
      );
    }
  }


  const periods =
    actuals.flatMap(
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


        const metrics:
          Partial<
            Record<
              ActualMetric,
              MetricVariance
            >
          > =
            {};


        for (
          const metric
          of ACTUAL_METRICS
        ) {
          const actualValue =
            actual[
              metric
            ];


          const forecastValue =
            forecastMetric(
              forecast,
              metric,
            );


          if (
            actualValue ===
              null ||
            forecastValue ===
              null
          ) {
            continue;
          }


          metrics[
            metric
          ] =
            metricVariance(
              metric,
              actualValue,
              forecastValue,
            );
        }


        return [
          {
            period:
              actual.period,

            metrics,
          },
        ];
      },
    );


  const sumMetric =
    (
      metric:
        ActualMetric,
      side:
        "actual" |
        "forecast",
    ): number =>
      periods.reduce(
        (
          total,
          period,
        ) =>
          total +
          (
            period.metrics[
              metric
            ]?.[
              side
            ] ??
            0
          ),
        0,
      );


  const revenueActual =
    sumMetric(
      "revenue",
      "actual",
    );


  const revenueForecast =
    sumMetric(
      "revenue",
      "forecast",
    );


  const ebitdaActual =
    sumMetric(
      "ebitda",
      "actual",
    );


  const ebitdaForecast =
    sumMetric(
      "ebitda",
      "forecast",
    );


  const latestCash =
    [
      ...periods,
    ]
      .reverse()
      .find(
        (
          period,
        ) =>
          period.metrics
            .cashBalance !==
          undefined,
      )
      ?.metrics
      .cashBalance;


  const revenueVariance =
    revenueActual -
    revenueForecast;


  const ebitdaVariance =
    ebitdaActual -
    ebitdaForecast;


  return {
    periods,

    summary: {
      matchedPeriods:
        periods.length,

      actualPeriods:
        actuals.length,

      revenueActual,

      revenueForecast,

      revenueVariance,

      revenueVarianceRate:
        revenueForecast ===
          0
          ?
            null
          :
            revenueVariance /
            Math.abs(
              revenueForecast,
            ),

      ebitdaActual,

      ebitdaForecast,

      ebitdaVariance,

      ebitdaVarianceRate:
        ebitdaForecast ===
          0
          ?
            null
          :
            ebitdaVariance /
            Math.abs(
              ebitdaForecast,
            ),

      latestCashActual:
        latestCash?.actual ??
        null,

      latestCashForecast:
        latestCash?.forecast ??
        null,

      latestCashVariance:
        latestCash?.variance ??
        null,
    },
  };
}
