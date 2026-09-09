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
  buildExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/snapshot";

import {
  compareExecutiveReview,
} from "@/lib/finance/board-room/comparison";

import {
  calculateManagementScorecard,
} from "@/lib/finance/scorecard/calculations";

import {
  kpiMetricDefinition,
} from "@/lib/finance/scorecard/metrics";

import {
  calculateVarianceReview,
} from "@/lib/finance/variance-review/calculations";

import {
  varianceMetricDefinition,
} from "@/lib/finance/variance-review/metrics";

import {
  buildFinancialPeriodRegister,
} from "@/lib/finance/period-close/register";

import {
  buildBoardPackExecutiveSummary,
} from "@/lib/finance/board-pack/insights";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import type {
  KpiTargetView,
} from "@/lib/finance/scorecard/types";

import type {
  VarianceCommentaryView,
} from "@/lib/finance/variance-review/types";

import type {
  FinancialPeriodStateView,
} from "@/lib/finance/period-close/types";

import type {
  BoardPackActionView,
  BoardPackAuditSummary,
  BoardPackLatestReview,
  BoardPackInsightSeverity,
} from "@/lib/finance/board-pack/types";


type Props = {
  projectId:
    string;

  projectName:
    string;

  currency:
    string;

  modelVersion:
    string;

  generatedAt:
    string;

  defaultReportPeriod:
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

  commentaries:
    VarianceCommentaryView[];

  periodStates:
    FinancialPeriodStateView[];

  actions:
    BoardPackActionView[];

  latestReview:
    BoardPackLatestReview |
    null;

  auditSummary:
    BoardPackAuditSummary;
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


function numberValue(
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


function insightTone(
  severity:
    BoardPackInsightSeverity,
): string {
  switch (
    severity
  ) {
    case "CRITICAL":
      return "text-destructive";

    case "WARNING":
      return "text-amber-700 dark:text-amber-400";

    case "INFO":
      return "text-muted-foreground";
  }
}


function scorecardValue({
  metric,
  value,
  currency,
}: {
  metric:
    KpiTargetView[
      "metricCode"
    ];

  value:
    number |
    null;

  currency:
    string;
}) {
  const format =
    kpiMetricDefinition(
      metric,
    ).format;


  switch (
    format
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
          `${numberValue(
            value,
          )} mo`;


    case "NUMBER":
      return numberValue(
        value,
      );
  }
}


function varianceValue({
  metric,
  value,
  currency,
}: {
  metric:
    VarianceCommentaryView[
      "metricCode"
    ];

  value:
    number |
    null;

  currency:
    string;
}) {
  return varianceMetricDefinition(
    metric,
  ).format ===
    "MONEY"
    ?
      money(
        value,
        currency,
      )
    :
      numberValue(
        value,
      );
}


function printDocument() {
  window.print();
}


export function BoardPackWorkspace({
  projectId,
  projectName,
  currency,
  modelVersion,
  generatedAt,
  defaultReportPeriod,
  actuals,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
  targets,
  commentaries,
  periodStates,
  actions,
  latestReview,
  auditSummary,
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
    reportPeriod,
    setReportPeriod,
  ] =
    useState(
      defaultReportPeriod,
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
                "Unable to prepare the management board pack.",
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


  const liveSnapshot =
    useMemo(
      () =>
        buildExecutiveReviewSnapshot({
          capturedAt:
            generatedAt,

          actuals,

          forecasts,

          riskPolicy,

          latestActualPeriod,

          latestActualCash,

          actions:
            actions.map(
              (
                action,
              ) => ({
                status:
                  action.status,

                priority:
                  action.priority,

                dueDate:
                  action.dueDate,
              }),
            ),
        }),
      [
        generatedAt,
        actuals,
        forecasts,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
        actions,
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


  const varianceReview =
    useMemo(
      () =>
        calculateVarianceReview({
          actuals,

          forecasts,

          commentaries,
        }),
      [
        actuals,
        forecasts,
        commentaries,
      ],
    );


  const periodRegister =
    useMemo(
      () =>
        buildFinancialPeriodRegister({
          actuals:
            actuals.map(
              (
                actual,
              ) => ({
                periodKey:
                  actual.period,

                revenue:
                  actual.revenue,

                ebitda:
                  actual.ebitda,

                cashBalance:
                  actual.cashBalance,
              }),
            ),

          states:
            periodStates,
        }),
      [
        actuals,
        periodStates,
      ],
    );


  const executiveSummary =
    useMemo(
      () =>
        buildBoardPackExecutiveSummary({
          reportPeriod,

          liveSnapshot,

          scorecard,

          varianceReview,

          periodRegister,

          actions,
        }),
      [
        reportPeriod,
        liveSnapshot,
        scorecard,
        varianceReview,
        periodRegister,
        actions,
      ],
    );


  const latestReviewComparison =
    useMemo(
      () =>
        latestReview
          ?
            compareExecutiveReview(
              latestReview.snapshot,
              liveSnapshot,
            )
          :
            null,
      [
        latestReview,
        liveSnapshot,
      ],
    );


  const reportPeriods =
    useMemo(
      () => {
        const periods =
          [
            ...new Set(
              actuals.map(
                (
                  actual,
                ) =>
                  actual.period,
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
          );


        return periods.length >
          0
          ?
            periods
          :
            [
              defaultReportPeriod,
            ];
      },
      [
        actuals,
        defaultReportPeriod,
      ],
    );


  const reportScorecardRows =
    scorecard.rows
      .filter(
        (
          row,
        ) =>
          row.target.periodKey ===
          reportPeriod,
      )
      .slice(
        0,
        12,
      );


  const materialVarianceRows =
    varianceReview.rows
      .filter(
        (
          row,
        ) =>
          row.periodKey ===
            reportPeriod &&
          (
            row.materiality ===
              "MATERIAL" ||
            row.materiality ===
              "REVIEW"
          ),
      )
      .slice(
        0,
        12,
      );


  const openActions =
    actions
      .filter(
        (
          action,
        ) =>
          action.status !==
            "DONE" &&
          action.status !==
            "DISMISSED",
      )
      .slice(
        0,
        12,
      );


  const reportClose =
    periodRegister.rows.find(
      (
        row,
      ) =>
        row.periodKey ===
        reportPeriod,
    ) ??
    null;


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

        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }


  return (
    <>
      <style>
        {
          `
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background: white !important;
            }

            .board-pack-print-hidden {
              display: none !important;
            }

            .board-pack-sheet {
              max-width: none !important;
              width: 100% !important;
            }

            .board-pack-break-before {
              break-before: page;
            }

            .board-pack-avoid-break {
              break-inside: avoid;
            }

            .board-pack-table {
              font-size: 10px;
            }
          }
          `
        }
      </style>

      <div className="board-pack-sheet space-y-8">
        {
          error
            ?
              (
                <div
                  role="alert"
                  className="board-pack-print-hidden rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
                >
                  {
                    error
                  }
                </div>
              )
            :
              null
        }

        <section className="board-pack-print-hidden rounded-xl border bg-background p-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium">
                Reporting period
              </span>

              <select
                value={
                  reportPeriod
                }
                onChange={(
                  event,
                ) => {
                  setReportPeriod(
                    event.target.value,
                  );
                }}
                className="h-10 min-w-56 rounded-lg border bg-background px-3 text-sm"
              >
                {
                  reportPeriods.map(
                    (
                      period,
                    ) => (
                      <option
                        key={
                          period
                        }
                        value={
                          period
                        }
                      >
                        {
                          period
                        }
                      </option>
                    ),
                  )
                }
              </select>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  printDocument
                }
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Print / Save as PDF
              </button>

              <Link
                href={`/projects/${projectId}/board-room`}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Board Room
              </Link>

              <Link
                href={`/projects/${projectId}/activity`}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Activity Center
              </Link>
            </div>
          </div>
        </section>

        <section className="board-pack-avoid-break rounded-xl border bg-background p-6">
          <p className="text-sm font-medium text-muted-foreground">
            VentureScope Management Reporting
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {
              projectName
            }
          </h1>

          <p className="mt-3 text-xl">
            Board &amp; Management Pack · {
              reportPeriod
            }
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Generated
              </p>

              <p className="mt-1 text-sm font-medium">
                {
                  new Date(
                    generatedAt,
                  ).toLocaleString()
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Currency
              </p>

              <p className="mt-1 text-sm font-medium">
                {
                  currency
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Model version
              </p>

              <p className="mt-1 text-sm font-medium">
                {
                  modelVersion
                }
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Financial close
              </p>

              <p className={`mt-1 text-sm font-semibold ${
                reportClose?.status ===
                  "CLOSED"
                  ?
                    "text-emerald-700 dark:text-emerald-400"
                  :
                    "text-amber-700 dark:text-amber-400"
              }`}>
                {
                  reportClose?.status ??
                  "NO ACTUALS"
                }
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="board-pack-avoid-break rounded-xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Forecast accuracy
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                percent(
                  liveSnapshot
                    .kpis
                    .forecastAccuracyScore,
                )
              }
            </p>
          </article>

          <article className="board-pack-avoid-break rounded-xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Liquidity risk
            </p>

            <p className={`mt-2 text-2xl font-semibold ${
              liveSnapshot.kpis
                .liquidityRiskLevel ===
                "CRITICAL" ||
              liveSnapshot.kpis
                .liquidityRiskLevel ===
                "HIGH"
                ?
                  "text-destructive"
                :
                  ""
            }`}>
              {
                liveSnapshot
                  .kpis
                  .liquidityRiskLevel
              }
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Score {
                liveSnapshot
                  .kpis
                  .liquidityRiskScore
              } / 100
            </p>
          </article>

          <article className="board-pack-avoid-break rounded-xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Capital need
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                money(
                  liveSnapshot
                    .kpis
                    .capitalNeed,
                  currency,
                )
              }
            </p>
          </article>

          <article className="board-pack-avoid-break rounded-xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Open actions
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                liveSnapshot
                  .actions
                  .open
              }
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {
                liveSnapshot
                  .actions
                  .criticalOpen
              } critical · {
                liveSnapshot
                  .actions
                  .overdue
              } overdue
            </p>
          </article>
        </section>

        <section className="board-pack-avoid-break rounded-xl border bg-background">
          <div className="border-b p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  Executive summary
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Deterministic management exceptions derived from existing VentureScope authorities.
                </p>
              </div>

              <p className="text-sm">
                <span className="font-semibold text-destructive">
                  {
                    executiveSummary
                      .critical
                  } critical
                </span>
                {" · "}
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {
                    executiveSummary
                      .warnings
                  } warning
                </span>
              </p>
            </div>
          </div>

          <div className="divide-y">
            {
              executiveSummary
                .insights
                .map(
                  (
                    insight,
                  ) => (
                    <article
                      key={
                        insight.code
                      }
                      className="board-pack-avoid-break p-5"
                    >
                      <p className={`text-xs font-semibold ${insightTone(
                        insight.severity,
                      )}`}>
                        {
                          insight.severity
                        }
                      </p>

                      <h3 className="mt-2 font-semibold">
                        {
                          insight.title
                        }
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {
                          insight.detail
                        }
                      </p>

                      <p className="mt-2 text-sm">
                        <span className="font-medium">
                          Management response:
                        </span>{" "}
                        {
                          insight.managementResponse
                        }
                      </p>
                    </article>
                  ),
                )
            }
          </div>
        </section>

        <section className="board-pack-avoid-break grid gap-4 lg:grid-cols-3">
          <article className="rounded-xl border bg-background p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Revenue variance
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                percent(
                  liveSnapshot
                    .kpis
                    .revenueVarianceRate,
                )
              }
            </p>
          </article>

          <article className="rounded-xl border bg-background p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              EBITDA variance
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                percent(
                  liveSnapshot
                    .kpis
                    .ebitdaVarianceRate,
                )
              }
            </p>
          </article>

          <article className="rounded-xl border bg-background p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Downside minimum cash
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                money(
                  liveSnapshot
                    .kpis
                    .minimumDownsideCash,
                  currency,
                )
              }
            </p>
          </article>
        </section>

        <section className="board-pack-break-before rounded-xl border bg-background">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">
              Management scorecard
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {
                scorecard.summary.onTrack
              } on track · {
                scorecard.summary.atRisk
              } at risk · {
                scorecard.summary.offTrack
              } off track
            </p>
          </div>

          {
            reportScorecardRows.length ===
            0
              ?
                (
                  <div className="p-8 text-sm text-muted-foreground">
                    No KPI targets are configured for {
                      reportPeriod
                    }.
                  </div>
                )
              :
                (
                  <div className="overflow-x-auto">
                    <table className="board-pack-table w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
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
                            Owner
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          reportScorecardRows.map(
                            (
                              row,
                            ) => (
                              <tr
                                key={
                                  row.target.id
                                }
                                className="border-b last:border-0"
                              >
                                <th className="px-4 py-3 text-left">
                                  {
                                    kpiMetricDefinition(
                                      row.target.metricCode,
                                    ).label
                                  }
                                </th>

                                <td className={`px-4 py-3 font-semibold ${
                                  row.status ===
                                    "OFF_TRACK"
                                    ?
                                      "text-destructive"
                                    :
                                  row.status ===
                                    "AT_RISK"
                                    ?
                                      "text-amber-700 dark:text-amber-400"
                                    :
                                  row.status ===
                                    "ON_TRACK"
                                    ?
                                      "text-emerald-700 dark:text-emerald-400"
                                    :
                                      "text-muted-foreground"
                                }`}>
                                  {
                                    row.status
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    scorecardValue({
                                      metric:
                                        row.target.metricCode,

                                      value:
                                        row.target.targetValue,

                                      currency,
                                    })
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    scorecardValue({
                                      metric:
                                        row.target.metricCode,

                                      value:
                                        row.currentValue,

                                      currency,
                                    })
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    scorecardValue({
                                      metric:
                                        row.target.metricCode,

                                      value:
                                        row.gap,

                                      currency,
                                    })
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    row.target
                                      .ownerName ??
                                    "—"
                                  }
                                </td>
                              </tr>
                            ),
                          )
                        }
                      </tbody>
                    </table>
                  </div>
                )
          }
        </section>

        <section className="rounded-xl border bg-background">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">
              Material variance review
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Material and review-level Actual-versus-Forecast movements for {
                reportPeriod
              }.
            </p>
          </div>

          {
            materialVarianceRows.length ===
            0
              ?
                (
                  <div className="p-8 text-sm text-muted-foreground">
                    No material or review-level variance is available for this reporting period.
                  </div>
                )
              :
                (
                  <div className="overflow-x-auto">
                    <table className="board-pack-table w-full min-w-[960px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left">
                            Metric
                          </th>

                          <th className="px-4 py-3 text-right">
                            Actual
                          </th>

                          <th className="px-4 py-3 text-right">
                            Forecast
                          </th>

                          <th className="px-4 py-3 text-right">
                            Variance
                          </th>

                          <th className="px-4 py-3 text-right">
                            Variance %
                          </th>

                          <th className="px-4 py-3 text-left">
                            Materiality
                          </th>

                          <th className="px-4 py-3 text-left">
                            Management explanation
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          materialVarianceRows.map(
                            (
                              row,
                            ) => (
                              <tr
                                key={
                                  row.key
                                }
                                className="border-b align-top last:border-0"
                              >
                                <th className="px-4 py-3 text-left">
                                  {
                                    varianceMetricDefinition(
                                      row.metricCode,
                                    ).label
                                  }
                                </th>

                                <td className="px-4 py-3 text-right">
                                  {
                                    varianceValue({
                                      metric:
                                        row.metricCode,

                                      value:
                                        row.actual,

                                      currency,
                                    })
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    varianceValue({
                                      metric:
                                        row.metricCode,

                                      value:
                                        row.forecast,

                                      currency,
                                    })
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    varianceValue({
                                      metric:
                                        row.metricCode,

                                      value:
                                        row.variance,

                                      currency,
                                    })
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    percent(
                                      row.varianceRate,
                                    )
                                  }
                                </td>

                                <td className={`px-4 py-3 font-semibold ${
                                  row.materiality ===
                                    "MATERIAL"
                                    ?
                                      "text-destructive"
                                    :
                                      "text-amber-700 dark:text-amber-400"
                                }`}>
                                  {
                                    row.materiality
                                  }
                                </td>

                                <td className="max-w-lg px-4 py-3 text-xs leading-5">
                                  {
                                    row.commentary
                                      ?
                                        (
                                          <>
                                            <p className="font-medium">
                                              {
                                                row.commentary.causeCode
                                              }
                                              {" · "}
                                              {
                                                row.commentary.varianceNature
                                              }
                                            </p>

                                            <p className="mt-1 text-muted-foreground">
                                              {
                                                row.commentary.explanation
                                              }
                                            </p>
                                          </>
                                        )
                                      :
                                        (
                                          <span className="font-semibold text-destructive">
                                            No explanation recorded
                                          </span>
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
                )
          }
        </section>

        <section className="board-pack-break-before rounded-xl border bg-background">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">
              Management action register
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Highest-priority unresolved actions from the Decision Center.
            </p>
          </div>

          {
            openActions.length ===
            0
              ?
                (
                  <div className="p-8 text-sm text-muted-foreground">
                    No unresolved management actions.
                  </div>
                )
              :
                (
                  <div className="overflow-x-auto">
                    <table className="board-pack-table w-full min-w-[860px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left">
                            Priority
                          </th>

                          <th className="px-4 py-3 text-left">
                            Action
                          </th>

                          <th className="px-4 py-3 text-left">
                            Status
                          </th>

                          <th className="px-4 py-3 text-left">
                            Owner
                          </th>

                          <th className="px-4 py-3 text-left">
                            Due
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          openActions.map(
                            (
                              action,
                            ) => (
                              <tr
                                key={
                                  action.id
                                }
                                className="border-b last:border-0"
                              >
                                <td className={`px-4 py-3 font-semibold ${
                                  action.priority ===
                                    "CRITICAL"
                                    ?
                                      "text-destructive"
                                    :
                                  action.priority ===
                                    "HIGH"
                                    ?
                                      "text-amber-700 dark:text-amber-400"
                                    :
                                      ""
                                }`}>
                                  {
                                    action.priority
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    action.title
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    action.status
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    action.ownerName ??
                                    "—"
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    action.dueDate
                                      ?
                                        new Date(
                                          action.dueDate,
                                        ).toLocaleDateString()
                                      :
                                        "—"
                                  }
                                </td>
                              </tr>
                            ),
                          )
                        }
                      </tbody>
                    </table>
                  </div>
                )
          }
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="board-pack-avoid-break rounded-xl border bg-background p-5">
            <h2 className="text-xl font-semibold">
              Financial close
            </h2>

            {
              reportClose
                ?
                  (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          Reporting period
                        </span>

                        <span className="font-medium">
                          {
                            reportClose.periodKey
                          }
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          Status
                        </span>

                        <span className={`font-semibold ${
                          reportClose.status ===
                            "CLOSED"
                            ?
                              "text-emerald-700 dark:text-emerald-400"
                            :
                              "text-amber-700 dark:text-amber-400"
                        }`}>
                          {
                            reportClose.status
                          }
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          Close cycle
                        </span>

                        <span>
                          {
                            reportClose.closeSequence
                          }
                        </span>
                      </div>
                    </div>
                  )
                :
                  (
                    <p className="mt-4 text-sm text-muted-foreground">
                      No Actual period exists for this reporting month.
                    </p>
                  )
            }
          </article>

          <article className="board-pack-avoid-break rounded-xl border bg-background p-5">
            <h2 className="text-xl font-semibold">
              Audit governance
            </h2>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Events
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {
                    auditSummary.total
                  }
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Warning
                </p>

                <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-400">
                  {
                    auditSummary.warning
                  }
                </p>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">
                  Critical
                </p>

                <p className="mt-1 text-xl font-semibold text-destructive">
                  {
                    auditSummary.critical
                  }
                </p>
              </div>
            </div>
          </article>
        </section>

        {
          latestReview &&
          latestReviewComparison
            ?
              (
                <section className="board-pack-break-before rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-xl font-semibold">
                      Movement since latest frozen executive review
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {
                        latestReview.periodKey
                      }
                      {" · "}
                      {
                        latestReview.title
                      }
                      {" · Model "}
                      {
                        latestReview.modelVersion
                      }
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="board-pack-table w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left">
                            KPI
                          </th>

                          <th className="px-4 py-3 text-right">
                            Frozen
                          </th>

                          <th className="px-4 py-3 text-right">
                            Live
                          </th>

                          <th className="px-4 py-3 text-right">
                            Movement
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left">
                            Revenue variance
                          </th>

                          <td className="px-4 py-3 text-right">
                            {
                              percent(
                                latestReviewComparison
                                  .revenueVarianceRate
                                  .frozen,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              percent(
                                latestReviewComparison
                                  .revenueVarianceRate
                                  .live,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              percent(
                                latestReviewComparison
                                  .revenueVarianceRate
                                  .delta,
                              )
                            }
                          </td>
                        </tr>

                        <tr className="border-b">
                          <th className="px-4 py-3 text-left">
                            Forecast accuracy
                          </th>

                          <td className="px-4 py-3 text-right">
                            {
                              percent(
                                latestReviewComparison
                                  .forecastAccuracyScore
                                  .frozen,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              percent(
                                latestReviewComparison
                                  .forecastAccuracyScore
                                  .live,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              percent(
                                latestReviewComparison
                                  .forecastAccuracyScore
                                  .delta,
                              )
                            }
                          </td>
                        </tr>

                        <tr className="border-b">
                          <th className="px-4 py-3 text-left">
                            Liquidity risk score
                          </th>

                          <td className="px-4 py-3 text-right">
                            {
                              numberValue(
                                latestReviewComparison
                                  .liquidityRiskScore
                                  .frozen,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              numberValue(
                                latestReviewComparison
                                  .liquidityRiskScore
                                  .live,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              numberValue(
                                latestReviewComparison
                                  .liquidityRiskScore
                                  .delta,
                              )
                            }
                          </td>
                        </tr>

                        <tr>
                          <th className="px-4 py-3 text-left">
                            Capital need
                          </th>

                          <td className="px-4 py-3 text-right">
                            {
                              money(
                                latestReviewComparison
                                  .capitalNeed
                                  .frozen,
                                currency,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              money(
                                latestReviewComparison
                                  .capitalNeed
                                  .live,
                                currency,
                              )
                            }
                          </td>

                          <td className="px-4 py-3 text-right">
                            {
                              money(
                                latestReviewComparison
                                  .capitalNeed
                                  .delta,
                                currency,
                              )
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              )
            :
              null
        }

        <section className="board-pack-avoid-break rounded-xl border bg-muted/20 p-5">
          <h2 className="font-semibold">
            Reporting integrity
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This board pack is a read-only reporting composition. It reuses the authoritative VentureScope forecast, Actuals, Board Room, Scorecard, Variance Review, Financial Close, Decision Center, Risk Center, Capital Planning, and Activity Center authorities. Generating or printing this pack does not mutate any underlying project state.
          </p>
        </section>
      </div>
    </>
  );
}
