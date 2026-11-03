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
} from "@/lib/finance/analytics/csv";

import {
  calculatePlanningCycleReport,
} from "@/lib/finance/planning-cycle/calculations";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastBaselineView,
  PlanningMetric,
} from "@/lib/finance/planning-cycle/types";

import {
  createForecastBaselineAction,
} from "@/app/(app)/projects/[projectId]/planning-cycle/actions";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

  actuals:
    ActualFinancialPeriod[];

  baselines:
    ForecastBaselineView[];
};


const METRIC_LABELS:
  Record<
    PlanningMetric,
    string
  > = {
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
      "Ending cash",

    mrr:
      "MRR",
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


function varianceTone(
  value:
    number |
    null,
): string {
  if (
    value ===
      null ||
    value ===
      0
  ) {
    return "text-muted-foreground";
  }


  return value >
    0
    ?
      "text-success"
    :
      "text-destructive";
}


function MetricCard({
  label,
  baseline,
  current,
  rolling,
  rollingVarianceRate,
  currency,
}: {
  label:
    string;

  baseline:
    number |
    null;

  current:
    number |
    null;

  rolling:
    number |
    null;

  rollingVarianceRate:
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
            rolling,
            currency,
          )
        }
      </p>

      <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between gap-3">
          <dt>
            Baseline
          </dt>

          <dd>
            {
              money(
                baseline,
                currency,
              )
            }
          </dd>
        </div>

        <div className="flex justify-between gap-3">
          <dt>
            Current forecast
          </dt>

          <dd>
            {
              money(
                current,
                currency,
              )
            }
          </dd>
        </div>

        <div className="flex justify-between gap-3">
          <dt>
            Rolling vs baseline
          </dt>

          <dd className={varianceTone(
            rollingVarianceRate,
          )}>
            {
              percent(
                rollingVarianceRate,
              )
            }
          </dd>
        </div>
      </dl>
    </article>
  );
}


