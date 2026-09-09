"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  normalizeForecastCsv,
} from "@/lib/finance/analytics/csv";

import {
  calculateForecastAccuracyReport,
} from "@/lib/finance/forecast-accuracy/calculations";

import type {
  ForecastAccuracyMetricReport,
} from "@/lib/finance/forecast-accuracy/types";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";


type Props = {
  projectId:
    string;

  currency:
    string;

  actuals:
    ActualFinancialPeriod[];
};


const LABELS = {
  revenue:
    "Revenue",

  cogs:
    "COGS",

  operatingExpenses:
    "Operating expenses",

  ebitda:
    "EBITDA",

  cashFlow:
    "Cash flow",

  cashBalance:
    "Cash balance",

  mrr:
    "MRR",
} as const;


function percent(
  value:
    number |
    null,
): string {
  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    )
  ) {
    return "—";
  }


  return new Intl.NumberFormat(
    "en",
    {
      style:
        "percent",

      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  );
}


function money(
  value:
    number |
    null,
  currency:
    string,
): string {
  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    )
  ) {
    return "—";
  }


  return new Intl.NumberFormat(
    "en",
    {
      style:
        "currency",

      currency,

      notation:
        Math.abs(
          value,
        ) >=
        1_000_000
          ?
            "compact"
          :
            "standard",

      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  );
}


function accuracyTone(
  value:
    number |
    null,
): string {
  if (
    value ===
      null
  ) {
    return "text-muted-foreground";
  }


  if (
    value >=
    0.9
  ) {
    return "text-emerald-700 dark:text-emerald-400";
  }


  if (
    value >=
    0.8
  ) {
    return "text-amber-700 dark:text-amber-400";
  }


  return "text-destructive";
}


function trendLabel(
  report:
    ForecastAccuracyMetricReport,
): string {
  switch (
    report.trend
  ) {
    case "IMPROVING":
      return "Improving";

    case "WORSENING":
      return "Worsening";

    case "STABLE":
      return "Stable";

    case "INSUFFICIENT_DATA":
      return "Not enough history";
  }
}


function biasLabel(
  report:
    ForecastAccuracyMetricReport,
): string {
  switch (
    report.bias
  ) {
    case "BALANCED":
      return "Balanced";

    case "OVER_FORECASTING":
      return "Over-forecasting";

    case "UNDER_FORECASTING":
      return "Under-forecasting";

    case "INSUFFICIENT_DATA":
      return "Not enough history";
  }
}


