import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import {
  normalizeForecastPeriodKey,
} from "@/lib/finance/actuals/variance";

import type {
  PlanningComparisonMetric,
  PlanningCycleReport,
  PlanningMetric,
  RollingReforecastRow,
} from "@/lib/finance/planning-cycle/types";


const METRICS:
  PlanningMetric[] = [
    "revenue",
    "cogs",
    "operatingExpenses",
    "ebitda",
    "cashFlow",
    "cashBalance",
    "mrr",
  ];function forecastMetric(
  forecast:
    ForecastAnalyticsRow,
  metric:
    PlanningMetric,
): number |
  null {
  switch (
    metric
  ) {
    case "revenue":
      return forecast.revenue;

    case "cogs":
      return forecast.cogs;

    case "operatingExpenses":
      return forecast.operatingExpenses;

    case "ebitda":
      return forecast.ebitda;

    case "cashFlow":
      return forecast.cashFlow;

    case "cashBalance":
      return forecast.cashBalance;

    case "mrr":
      return forecast.mrr;
  }
}


function rollingValue(
  row:
    RollingReforecastRow,
  metric:
    PlanningMetric,
): number |
  null {
  return row[
    metric
  ];
}


function sumMetric<
  TRow,
>(
  rows:
    TRow[],
  getter:
    (
      row:
        TRow,
    ) =>
      number |
      null,
): number |
  null {
  const values =
    rows.flatMap(
      (
        row,
      ) => {
        const value =
          getter(
            row,
          );


        return value ===
          null
          ?
            []
          :
            [
              value,
            ];
      },
    );


  if (
    values.length ===
    0
  ) {
    return null;
  }


  return values.reduce(
    (
      total,
      value,
    ) =>
      total +
      value,
    0,
  );
}


function lastMetric<
  TRow,
>(
  rows:
    TRow[],
  getter:
    (
      row:
        TRow,
    ) =>
      number |
      null,
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
      getter(
        rows[
          index
        ],
      );


    if (
      value !==
      null
    ) {
      return value;
    }
  }


  return null;
}


function aggregate(
  rows:
    ForecastAnalyticsRow[],
  metric:
    PlanningMetric,
): number |
  null {
  if (
    metric ===
      "cashBalance"
  ) {
    return lastMetric(
      rows,
      (
        row,
      ) =>
        forecastMetric(
          row,
          metric,
        ),
    );
  }


  return sumMetric(
    rows,
    (
      row,
    ) =>
      forecastMetric(
        row,
        metric,
      ),
  );
}


function aggregateRolling(
  rows:
    RollingReforecastRow[],
  metric:
    PlanningMetric,
): number |
  null {
  if (
    metric ===
      "cashBalance"
  ) {
    return lastMetric(
      rows,
      (
        row,
      ) =>
        rollingValue(
          row,
          metric,
        ),
    );
  }


  return sumMetric(
    rows,
    (
      row,
    ) =>
      rollingValue(
        row,
        metric,
      ),
  );
}


function comparison(
  baseline:
    number |
    null,
  current:
    number |
    null,
  rolling:
    number |
    null,
): PlanningComparisonMetric {
  const currentVsBaseline =
    baseline !==
      null &&
    current !==
      null
      ?
        current -
        baseline
      :
        null;


  const rollingVsBaseline =
    baseline !==
      null &&
    rolling !==
      null
      ?
        rolling -
        baseline
      :
        null;


  const validBaseline =
    baseline !==
      null &&
    baseline !==
      0;


  return {
    baseline,

    currentForecast:
      current,

    rollingReforecast:
      rolling,

    currentVsBaseline,

    rollingVsBaseline,

    currentVsBaselineRate:
      currentVsBaseline !==
        null &&
      validBaseline
        ?
          currentVsBaseline /
          Math.abs(
            baseline,
          )
        :
          null,

    rollingVsBaselineRate:
      rollingVsBaseline !==
        null &&
      validBaseline
        ?
          rollingVsBaseline /
          Math.abs(
            baseline,
          )
        :
          null,
  };
}


export function buildRollingReforecast(
  actuals:
    ActualFinancialPeriod[],
  currentForecast:
    ForecastAnalyticsRow[],
): RollingReforecastRow[] {
  const actualByPeriod =
    new Map<
      string,
      ActualFinancialPeriod
    >(
      actuals.map(
        (
          actual,
        ) => [
          actual.period,
          actual,
        ],
      ),
    );


  return currentForecast.flatMap<
    RollingReforecastRow
  >(
    (
      forecast,
    ): RollingReforecastRow[] => {
      const period =
        normalizeForecastPeriodKey(
          forecast.period,
        );


      if (
        !period
      ) {
        return [];
      }


      const actual =
        actualByPeriod.get(
          period,
        );


      if (
        actual
      ) {
        return [
          {
            period,

            source:
              "ACTUAL",

            revenue:
              actual.revenue,

            cogs:
              actual.cogs,

            operatingExpenses:
              actual.operatingExpenses,

            ebitda:
              actual.ebitda,

            cashFlow:
              actual.cashFlow,

            cashBalance:
              actual.cashBalance,

            mrr:
              actual.mrr,
          },
        ];
      }


      return [
        {
          period,

          source:
            "FORECAST",

          revenue:
            forecast.revenue,

          cogs:
            forecast.cogs,

          operatingExpenses:
            forecast.operatingExpenses,

          ebitda:
            forecast.ebitda,

          cashFlow:
            forecast.cashFlow,

          cashBalance:
            forecast.cashBalance,

          mrr:
            forecast.mrr,
        },
      ];
    },
  );
}


export function calculatePlanningCycleReport(
  baseline:
    ForecastAnalyticsRow[],
  currentForecast:
    ForecastAnalyticsRow[],
  actuals:
    ActualFinancialPeriod[],
): PlanningCycleReport {
  const rollingRows =
    buildRollingReforecast(
      actuals,
      currentForecast,
    );


  const metrics =
    Object.fromEntries(
      METRICS.map(
        (
          metric,
        ) => [
          metric,

          comparison(
            aggregate(
              baseline,
              metric,
            ),

            aggregate(
              currentForecast,
              metric,
            ),

            aggregateRolling(
              rollingRows,
              metric,
            ),
          ),
        ],
      ),
    ) as
      Record<
        PlanningMetric,
        PlanningComparisonMetric
      >;


  return {
    actualPeriodsUsed:
      rollingRows.filter(
        (
          row,
        ) =>
          row.source ===
          "ACTUAL",
      ).length,

    forecastPeriodsUsed:
      rollingRows.filter(
        (
          row,
        ) =>
          row.source ===
          "FORECAST",
      ).length,

    metrics,

    rollingRows,

    baselineRows:
      baseline,

    currentForecastRows:
      currentForecast,
  };
}
