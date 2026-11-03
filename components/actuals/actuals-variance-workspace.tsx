"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PendingButton,
} from "@/components/forms/pending-button";

import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  normalizeForecastCsv,
} from "@/lib/finance/analytics";

import {
  calculateVarianceReport,
} from "@/lib/finance/actuals/variance";

import type {
  ActualFinancialPeriod,
  ActualMetric,
} from "@/lib/finance/actuals/types";

import {
  clearActualsAction,
  importActualsAction,
} from "@/app/(app)/projects/[projectId]/actuals/actions";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

  actuals:
    ActualFinancialPeriod[];
};


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


function percentage(
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


function varianceTone(
  favorable:
    boolean |
    null |
    undefined,
): string {
  if (
    favorable ===
      true
  ) {
    return "text-success";
  }


  if (
    favorable ===
      false
  ) {
    return "text-destructive";
  }


  return "text-muted-foreground";
}


const DISPLAY_METRICS:
  {
    key:
      ActualMetric;

    label:
      string;
  }[] = [
    {
      key:
        "revenue",

      label:
        "Revenue",
    },

    {
      key:
        "cogs",

      label:
        "COGS",
    },

    {
      key:
        "operatingExpenses",

      label:
        "Opex",
    },

    {
      key:
        "ebitda",

      label:
        "EBITDA",
    },

    {
      key:
        "cashBalance",

      label:
        "Cash",
    },
  ];


function SummaryCard({
  label,
  actual,
  forecast,
  variance,
  varianceRate,
  currency,
}: {
  label:
    string;

  actual:
    number |
    null;

  forecast:
    number |
    null;

  variance:
    number |
    null;

  varianceRate:
    number |
    null;

  currency:
    string;
}) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {
          label
        }
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {
          money(
            actual,
            currency,
          )
        }
      </p>

      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p>
          Forecast:{" "}
          {
            money(
              forecast,
              currency,
            )
          }
        </p>

        <p>
          Variance:{" "}
          {
            money(
              variance,
              currency,
            )
          }
          {
            varianceRate !==
              null
              ?
                ` (${percentage(
                  varianceRate,
                )})`
              :
                ""
          }
        </p>
      </div>
    </article>
  );
}