export function ForecastAccuracyWorkspace({
  projectId,
  currency,
  actuals,
}: Props) {
  const [
    forecastCsv,
    setForecastCsv,
  ] =
    useState(
      "",
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null,
    );


  useEffect(
    () => {
      const controller =
        new AbortController();


      async function loadForecast() {
        try {
          const response =
            await fetch(
              `/api/projects/${encodeURIComponent(
                projectId,
              )}/export/csv`,
              {
                cache:
                  "no-store",

                signal:
                  controller.signal,
              },
            );


          if (
            !response.ok
          ) {
            throw new Error(
              `Forecast export returned HTTP ${response.status}.`,
            );
          }


          setForecastCsv(
            await response.text(),
          );
        }
        catch (
          cause
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }


          setError(
            cause instanceof Error
              ?
                cause.message
              :
                "Unable to load forecast history.",
          );
        }
        finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(
              false,
            );
          }
        }
      }


      void loadForecast();


      return () => {
        controller.abort();
      };
    },
    [
      projectId,
    ],
  );


  const forecasts =
    useMemo(
      () =>
        normalizeForecastCsv(
          forecastCsv,
        ),
      [
        forecastCsv,
      ],
    );


  const report =
    useMemo(
      () =>
        calculateForecastAccuracyReport(
          actuals,
          forecasts,
        ),
      [
        actuals,
        forecasts,
      ],
    );


  if (
    loading
  ) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {
            Array.from({
              length:
                4,
            }).map(
              (
                _,
                index,
              ) => (
                <div
                  key={
                    index
                  }
                  className="h-28 animate-pulse rounded-xl bg-muted"
                />
              ),
            )
          }
        </div>

        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }


  if (
    error
  ) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-5"
      >
        <h2 className="font-semibold text-destructive">
          Forecast accuracy unavailable
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {
            error
          }
        </p>
      </section>
    );
  }


  if (
    actuals.length ===
    0
  ) {
    return (
      <section className="rounded-xl border border-dashed p-8">
        <h2 className="font-semibold">
          No actual history yet
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Import monthly actual performance from the Actuals workspace. VentureScope will then measure historical forecast accuracy, bias, and trend automatically.
        </p>
      </section>
    );
  }


  const revenue =
    report.metrics.find(
      (
        metric,
      ) =>
        metric.metric ===
        "revenue",
    );


  const ebitda =
    report.metrics.find(
      (
        metric,
      ) =>
        metric.metric ===
        "ebitda",
    );


  const cash =
    report.metrics.find(
      (
        metric,
      ) =>
        metric.metric ===
        "cashBalance",
    );


  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Overall accuracy
          </p>

          <p
            className={`mt-2 text-2xl font-semibold ${accuracyTone(
              report.overallAccuracyScore,
            )}`}
          >
            {
              percent(
                report.overallAccuracyScore,
              )
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Average accuracy across usable financial metrics.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Overall WAPE
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              percent(
                report.overallWape,
              )
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Weighted absolute forecast error.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Matched periods
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              report.matchedPeriods
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Months with both forecast and actual observations.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Latest actual month
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              report.latestPeriod ??
              "—"
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Latest observed execution period.
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {
          [
            [
              "Revenue",
              revenue,
            ] as const,

            [
              "EBITDA",
              ebitda,
            ] as const,

            [
              "Cash balance",
              cash,
            ] as const,
          ].map(
            (
              [
                label,
                metric,
              ],
            ) => (
              <article
                key={
                  String(
                    label,
                  )
                }
                className="rounded-xl border bg-background p-5"
              >
                <h2 className="font-semibold">
                  {
                    label
                  }
                </h2>

                {
                  metric
                    ?
                      (
                        <dl className="mt-4 space-y-3 text-sm">
                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Accuracy
                            </dt>

                            <dd className={accuracyTone(
                              metric.overall
                                .accuracyScore,
                            )}>
                              {
                                percent(
                                  metric.overall
                                    .accuracyScore,
                                )
                              }
                            </dd>
                          </div>

                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">
                              WAPE
                            </dt>

                            <dd>
                              {
                                percent(
                                  metric.overall
                                    .wape,
                                )
                              }
                            </dd>
                          </div>

                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Bias
                            </dt>

                            <dd>
                              {
                                biasLabel(
                                  metric,
                                )
                              }
                            </dd>
                          </div>

                          <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">
                              Trend
                            </dt>

                            <dd>
                              {
                                trendLabel(
                                  metric,
                                )
                              }
                            </dd>
                          </div>
                        </dl>
                      )
                    :
                      null
                }
              </article>
            ),
          )
        }
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Forecast reliability by metric
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            WAPE measures total absolute error relative to actual volume. Bias indicates persistent over- or under-forecasting.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left">
                  Metric
                </th>

                <th className="px-4 py-3 text-right">
                  Months
                </th>

                <th className="px-4 py-3 text-right">
                  Accuracy
                </th>

                <th className="px-4 py-3 text-right">
                  WAPE
                </th>

                <th className="px-4 py-3 text-right">
                  MAPE
                </th>

                <th className="px-4 py-3 text-right">
                  RMSE
                </th>

                <th className="px-4 py-3 text-right">
                  Bias
                </th>

                <th className="px-4 py-3 text-right">
                  3M WAPE
                </th>

                <th className="px-4 py-3 text-right">
                  6M WAPE
                </th>

                <th className="px-4 py-3 text-right">
                  12M WAPE
                </th>

                <th className="px-4 py-3 text-left">
                  Trend
                </th>
              </tr>
            </thead>

            <tbody>
              {
                report.metrics.map(
                  (
                    metric,
                  ) => (
                    <tr
                      key={
                        metric.metric
                      }
                      className="border-b last:border-0"
                    >
                      <th className="px-4 py-3 text-left font-medium">
                        {
                          LABELS[
                            metric.metric
                          ]
                        }
                      </th>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {
                          metric.overall
                            .observations
                        }
                      </td>

                      <td
                        className={`px-4 py-3 text-right tabular-nums ${accuracyTone(
                          metric.overall
                            .accuracyScore,
                        )}`}
                      >
                        {
                          percent(
                            metric.overall
                              .accuracyScore,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {
                          percent(
                            metric.overall
                              .wape,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {
                          percent(
                            metric.overall
                              .mape,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {
                          money(
                            metric.overall
                              .rmse,
                            currency,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          biasLabel(
                            metric,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {
                          percent(
                            metric.rolling3
                              .wape,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {
                          percent(
                            metric.rolling6
                              .wape,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums">
                        {
                          percent(
                            metric.rolling12
                              .wape,
                          )
                        }
                      </td>

                      <td className="px-4 py-3">
                        {
                          trendLabel(
                            metric,
                          )
                        }
                      </td>
                    </tr>
                  ),
                )
              }
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Management attention
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            VentureScope automatically flags persistent forecast error, systematic bias, and worsening recent accuracy.
          </p>
        </div>

        {
          report.flags.length ===
          0
            ?
              (
                <div className="mt-5 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No material forecast-accuracy exceptions were detected with the available history.
                </div>
              )
            :
              (
                <div className="mt-5 space-y-3">
                  {
                    report.flags.map(
                      (
                        flag,
                        index,
                      ) => (
                        <article
                          key={`${flag.code}-${flag.metric}-${index}`}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded border px-2 py-1 text-xs font-semibold">
                              {
                                flag.severity
                              }
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {
                                LABELS[
                                  flag.metric
                                ]
                              }
                            </span>
                          </div>

                          <p className="mt-2 text-sm">
                            {
                              flag.message
                            }
                          </p>
                        </article>
                      ),
                    )
                  }
                </div>
              )
        }
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Forecast accuracy is diagnostic planning information. It measures historical model performance and does not automatically change assumptions or overwrite immutable model versions.
      </p>
    </div>
  );
}
