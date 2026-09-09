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
  VARIANCE_METRICS,
  varianceMetricDefinition,
} from "@/lib/finance/variance-review/metrics";

import type {
  VarianceCommentaryView,
  VarianceFavorability,
  VarianceMateriality,
  VarianceMetricCode,
  VarianceReview,
  VarianceReviewRow,
} from "@/lib/finance/variance-review/types";


type MetricRow = {
  revenue:
    number |
    null;

  cogs:
    number |
    null;

  operatingExpenses:
    number |
    null;

  ebitda:
    number |
    null;

  netIncome:
    number |
    null;

  cashFlow:
    number |
    null;

  cashBalance:
    number |
    null;

  mrr:
    number |
    null;

  customers:
    number |
    null;
};


function metricValue(
  metric:
    VarianceMetricCode,
  row:
    MetricRow,
): number |
  null {
  switch (
    metric
  ) {
    case "REVENUE":
      return row.revenue;


    case "COGS":
      return row.cogs;


    case "OPERATING_EXPENSES":
      return row.operatingExpenses;


    case "EBITDA":
      return row.ebitda;


    case "NET_INCOME":
      return row.netIncome;


    case "CASH_FLOW":
      return row.cashFlow;


    case "CASH_BALANCE":
      return row.cashBalance;


    case "MRR":
      return row.mrr;


    case "CUSTOMERS":
      return row.customers;
  }
}


function forecastPeriod(
  row:
    ForecastAnalyticsRow,
): string |
  null {
  return parseMonthKey(
    row.period,
  );
}


function varianceRate(
  actual:
    number,
  forecast:
    number,
): number |
  null {
  if (
    forecast ===
    0
  ) {
    return null;
  }


  return (
    actual -
    forecast
  ) /
    Math.abs(
      forecast,
    );
}


function favorability({
  metric,
  variance,
}: {
  metric:
    VarianceMetricCode;

  variance:
    number |
    null;
}): VarianceFavorability {
  if (
    variance ===
    null
  ) {
    return "UNAVAILABLE";
  }


  if (
    Math.abs(
      variance,
    ) <
    1e-9
  ) {
    return "NEUTRAL";
  }


  const direction =
    varianceMetricDefinition(
      metric,
    ).favorableDirection;


  if (
    direction ===
    "HIGHER"
  ) {
    return variance >
      0
      ?
        "FAVORABLE"
      :
        "UNFAVORABLE";
  }


  return variance <
    0
    ?
      "FAVORABLE"
    :
      "UNFAVORABLE";
}


function materiality({
  variance,
  rate,
}: {
  variance:
    number |
    null;

  rate:
    number |
    null;
}): VarianceMateriality {
  if (
    variance ===
    null
  ) {
    return "UNAVAILABLE";
  }


  if (
    Math.abs(
      variance,
    ) <
    1e-9
  ) {
    return "IMMATERIAL";
  }


  if (
    rate ===
    null
  ) {
    return "REVIEW";
  }


  const absoluteRate =
    Math.abs(
      rate,
    );


  if (
    absoluteRate >=
    0.10
  ) {
    return "MATERIAL";
  }


  if (
    absoluteRate >=
    0.05
  ) {
    return "REVIEW";
  }


  return "IMMATERIAL";
}


export function varianceReviewKey(
  periodKey:
    string,
  metricCode:
    VarianceMetricCode,
): string {
  return `${periodKey}:${metricCode}`;
}


export function calculateVarianceReview({
  actuals,
  forecasts,
  commentaries,
}: {
  actuals:
    ActualFinancialPeriod[];

  forecasts:
    ForecastAnalyticsRow[];

  commentaries:
    VarianceCommentaryView[];
}): VarianceReview {
  const forecastByPeriod =
    new Map(
      forecasts.flatMap(
        (
          forecast,
        ) => {
          const period =
            forecastPeriod(
              forecast,
            );


          return period
            ?
              [
                [
                  period,
                  forecast,
                ] as const,
              ]
            :
              [];
        },
      ),
    );


  const commentaryByKey =
    new Map(
      commentaries.map(
        (
          commentary,
        ) => [
          varianceReviewKey(
            commentary.periodKey,
            commentary.metricCode,
          ),
          commentary,
        ],
      ),
    );


  const rows:
    VarianceReviewRow[] =
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


          return VARIANCE_METRICS.map(
            (
              metric,
            ) => {
              const actualValue =
                metricValue(
                  metric.code,
                  actual,
                );


              const forecastValue =
                metricValue(
                  metric.code,
                  forecast,
                );


              const delta =
                actualValue ===
                  null ||
                forecastValue ===
                  null
                  ?
                    null
                  :
                    actualValue -
                    forecastValue;


              const rate =
                actualValue ===
                  null ||
                forecastValue ===
                  null
                  ?
                    null
                  :
                    varianceRate(
                      actualValue,
                      forecastValue,
                    );


              const key =
                varianceReviewKey(
                  actual.period,
                  metric.code,
                );


              return {
                key,

                periodKey:
                  actual.period,

                metricCode:
                  metric.code,

                actual:
                  actualValue,

                forecast:
                  forecastValue,

                variance:
                  delta,

                varianceRate:
                  rate,

                favorability:
                  favorability({
                    metric:
                      metric.code,

                    variance:
                      delta,
                  }),

                materiality:
                  materiality({
                    variance:
                      delta,

                    rate,
                  }),

                commentary:
                  commentaryByKey.get(
                    key,
                  ) ??
                  null,
              };
            },
          );
        },
      )
        .sort(
          (
            left,
            right,
          ) => {
            const period =
              right.periodKey.localeCompare(
                left.periodKey,
              );


            if (
              period !==
              0
            ) {
              return period;
            }


            const materialityOrder = {
              MATERIAL:
                0,

              REVIEW:
                1,

              IMMATERIAL:
                2,

              UNAVAILABLE:
                3,
            } as const;


            const materialityDifference =
              materialityOrder[
                left.materiality
              ] -
              materialityOrder[
                right.materiality
              ];


            if (
              materialityDifference !==
              0
            ) {
              return materialityDifference;
            }


            return left.metricCode.localeCompare(
              right.metricCode,
            );
          },
        );


  const commentaryStatuses =
    commentaries.map(
      (
        commentary,
      ) =>
        commentary.status,
    );


  return {
    rows,

    summary: {
      totalRows:
        rows.length,

      material:
        rows.filter(
          (
            row,
          ) =>
            row.materiality ===
            "MATERIAL",
        ).length,

      materialUnexplained:
        rows.filter(
          (
            row,
          ) =>
            row.materiality ===
              "MATERIAL" &&
            row.commentary ===
              null,
        ).length,

      unfavorable:
        rows.filter(
          (
            row,
          ) =>
            row.favorability ===
            "UNFAVORABLE",
        ).length,

      openCommentaries:
        commentaryStatuses.filter(
          (
            status,
          ) =>
            status ===
            "OPEN",
        ).length,

      monitoringCommentaries:
        commentaryStatuses.filter(
          (
            status,
          ) =>
            status ===
            "MONITORING",
        ).length,

      resolvedCommentaries:
        commentaryStatuses.filter(
          (
            status,
          ) =>
            status ===
            "RESOLVED",
        ).length,

      acceptedCommentaries:
        commentaryStatuses.filter(
          (
            status,
          ) =>
            status ===
            "ACCEPTED",
        ).length,

      reviewedPeriods:
        new Set(
          commentaries.map(
            (
              commentary,
            ) =>
              commentary.periodKey,
          ),
        ).size,
    },
  };
}