export function ActualsVarianceWorkspace({
  projectId,
  currency,
  editable,
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
                "Unable to load forecast.",
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


  const forecastRows =
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
        calculateVarianceReport(
          actuals,
          forecastRows,
        ),
      [
        actuals,
        forecastRows,
      ],
    );


  return (
    <div className="space-y-8">
      {
        editable
          ?
            (
              <section className="rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="text-lg font-semibold">
                  Import monthly actuals
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Upload a CSV with one row per month. Re-importing a month replaces that month&apos;s actual values without creating duplicates.
                </p>

                <p className="mt-3 overflow-x-auto rounded-lg bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                  Month,Revenue,COGS,Operating Expenses,EBITDA,Net Income,Cash Flow,Cash Balance,MRR,Customers
                </p>

                <form
                  action={
                    importActualsAction
                  }
                  encType="multipart/form-data"
                  className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={
                      projectId
                    }
                  />

                  <label className="flex-1 space-y-2">
                    <span className="text-sm font-medium">
                      Actuals CSV
                    </span>

                    <input
                      type="file"
                      name="actualsCsv"
                      accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                      aria-describedby="actuals-file-hint"
                      required
                      className="block w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <PendingButton
                    className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                  >
                    Import actuals
                  </PendingButton>
                </form>

                <p
                  id="actuals-file-hint"
                  className="mt-2 text-xs text-muted-foreground"
                >
                  A file saved by Excel is read too: with commas, semicolons or tabs, a decimal comma (1250,50), and months like Jan-27, janv.-27 or 01/01/2027. Column titles can be English or French, like Month or Mois, Revenue or CA. Lines above the column titles are skipped, and a dash or n/a means no number.
                </p>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Actuals and variance analysis are visible, but importing or deleting actual data requires Editor permission.
              </section>
            )
      }

      {
        error
          ?
            (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
              >
                {
                  error
                }
              </div>
            )
          :
            null
      }

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Actual revenue"
          actual={
            report.summary
              .revenueActual
          }
          forecast={
            report.summary
              .revenueForecast
          }
          variance={
            report.summary
              .revenueVariance
          }
          varianceRate={
            report.summary
              .revenueVarianceRate
          }
          currency={
            currency
          }
        />

        <SummaryCard
          label="Actual EBITDA"
          actual={
            report.summary
              .ebitdaActual
          }
          forecast={
            report.summary
              .ebitdaForecast
          }
          variance={
            report.summary
              .ebitdaVariance
          }
          varianceRate={
            report.summary
              .ebitdaVarianceRate
          }
          currency={
            currency
          }
        />

        <SummaryCard
          label="Latest cash"
          actual={
            report.summary
              .latestCashActual
          }
          forecast={
            report.summary
              .latestCashForecast
          }
          variance={
            report.summary
              .latestCashVariance
          }
          varianceRate={
            null
          }
          currency={
            currency
          }
        />

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Matched months
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              report.summary
                .matchedPeriods
            }
            /
            {
              report.summary
                .actualPeriods
            }
          </p>

          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Actual months successfully aligned with forecast periods.
          </p>
        </article>
      </section>

      {
        loading
          ?
            (
              <div className="h-64 animate-pulse rounded-xl bg-muted" />
            )
          :
            report.periods.length ===
              0
              ?
                (
                  <section className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
                    {
                      actuals.length ===
                        0
                        ?
                          "Import monthly actuals to begin variance analysis."
                        :
                          "Actual data exists, but no periods currently match recognizable forecast months."
                    }
                  </section>
                )
              :
                (
                  <section className="overflow-hidden rounded-xl border bg-background">
                    <div className="border-b p-5">
                      <h2 className="text-lg font-semibold">
                        Monthly variance
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Green variances are favorable; red variances are unfavorable. Lower COGS and operating expenses are treated as favorable.
                      </p>
                    </div>

                    <ScrollRegion label="Monthly variance">
                      <table className="w-full min-w-[1050px] text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="px-4 py-3 text-left">
                              Month
                            </th>

                            {
                              DISPLAY_METRICS.map(
                                (
                                  metric,
                                ) => (
                                  <th
                                    key={
                                      metric.key
                                    }
                                    colSpan={
                                      3
                                    }
                                    className="border-l px-4 py-3 text-center"
                                  >
                                    {
                                      metric.label
                                    }
                                  </th>
                                ),
                              )
                            }
                          </tr>

                          <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                            <th />

                            {
                              DISPLAY_METRICS.flatMap(
                                (
                                  metric,
                                ) => [
                                  <th
                                    key={`${metric.key}-actual`}
                                    className="border-l px-3 py-2 text-right"
                                  >
                                    Actual
                                  </th>,

                                  <th
                                    key={`${metric.key}-forecast`}
                                    className="px-3 py-2 text-right"
                                  >
                                    Forecast
                                  </th>,

                                  <th
                                    key={`${metric.key}-variance`}
                                    className="px-3 py-2 text-right"
                                  >
                                    Var.
                                  </th>,
                                ],
                              )
                            }
                          </tr>
                        </thead>

                        <tbody>
                          {
                            report.periods.map(
                              (
                                period,
                              ) => (
                                <tr
                                  key={
                                    period.period
                                  }
                                  className="border-b last:border-0"
                                >
                                  <th className="px-4 py-3 text-left font-medium">
                                    {
                                      period.period
                                    }
                                  </th>

                                  {
                                    DISPLAY_METRICS.flatMap(
                                      (
                                        metric,
                                      ) => {
                                        const variance =
                                          period.metrics[
                                            metric.key
                                          ];


                                        return [
                                          <td
                                            key={`${metric.key}-actual`}
                                            className="border-l px-3 py-3 text-right tabular-nums"
                                          >
                                            {
                                              variance
                                                ?
                                                  money(
                                                    variance.actual,
                                                    currency,
                                                  )
                                                :
                                                  "—"
                                            }
                                          </td>,

                                          <td
                                            key={`${metric.key}-forecast`}
                                            className="px-3 py-3 text-right tabular-nums"
                                          >
                                            {
                                              variance
                                                ?
                                                  money(
                                                    variance.forecast,
                                                    currency,
                                                  )
                                                :
                                                  "—"
                                            }
                                          </td>,

                                          <td
                                            key={`${metric.key}-variance`}
                                            className={`px-3 py-3 text-right tabular-nums ${varianceTone(
                                              variance?.favorable,
                                            )}`}
                                          >
                                            {
                                              variance
                                                ?
                                                  `${money(
                                                    variance.variance,
                                                    currency,
                                                  )}${
                                                    variance.varianceRate !==
                                                      null
                                                      ?
                                                        ` (${percentage(
                                                          variance.varianceRate,
                                                        )})`
                                                      :
                                                        ""
                                                  }`
                                                :
                                                  "—"
                                            }
                                          </td>,
                                        ];
                                      },
                                    )
                                  }
                                </tr>
                              ),
                            )
                          }
                        </tbody>
                      </table>
                    </ScrollRegion>
                  </section>
                )
      }

      {
        editable &&
        actuals.length >
          0
          ?
            (
              <section className="rounded-xl border border-destructive/20 p-5">
                <h2 className="font-semibold">
                  Clear imported actuals
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  This removes all persisted actual observations for this project. Forecast assumptions and immutable model revisions are unaffected.
                </p>

                <form
                  action={
                    clearActualsAction
                  }
                  className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={
                      projectId
                    }
                  />

                  <label className="space-y-2">
                    <span className="text-xs font-medium">
                      Type CLEAR ACTUALS
                    </span>

                    <input
                      name="confirmation"
                      required
                      className="h-10 rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <PendingButton
                    className="h-10 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive"
                  >
                    Clear actuals
                  </PendingButton>
                </form>
              </section>
            )
          :
            null
      }
    </div>
  );
}