export function PlanningCycleWorkspace({
  projectId,
  currency,
  editable,
  actuals,
  baselines,
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


  const [
    selectedBaselineId,
    setSelectedBaselineId,
  ] =
    useState(
      baselines[
        0
      ]?.id ??
      "",
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
                "Unable to load the current forecast.",
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


  const currentForecast =
    useMemo(
      () =>
        normalizeForecastCsv(
          forecastCsv,
        ),
      [
        forecastCsv,
      ],
    );


  const selectedBaseline =
    useMemo(
      () =>
        baselines.find(
          (
            baseline,
          ) =>
            baseline.id ===
            selectedBaselineId,
        ) ??
        baselines[
          0
        ] ??
        null,
      [
        baselines,
        selectedBaselineId,
      ],
    );


  const report =
    useMemo(
      () =>
        selectedBaseline
          ?
            calculatePlanningCycleReport(
              selectedBaseline
                .snapshot
                .rows,
              currentForecast,
              actuals,
            )
          :
            null,
      [
        actuals,
        currentForecast,
        selectedBaseline,
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
                  Freeze current forecast
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Save the current financial forecast as an immutable planning baseline. Existing baselines are never rewritten when assumptions change later.
                </p>

                <form
                  action={
                    createForecastBaselineAction
                  }
                  className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px_auto] lg:items-end"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={
                      projectId
                    }
                  />

                  <textarea
                    hidden
                    readOnly
                    name="forecastCsv"
                    value={
                      forecastCsv
                    }
                  />

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Baseline name
                    </span>

                    <input
                      name="name"
                      required
                      minLength={
                        2
                      }
                      maxLength={
                        80
                      }
                      placeholder="FY27 Board Budget"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Type
                    </span>

                    <select
                      name="kind"
                      defaultValue="BUDGET"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="BUDGET">
                        Budget
                      </option>

                      <option value="FORECAST">
                        Forecast
                      </option>

                      <option value="BOARD">
                        Board plan
                      </option>

                      <option value="CUSTOM">
                        Custom
                      </option>
                    </select>
                  </label>

                  <PendingButton
                    disabled={
                      !forecastCsv
                    }
                    className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Freeze baseline
                  </PendingButton>
                </form>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Planning baselines and rolling reforecast comparisons are visible, but freezing a new baseline requires Editor permission.
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

      {
        loading
          ?
            (
              <div className="h-72 animate-pulse rounded-xl bg-muted" />
            )
          :
            baselines.length ===
              0
              ?
                (
                  <section className="rounded-xl border border-dashed p-8">
                    <h2 className="font-semibold">
                      No planning baseline yet
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      Freeze the current forecast as a Budget or Forecast baseline. VentureScope can then measure how the live plan and rolling actuals-plus-forecast outlook have moved relative to that original plan.
                    </p>
                  </section>
                )
              :
                (
                  <>
                    <section className="rounded-xl border bg-background p-5">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Planning baseline
                          </p>

                          <h2 className="mt-1 text-xl font-semibold">
                            Compare planning cycles
                          </h2>
                        </div>

                        <label className="space-y-2">
                          <span className="text-xs font-medium">
                            Baseline
                          </span>

                          <select
                            value={
                              selectedBaseline
                                ?.id ??
                              ""
                            }
                            onChange={(
                              event,
                            ) => {
                              setSelectedBaselineId(
                                event.target
                                  .value,
                              );
                            }}
                            className="h-10 w-full max-w-full rounded-lg border bg-background px-3 text-sm sm:w-auto sm:min-w-64"
                          >
                            {
                              baselines.map(
                                (
                                  baseline,
                                ) => (
                                  <option
                                    key={
                                      baseline.id
                                    }
                                    value={
                                      baseline.id
                                    }
                                  >
                                    {
                                      baseline.name
                                    }
                                    {" · "}
                                    {
                                      baseline.kind
                                    }
                                  </option>
                                ),
                              )
                            }
                          </select>
                        </label>
                      </div>

                      {
                        selectedBaseline
                          ?
                            (
                              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="rounded border px-2 py-1">
                                  {
                                    selectedBaseline.kind
                                  }
                                </span>

                                <span className="rounded border px-2 py-1">
                                  Model {
                                    selectedBaseline
                                      .modelVersion
                                  }
                                </span>

                                <span className="rounded border px-2 py-1">
                                  {
                                    new Date(
                                      selectedBaseline
                                        .createdAt,
                                    ).toLocaleDateString()
                                  }
                                </span>

                                {
                                  selectedBaseline
                                    .createdBy
                                    ?
                                      (
                                        <span className="rounded border px-2 py-1">
                                          {
                                            selectedBaseline
                                              .createdBy
                                          }
                                        </span>
                                      )
                                    :
                                      null
                                }
                              </div>
                            )
                          :
                            null
                      }
                    </section>

                    {
                      report
                        ?
                          (
                            <>
                              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {
                                  (
                                    [
                                      "revenue",
                                      "ebitda",
                                      "cashBalance",
                                      "mrr",
                                    ] as const
                                  ).map(
                                    (
                                      metric,
                                    ) => (
                                      <MetricCard
                                        key={
                                          metric
                                        }
                                        label={
                                          METRIC_LABELS[
                                            metric
                                          ]
                                        }
                                        baseline={
                                          report.metrics[
                                            metric
                                          ].baseline
                                        }
                                        current={
                                          report.metrics[
                                            metric
                                          ].currentForecast
                                        }
                                        rolling={
                                          report.metrics[
                                            metric
                                          ].rollingReforecast
                                        }
                                        rollingVarianceRate={
                                          report.metrics[
                                            metric
                                          ].rollingVsBaselineRate
                                        }
                                        currency={
                                          currency
                                        }
                                      />
                                    ),
                                  )
                                }
                              </section>

                              <section className="grid gap-4 lg:grid-cols-3">
                                <article className="rounded-xl border bg-background p-5">
                                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Actual periods
                                  </p>

                                  <p className="mt-2 text-3xl font-semibold">
                                    {
                                      report.actualPeriodsUsed
                                    }
                                  </p>

                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Rolling reforecast periods replaced with observed actuals.
                                  </p>
                                </article>

                                <article className="rounded-xl border bg-background p-5">
                                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Future forecast periods
                                  </p>

                                  <p className="mt-2 text-3xl font-semibold">
                                    {
                                      report.forecastPeriodsUsed
                                    }
                                  </p>

                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Remaining periods still sourced from the live forecast.
                                  </p>
                                </article>

                                <article className="rounded-xl border bg-background p-5">
                                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Rolling horizon
                                  </p>

                                  <p className="mt-2 text-3xl font-semibold">
                                    {
                                      report.rollingRows
                                        .length
                                    }
                                  </p>

                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Total comparable periods in the current rolling outlook.
                                  </p>
                                </article>
                              </section>

                              <section className="overflow-hidden rounded-xl border bg-background">
                                <div className="border-b p-5">
                                  <h2 className="text-lg font-semibold">
                                    Baseline bridge
                                  </h2>

                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Compare the frozen baseline with today&apos;s live forecast and the actuals-plus-future-forecast rolling outlook.
                                  </p>
                                </div>

                                <ScrollRegion label="Baseline bridge">
                                  <table className="w-full min-w-[850px] text-sm">
                                    <thead>
                                      <tr className="border-b bg-muted/30">
                                        <th className="px-4 py-3 text-left">
                                          Metric
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Baseline
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Current forecast
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Current vs baseline
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Rolling reforecast
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Rolling vs baseline
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {
                                        (
                                          Object.keys(
                                            METRIC_LABELS,
                                          ) as
                                            PlanningMetric[]
                                        ).map(
                                          (
                                            metric,
                                          ) => {
                                            const comparison =
                                              report.metrics[
                                                metric
                                              ];


                                            return (
                                              <tr
                                                key={
                                                  metric
                                                }
                                                className="border-b last:border-0"
                                              >
                                                <th className="px-4 py-3 text-left font-medium">
                                                  {
                                                    METRIC_LABELS[
                                                      metric
                                                    ]
                                                  }
                                                </th>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                  {
                                                    money(
                                                      comparison.baseline,
                                                      currency,
                                                    )
                                                  }
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                  {
                                                    money(
                                                      comparison.currentForecast,
                                                      currency,
                                                    )
                                                  }
                                                </td>

                                                <td className={`px-4 py-3 text-right tabular-nums ${varianceTone(
                                                  comparison.currentVsBaselineRate,
                                                )}`}>
                                                  {
                                                    percent(
                                                      comparison.currentVsBaselineRate,
                                                    )
                                                  }
                                                </td>

                                                <td className="px-4 py-3 text-right tabular-nums">
                                                  {
                                                    money(
                                                      comparison.rollingReforecast,
                                                      currency,
                                                    )
                                                  }
                                                </td>

                                                <td className={`px-4 py-3 text-right tabular-nums ${varianceTone(
                                                  comparison.rollingVsBaselineRate,
                                                )}`}>
                                                  {
                                                    percent(
                                                      comparison.rollingVsBaselineRate,
                                                    )
                                                  }
                                                </td>
                                              </tr>
                                            );
                                          },
                                        )
                                      }
                                    </tbody>
                                  </table>
                                </ScrollRegion>
                              </section>

                              <section className="overflow-hidden rounded-xl border bg-background">
                                <div className="border-b p-5">
                                  <h2 className="text-lg font-semibold">
                                    Rolling actuals + forecast
                                  </h2>

                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Actual observations replace matching historical forecast months. Months without actuals continue to use the live VentureScope forecast.
                                  </p>
                                </div>

                                <ScrollRegion label="Rolling actuals + forecast" className="max-h-[520px] overflow-y-auto">
                                  <table className="w-full min-w-[700px] text-sm">
                                    <thead className="sticky top-0 bg-background">
                                      <tr className="border-b">
                                        <th className="px-4 py-3 text-left">
                                          Period
                                        </th>

                                        <th className="px-4 py-3 text-left">
                                          Source
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Revenue
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          EBITDA
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Cash flow
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                          Cash balance
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {
                                        report.rollingRows.map(
                                          (
                                            row,
                                          ) => (
                                            <tr
                                              key={
                                                row.period
                                              }
                                              className="border-b last:border-0"
                                            >
                                              <td className="px-4 py-3 font-medium">
                                                {
                                                  row.period
                                                }
                                              </td>

                                              <td className="px-4 py-3">
                                                <span className="rounded border px-2 py-1 text-xs">
                                                  {
                                                    row.source
                                                  }
                                                </span>
                                              </td>

                                              <td className="px-4 py-3 text-right tabular-nums">
                                                {
                                                  money(
                                                    row.revenue,
                                                    currency,
                                                  )
                                                }
                                              </td>

                                              <td className="px-4 py-3 text-right tabular-nums">
                                                {
                                                  money(
                                                    row.ebitda,
                                                    currency,
                                                  )
                                                }
                                              </td>

                                              <td className="px-4 py-3 text-right tabular-nums">
                                                {
                                                  money(
                                                    row.cashFlow,
                                                    currency,
                                                  )
                                                }
                                              </td>

                                              <td className="px-4 py-3 text-right tabular-nums">
                                                {
                                                  money(
                                                    row.cashBalance,
                                                    currency,
                                                  )
                                                }
                                              </td>
                                            </tr>
                                          ),
                                        )
                                      }
                                    </tbody>
                                  </table>
                                </ScrollRegion>
                              </section>
                            </>
                          )
                        :
                          null
                    }
                  </>
                )
      }

      <p className="text-xs leading-5 text-muted-foreground">
        Planning baselines are immutable comparison points. Rolling reforecast results are computed from imported actual observations plus the current VentureScope forecast and do not automatically mutate project assumptions.
      </p>
    </div>
  );
}
