"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  normalizeForecastCsv,
} from "@/lib/finance/analytics/csv";

import {
  calculateManagementScorecard,
} from "@/lib/finance/scorecard/calculations";

import {
  KPI_METRICS,
  kpiMetricDefinition,
  targetValueForInput,
} from "@/lib/finance/scorecard/metrics";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import type {
  KpiMetricCode,
  KpiScorecardRow,
  KpiTargetStatus,
  KpiTargetView,
} from "@/lib/finance/scorecard/types";

import {
  deleteKpiTargetAction,
  saveKpiTargetAction,
} from "@/app/(app)/projects/[projectId]/scorecard/actions";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

  defaultPeriod:
    string;

  actuals:
    ActualFinancialPeriod[];

  riskPolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;

  targets:
    KpiTargetView[];
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


function number(
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
      maximumFractionDigits:
        1,
    },
  ).format(
    value,
  );
}


function displayValue({
  metric,
  value,
  currency,
}: {
  metric:
    KpiMetricCode;

  value:
    number |
    null;

  currency:
    string;
}): string {
  const definition =
    kpiMetricDefinition(
      metric,
    );


  switch (
    definition.format
  ) {
    case "MONEY":
      return money(
        value,
        currency,
      );


    case "PERCENT":
      return percent(
        value,
      );


    case "MONTHS":
      return value ===
        null
        ?
          "—"
        :
          `${number(
            value,
          )} mo`;


    case "NUMBER":
      return number(
        value,
      );
  }
}


function statusTone(
  status:
    KpiTargetStatus,
): string {
  switch (
    status
  ) {
    case "ON_TRACK":
      return "text-emerald-700 dark:text-emerald-400";

    case "AT_RISK":
      return "text-amber-700 dark:text-amber-400";

    case "OFF_TRACK":
      return "text-destructive";

    case "UNAVAILABLE":
      return "text-muted-foreground";
  }
}


function statusSurface(
  status:
    KpiTargetStatus,
): string {
  switch (
    status
  ) {
    case "ON_TRACK":
      return "bg-emerald-500/5";

    case "AT_RISK":
      return "bg-amber-500/5";

    case "OFF_TRACK":
      return "bg-destructive/5";

    case "UNAVAILABLE":
      return "bg-muted/20";
  }
}


function scorecardRowLabel(
  row:
    KpiScorecardRow,
): string {
  return kpiMetricDefinition(
    row.target.metricCode,
  ).label;
}


export function ScorecardWorkspace({
  projectId,
  currency,
  editable,
  defaultPeriod,
  actuals,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
  targets,
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
    targetPeriod,
    setTargetPeriod,
  ] =
    useState(
      defaultPeriod,
    );


  const [
    selectedMetric,
    setSelectedMetric,
  ] =
    useState<
      KpiMetricCode
    >(
      "REVENUE",
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
            controller.signal.aborted
          ) {
            return;
          }


          setError(
            cause instanceof Error
              ?
                cause.message
              :
                "Unable to load management scorecard data.",
          );
        }
        finally {
          if (
            !controller.signal.aborted
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


  const scorecard =
    useMemo(
      () =>
        calculateManagementScorecard({
          targets,

          actuals,

          forecasts,

          riskPolicy,

          latestActualPeriod,

          latestActualCash,
        }),
      [
        targets,
        actuals,
        forecasts,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
      ],
    );


  const selectedExistingTarget =
    useMemo(
      () =>
        targets.find(
          (
            target,
          ) =>
            target.periodKey ===
              targetPeriod &&
            target.metricCode ===
              selectedMetric,
        ) ??
        null,
      [
        targets,
        targetPeriod,
        selectedMetric,
      ],
    );


  const periods =
    useMemo(
      () =>
        [
          ...new Set(
            targets.map(
              (
                target,
              ) =>
                target.periodKey,
            ),
          ),
        ].sort(
          (
            left,
            right,
          ) =>
            right.localeCompare(
              left,
            ),
        ),
      [
        targets,
      ],
    );


  if (
    loading
  ) {
    return (
      <div className="space-y-6">
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

        <div className="h-80 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }


  return (
    <div className="space-y-8">
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Targets
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              scorecard.summary
                .total
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            On track
          </p>

          <p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-400">
            {
              scorecard.summary
                .onTrack
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            At risk
          </p>

          <p className="mt-2 text-3xl font-semibold text-amber-700 dark:text-amber-400">
            {
              scorecard.summary
                .atRisk
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Off track
          </p>

          <p className="mt-2 text-3xl font-semibold text-destructive">
            {
              scorecard.summary
                .offTrack
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tracked periods
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              scorecard.summary
                .trackedPeriods
            }
          </p>
        </article>
      </section>

      {
        editable
          ?
            (
              <section className="rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="text-lg font-semibold">
                  Set management target
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Saving the same metric and period updates that target. Percentage targets are entered as percentages, such as 20 for a 20% EBITDA margin.
                </p>

                <form
                  key={`${targetPeriod}-${selectedMetric}-${selectedExistingTarget?.updatedAt ?? "new"}`}
                  action={
                    saveKpiTargetAction
                  }
                  className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  <input
                    type="hidden"
                    name="projectId"
                    value={
                      projectId
                    }
                  />

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Period
                    </span>

                    <input
                      type="month"
                      required
                      name="periodKey"
                      value={
                        targetPeriod
                      }
                      onChange={(
                        event,
                      ) => {
                        setTargetPeriod(
                          event.target.value,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      KPI
                    </span>

                    <select
                      name="metricCode"
                      value={
                        selectedMetric
                      }
                      onChange={(
                        event,
                      ) => {
                        setSelectedMetric(
                          event.target.value as
                            KpiMetricCode,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        KPI_METRICS.map(
                          (
                            metric,
                          ) => (
                            <option
                              key={
                                metric.code
                              }
                              value={
                                metric.code
                              }
                            >
                              {
                                metric.label
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Target value
                    </span>

                    <input
                      type="number"
                      step={
                        selectedMetric ===
                          "CUSTOMERS" ||
                        selectedMetric ===
                          "RUNWAY_MONTHS"
                          ?
                            "1"
                          :
                            "0.01"
                      }
                      required
                      name="targetValue"
                      defaultValue={
                        selectedExistingTarget
                          ?
                            targetValueForInput({
                              metric:
                                selectedExistingTarget.metricCode,

                              value:
                                selectedExistingTarget.targetValue,
                            })
                          :
                            ""
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Owner
                    </span>

                    <input
                      name="ownerName"
                      maxLength={
                        80
                      }
                      defaultValue={
                        selectedExistingTarget
                          ?.ownerName ??
                        ""
                      }
                      placeholder="Finance lead"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Management note
                    </span>

                    <input
                      name="note"
                      maxLength={
                        1000
                      }
                      defaultValue={
                        selectedExistingTarget
                          ?.note ??
                        ""
                      }
                      placeholder="Context, commitment, or management rationale."
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <div className="sm:col-span-2 xl:col-span-3">
                    <button
                      type="submit"
                      className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                    >
                      {
                        selectedExistingTarget
                          ?
                            "Update KPI target"
                          :
                            "Add KPI target"
                      }
                    </button>
                  </div>
                </form>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Management targets and scorecard status are visible, but changing targets requires Editor permission.
              </section>
            )
      }

      {
        scorecard.rows.length ===
        0
          ?
            (
              <section className="rounded-xl border border-dashed p-8">
                <h2 className="font-semibold">
                  No management targets yet
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Add targets for revenue, EBITDA margin, cash, MRR, customers, runway, or forecast accuracy to activate the management scorecard.
                </p>
              </section>
            )
          :
            (
              <section className="overflow-hidden rounded-xl border bg-background">
                <div className="border-b p-5">
                  <h2 className="text-lg font-semibold">
                    Management scorecard
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                    Period KPIs prefer Actuals when available and otherwise use the authoritative forecast. Runway and forecast accuracy are evaluated from the live analytical authorities.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1280px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Period
                        </th>

                        <th className="px-4 py-3 text-left">
                          KPI
                        </th>

                        <th className="px-4 py-3 text-left">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right">
                          Target
                        </th>

                        <th className="px-4 py-3 text-right">
                          Current
                        </th>

                        <th className="px-4 py-3 text-right">
                          Gap
                        </th>

                        <th className="px-4 py-3 text-left">
                          Source
                        </th>

                        <th className="px-4 py-3 text-left">
                          Owner
                        </th>

                        <th className="px-4 py-3 text-left">
                          Note
                        </th>

                        {
                          editable
                            ?
                              (
                                <th className="px-4 py-3 text-left">
                                  Manage
                                </th>
                              )
                            :
                              null
                        }
                      </tr>
                    </thead>

                    <tbody>
                      {
                        scorecard.rows.map(
                          (
                            row,
                          ) => (
                            <tr
                              key={
                                row.target.id
                              }
                              className={`border-b align-top last:border-0 ${statusSurface(
                                row.status,
                              )}`}
                            >
                              <td className="px-4 py-3 font-medium">
                                {
                                  row.target
                                    .periodKey
                                }
                              </td>

                              <th className="px-4 py-3 text-left">
                                {
                                  scorecardRowLabel(
                                    row,
                                  )
                                }
                              </th>

                              <td className={`px-4 py-3 font-semibold ${statusTone(
                                row.status,
                              )}`}>
                                {
                                  row.status
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  displayValue({
                                    metric:
                                      row.target.metricCode,

                                    value:
                                      row.target.targetValue,

                                    currency,
                                  })
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  displayValue({
                                    metric:
                                      row.target.metricCode,

                                    value:
                                      row.currentValue,

                                    currency,
                                  })
                                }
                              </td>

                              <td className={`px-4 py-3 text-right tabular-nums ${
                                row.gap !==
                                  null &&
                                row.gap <
                                  0
                                  ?
                                    "text-destructive"
                                  :
                                    ""
                              }`}>
                                {
                                  row.gap ===
                                    null
                                    ?
                                      "—"
                                    :
                                      displayValue({
                                        metric:
                                          row.target.metricCode,

                                        value:
                                          row.gap,

                                        currency,
                                      })
                                }
                              </td>

                              <td className="px-4 py-3 text-xs">
                                {
                                  row.source
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  row.target
                                    .ownerName ??
                                  "—"
                                }
                              </td>

                              <td className="max-w-sm px-4 py-3 text-xs leading-5 text-muted-foreground">
                                {
                                  row.target
                                    .note ??
                                  "—"
                                }
                              </td>

                              {
                                editable
                                  ?
                                    (
                                      <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTargetPeriod(
                                                row.target.periodKey,
                                              );

                                              setSelectedMetric(
                                                row.target.metricCode,
                                              );


                                              document
                                                .querySelector(
                                                  'input[name="targetValue"]',
                                                )
                                                ?.scrollIntoView({
                                                  behavior:
                                                    "smooth",

                                                  block:
                                                    "center",
                                                });
                                            }}
                                            className="rounded-lg border px-3 py-2 text-xs font-medium"
                                          >
                                            Edit
                                          </button>

                                          <form
                                            action={
                                              deleteKpiTargetAction
                                            }
                                          >
                                            <input
                                              type="hidden"
                                              name="projectId"
                                              value={
                                                projectId
                                              }
                                            />

                                            <input
                                              type="hidden"
                                              name="targetId"
                                              value={
                                                row.target.id
                                              }
                                            />

                                            <button
                                              type="submit"
                                              className="rounded-lg border px-3 py-2 text-xs font-medium text-destructive"
                                            >
                                              Delete
                                            </button>
                                          </form>
                                        </div>
                                      </td>
                                    )
                                  :
                                    null
                              }
                            </tr>
                          ),
                        )
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            )
      }

      {
        periods.length >
        0
          ?
            (
              <section className="rounded-xl border bg-background p-5">
                <h2 className="font-semibold">
                  Scorecard coverage
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {
                    periods.map(
                      (
                        period,
                      ) => (
                        <span
                          key={
                            period
                          }
                          className="rounded border px-2 py-1 text-xs text-muted-foreground"
                        >
                          {
                            period
                          }
                        </span>
                      ),
                    )
                  }
                </div>
              </section>
            )
          :
            null
      }

      <section className="flex flex-wrap gap-2 rounded-xl border bg-muted/20 p-5">
        <Link
          href={`/projects/${projectId}/actuals`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Actuals
        </Link>

        <Link
          href={`/projects/${projectId}/forecast`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Forecast
        </Link>

        <Link
          href={`/projects/${projectId}/forecast-accuracy`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Forecast Accuracy
        </Link>

        <Link
          href={`/projects/${projectId}/risk-center`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Risk Center
        </Link>

        <Link
          href={`/projects/${projectId}/decision-center`}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Decision Center
        </Link>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        KPI targets are management commitments, not forecast assumptions. Updating a target does not change the financial model, Actuals, scenarios, risk policy, baselines, sensitivity cases, or immutable revisions.
      </p>
    </div>
  );
}
