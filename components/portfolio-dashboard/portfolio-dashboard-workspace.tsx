"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  normalizeForecastCsv,
} from "@/lib/finance/analytics/csv";

import {
  buildExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/snapshot";

import {
  calculateManagementScorecard,
} from "@/lib/finance/scorecard/calculations";

import {
  buildPortfolioExecutiveDashboard,
} from "@/lib/finance/portfolio-dashboard/calculations";

import type {
  PortfolioAttentionLevel,
  PortfolioProjectSource,
} from "@/lib/finance/portfolio-dashboard/types";


type Props = {
  currentProjectId:
    string;

  accessibleProjectCount:
    number;

  generatedAt:
    string;

  projects:
    PortfolioProjectSource[];
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


function attentionTone(
  level:
    PortfolioAttentionLevel,
): string {
  switch (
    level
  ) {
    case "CRITICAL":
      return "text-destructive";

    case "REVIEW":
      return "text-warning";

    case "MONITOR":
      return "text-info";

    case "STABLE":
      return "text-success";
  }
}


function closeTone(
  status:
    string,
): string {
  switch (
    status
  ) {
    case "CLOSED":
      return "text-success";

    case "OPEN":
      return "text-warning";

    default:
      return "text-muted-foreground";
  }
}


function actionPriorityRank(
  priority:
    string,
): number {
  switch (
    priority
  ) {
    case "CRITICAL":
      return 0;

    case "HIGH":
      return 1;

    case "MEDIUM":
      return 2;

    case "LOW":
      return 3;

    default:
      return 4;
  }
}


export function PortfolioDashboardWorkspace({
  currentProjectId,
  accessibleProjectCount,
  generatedAt,
  projects,
}: Props) {
  const [
    forecastByProject,
    setForecastByProject,
  ] =
    useState<
      Record<
        string,
        string
      >
    >(
      {},
    );


  const [
    forecastErrors,
    setForecastErrors,
  ] =
    useState<
      Record<
        string,
        string
      >
    >(
      {},
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );


  const [
    search,
    setSearch,
  ] =
    useState(
      "",
    );


  const [
    attentionFilter,
    setAttentionFilter,
  ] =
    useState<
      PortfolioAttentionLevel |
      "ALL"
    >(
      "ALL",
    );


  const [
    currencyFilter,
    setCurrencyFilter,
  ] =
    useState(
      "ALL",
    );


  useEffect(
    () => {
      const controller =
        new AbortController();


      async function loadPortfolioForecasts() {
        const csv:
          Record<
            string,
            string
          > =
            {};


        const errors:
          Record<
            string,
            string
          > =
            {};


        await Promise.all(
          projects.map(
            async (
              project,
            ) => {
              try {
                const response =
                  await fetch(
                    `/api/projects/${encodeURIComponent(
                      project.id,
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
                    `HTTP ${response.status}`,
                  );
                }


                csv[
                  project.id
                ] =
                  await response.text();
              }
              catch (
                cause
              ) {
                if (
                  controller.signal.aborted
                ) {
                  return;
                }


                errors[
                  project.id
                ] =
                  cause instanceof Error
                    ?
                      cause.message
                    :
                      "Forecast unavailable";
              }
            },
          ),
        );


        if (
          controller.signal.aborted
        ) {
          return;
        }


        setForecastByProject(
          csv,
        );

        setForecastErrors(
          errors,
        );

        setLoading(
          false,
        );
      }


      void loadPortfolioForecasts();


      return () => {
        controller.abort();
      };
    },
    [
      projects,
    ],
  );


  const analytics =
    useMemo(
      () =>
        projects.map(
          (
            project,
          ) => {
            const forecastAvailable =
              Object.prototype.hasOwnProperty.call(
                forecastByProject,
                project.id,
              );


            if (
              !forecastAvailable
            ) {
              return {
                project,

                forecastAvailable:
                  false,

                liveSnapshot:
                  null,

                scorecardSummary:
                  null,
              };
            }


            const forecasts =
              normalizeForecastCsv(
                forecastByProject[
                  project.id
                ] ??
                "",
              );


            const liveSnapshot =
              buildExecutiveReviewSnapshot({
                capturedAt:
                  generatedAt,

                actuals:
                  project.actuals,

                forecasts,

                riskPolicy:
                  project.riskPolicy,

                latestActualPeriod:
                  project.latestActualPeriod,

                latestActualCash:
                  project.latestActualCash,

                actions:
                  project.actions.map(
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
              });


            const scorecard =
              calculateManagementScorecard({
                targets:
                  project.targets,

                actuals:
                  project.actuals,

                forecasts,

                riskPolicy:
                  project.riskPolicy,

                latestActualPeriod:
                  project.latestActualPeriod,

                latestActualCash:
                  project.latestActualCash,
              });


            return {
              project,

              forecastAvailable:
                true,

              liveSnapshot,

              scorecardSummary:
                scorecard.summary,
            };
          },
        ),
      [
        projects,
        forecastByProject,
        generatedAt,
      ],
    );


  const dashboard =
    useMemo(
      () =>
        buildPortfolioExecutiveDashboard(
          analytics,
        ),
      [
        analytics,
      ],
    );


  const currencies =
    useMemo(
      () =>
        [
          ...new Set(
            projects.map(
              (
                project,
              ) =>
                project.currency,
            ),
          ),
        ].sort(),
      [
        projects,
      ],
    );


  const filteredRows =
    useMemo(
      () => {
        const needle =
          search
            .trim()
            .toLowerCase();


        return dashboard.rows.filter(
          (
            row,
          ) =>
            (
              !needle ||
              [
                row.name,
                row.industry,
                row.currency,
                row.role,
                row.liquidityRiskLevel ??
                "",
              ]
                .join(
                  " ",
                )
                .toLowerCase()
                .includes(
                  needle,
                )
            ) &&
            (
              attentionFilter ===
                "ALL" ||
              row.attentionLevel ===
                attentionFilter
            ) &&
            (
              currencyFilter ===
                "ALL" ||
              row.currency ===
                currencyFilter
            ),
        );
      },
      [
        dashboard.rows,
        search,
        attentionFilter,
        currencyFilter,
      ],
    );


  const unresolvedActions =
    useMemo(
      () =>
        projects
          .flatMap(
            (
              project,
            ) =>
              project.actions
                .filter(
                  (
                    action,
                  ) =>
                    action.status !==
                      "DONE" &&
                    action.status !==
                      "DISMISSED",
                )
                .map(
                  (
                    action,
                  ) => ({
                    ...action,

                    projectId:
                      project.id,

                    projectName:
                      project.name,

                    currency:
                      project.currency,
                  }),
                ),
          )
          .sort(
            (
              left,
              right,
            ) => {
              const priority =
                actionPriorityRank(
                  left.priority,
                ) -
                actionPriorityRank(
                  right.priority,
                );


              if (
                priority !==
                0
              ) {
                return priority;
              }


              if (
                left.dueDate &&
                right.dueDate
              ) {
                return left.dueDate.localeCompare(
                  right.dueDate,
                );
              }


              if (
                left.dueDate
              ) {
                return -1;
              }


              if (
                right.dueDate
              ) {
                return 1;
              }


              return left.title.localeCompare(
                right.title,
              );
            },
          )
          .slice(
            0,
            15,
          ),
      [
        projects,
      ],
    );


  if (
    loading
  ) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {
            Array.from({
              length:
                6,
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
    <div className="space-y-8">
      {
        accessibleProjectCount >
        projects.length
          ?
            (
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                Portfolio analysis is limited to 24 projects per dashboard load. Showing {
                  projects.length
                } of {
                  accessibleProjectCount
                } accessible projects.
              </div>
            )
          :
            null
      }

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Projects
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              dashboard.summary
                .loadedProjects
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            High / critical risk
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            dashboard.summary
              .criticalHighRisk >
            0
              ?
                "text-destructive"
              :
                ""
          }`}>
            {
              dashboard.summary
                .criticalHighRisk
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Critical actions
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            dashboard.summary
              .openCriticalActions >
            0
              ?
                "text-destructive"
              :
                ""
          }`}>
            {
              dashboard.summary
                .openCriticalActions
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Off-track targets
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            dashboard.summary
              .offTrackTargets >
            0
              ?
                "text-warning"
              :
                ""
          }`}>
            {
              dashboard.summary
                .offTrackTargets
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Open periods
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              dashboard.summary
                .openFinancialPeriods
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Avg forecast accuracy
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              percent(
                dashboard.summary
                  .averageForecastAccuracy,
              )
            }
          </p>

          {
            dashboard.summary
              .forecastUnavailable >
            0
              ?
                (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {
                      dashboard.summary
                        .forecastUnavailable
                    } unavailable
                  </p>
                )
              :
                null
          }
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border bg-background p-5">
          <h2 className="text-lg font-semibold">
            Portfolio risk distribution
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Critical
              </p>

              <p className="mt-1 text-xl font-semibold text-destructive">
                {
                  dashboard.summary
                    .riskDistribution
                    .critical
                }
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                High
              </p>

              <p className="mt-1 text-xl font-semibold text-destructive">
                {
                  dashboard.summary
                    .riskDistribution
                    .high
                }
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Moderate
              </p>

              <p className="mt-1 text-xl font-semibold text-warning">
                {
                  dashboard.summary
                    .riskDistribution
                    .moderate
                }
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Low
              </p>

              <p className="mt-1 text-xl font-semibold text-success">
                {
                  dashboard.summary
                    .riskDistribution
                    .low
                }
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Unavailable
              </p>

              <p className="mt-1 text-xl font-semibold">
                {
                  dashboard.summary
                    .riskDistribution
                    .unavailable
                }
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border bg-background p-5">
          <h2 className="text-lg font-semibold">
            Forecast readiness
          </h2>

          <p className="mt-4 text-4xl font-semibold">
            {
              dashboard.summary
                .forecastReady
            }
            <span className="text-lg font-normal text-muted-foreground">
              {" / "}
              {
                dashboard.summary
                  .loadedProjects
              }
            </span>
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Portfolio analytics only classify liquidity, capital need, and forecast accuracy when the project&apos;s authenticated forecast export is available.
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Currency-separated portfolio exposure
          </h2>

          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            VentureScope does not perform FX conversion. Cash and capital requirements are aggregated only inside the same project currency.
          </p>
        </div>

        <ScrollRegion label="Currency-separated portfolio exposure">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left">
                  Currency
                </th>

                <th className="px-4 py-3 text-right">
                  Projects
                </th>

                <th className="px-4 py-3 text-right">
                  Forecast-ready
                </th>

                <th className="px-4 py-3 text-right">
                  Projects with Actual cash
                </th>

                <th className="px-4 py-3 text-right">
                  Latest Actual cash
                </th>

                <th className="px-4 py-3 text-right">
                  Modeled capital need
                </th>
              </tr>
            </thead>

            <tbody>
              {
                dashboard.currencies.map(
                  (
                    item,
                  ) => (
                    <tr
                      key={
                        item.currency
                      }
                      className="border-b last:border-0"
                    >
                      <th className="px-4 py-3 text-left">
                        {
                          item.currency
                        }
                      </th>

                      <td className="px-4 py-3 text-right">
                        {
                          item.projectCount
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          item.projectsWithForecast
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          item.projectsWithActualCash
                        }
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {
                          money(
                            item.latestActualCash,
                            item.currency,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {
                          money(
                            item.capitalNeed,
                            item.currency,
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

      <section className="rounded-xl border bg-background p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Search projects
            </span>

            <input
              value={
                search
              }
              onChange={(
                event,
              ) => {
                setSearch(
                  event.target.value,
                );
              }}
              placeholder="Name, industry, currency..."
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Attention
            </span>

            <select
              value={
                attentionFilter
              }
              onChange={(
                event,
              ) => {
                setAttentionFilter(
                  event.target.value as
                    PortfolioAttentionLevel |
                    "ALL",
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All levels
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="REVIEW">
                Review
              </option>

              <option value="MONITOR">
                Monitor
              </option>

              <option value="STABLE">
                Stable
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Currency
            </span>

            <select
              value={
                currencyFilter
              }
              onChange={(
                event,
              ) => {
                setCurrencyFilter(
                  event.target.value,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All currencies
              </option>

              {
                currencies.map(
                  (
                    currency,
                  ) => (
                    <option
                      key={
                        currency
                      }
                      value={
                        currency
                      }
                    >
                      {
                        currency
                      }
                    </option>
                  ),
                )
              }
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Project attention register
          </h2>

          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            Attention score is a management-triage indicator based on existing liquidity risk, modeled funding need, critical actions, target performance, financial-close status, forecast reliability, and data readiness. It is not a valuation or financial KPI.
          </p>
        </div>

        {
          filteredRows.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No projects match the selected filters.
                </div>
              )
            :
              (
                <ScrollRegion label="Project attention register">
                  <table className="w-full min-w-[1650px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Project
                        </th>

                        <th className="px-4 py-3 text-left">
                          Role
                        </th>

                        <th className="px-4 py-3 text-left">
                          Attention
                        </th>

                        <th className="px-4 py-3 text-left">
                          Liquidity risk
                        </th>

                        <th className="px-4 py-3 text-right">
                          Latest cash
                        </th>

                        <th className="px-4 py-3 text-right">
                          Capital need
                        </th>

                        <th className="px-4 py-3 text-right">
                          Forecast accuracy
                        </th>

                        <th className="px-4 py-3 text-right">
                          Critical actions
                        </th>

                        <th className="px-4 py-3 text-right">
                          Off-track targets
                        </th>

                        <th className="px-4 py-3 text-left">
                          Latest close
                        </th>

                        <th className="px-4 py-3 text-left">
                          Drill down
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        filteredRows.map(
                          (
                            row,
                          ) => (
                            <tr
                              key={
                                row.id
                              }
                              className={`border-b align-top last:border-0 ${
                                row.id ===
                                  currentProjectId
                                  ?
                                    "bg-muted/20"
                                  :
                                    ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="font-semibold">
                                      {
                                        row.name
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {
                                        row.industry ||
                                        "Industry not specified"
                                      }
                                      {" · "}
                                      {
                                        row.currency
                                      }
                                    </p>
                                  </div>

                                  {
                                    row.isCurrentProject
                                      ?
                                        (
                                          <span className="rounded border px-2 py-1 text-[10px] font-medium">
                                            CURRENT
                                          </span>
                                        )
                                      :
                                        null
                                  }
                                </div>
                              </td>

                              <td className="px-4 py-3">
                                {
                                  row.role
                                }
                              </td>

                              <td className="px-4 py-3">
                                <p className={`font-semibold ${attentionTone(
                                  row.attentionLevel,
                                )}`}>
                                  {
                                    row.attentionLevel
                                  }
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {
                                    row.attentionScore
                                  }
                                  /100
                                </p>
                              </td>

                              <td className="px-4 py-3">
                                {
                                  row.forecastAvailable
                                    ?
                                      (
                                        <>
                                          <p className="font-semibold">
                                            {
                                              row.liquidityRiskLevel ??
                                              "—"
                                            }
                                          </p>

                                          <p className="mt-1 text-xs text-muted-foreground">
                                            Score {
                                              row.liquidityRiskScore ??
                                              "—"
                                            }
                                          </p>
                                        </>
                                      )
                                    :
                                      (
                                        <span
                                          title={
                                            forecastErrors[
                                              row.id
                                            ] ??
                                            "Forecast unavailable"
                                          }
                                          className="text-xs text-muted-foreground"
                                        >
                                          Forecast unavailable
                                        </span>
                                      )
                                }
                              </td>

                              <td className="px-4 py-3 text-right font-semibold">
                                {
                                  money(
                                    row.latestActualCash,
                                    row.currency,
                                  )
                                }
                              </td>

                              <td className="px-4 py-3 text-right font-semibold">
                                {
                                  row.forecastAvailable
                                    ?
                                      money(
                                        row.capitalNeed,
                                        row.currency,
                                      )
                                    :
                                      "—"
                                }
                              </td>

                              <td className="px-4 py-3 text-right">
                                {
                                  percent(
                                    row.forecastAccuracy,
                                  )
                                }
                              </td>

                              <td className={`px-4 py-3 text-right font-semibold ${
                                row.criticalOpenActions >
                                0
                                  ?
                                    "text-destructive"
                                  :
                                    ""
                              }`}>
                                {
                                  row.criticalOpenActions
                                }
                              </td>

                              <td className={`px-4 py-3 text-right font-semibold ${
                                row.offTrackTargets >
                                0
                                  ?
                                    "text-warning"
                                  :
                                    ""
                              }`}>
                                {
                                  row.offTrackTargets
                                }
                              </td>

                              <td className={`px-4 py-3 font-semibold ${closeTone(
                                row.latestPeriodCloseStatus,
                              )}`}>
                                {
                                  row.latestActualPeriod
                                    ?
                                      `${row.latestActualPeriod} · ${row.latestPeriodCloseStatus}`
                                    :
                                      "NO ACTUALS"
                                }
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <Link
                                    href={`/projects/${row.id}/dashboard`}
                                    className="touch-link rounded border px-2 py-1 text-xs"
                                  >
                                    Dashboard
                                  </Link>

                                  <Link
                                    href={`/projects/${row.id}/risk-center`}
                                    className="touch-link rounded border px-2 py-1 text-xs"
                                  >
                                    Risk
                                  </Link>

                                  <Link
                                    href={`/projects/${row.id}/capital-planning`}
                                    className="touch-link rounded border px-2 py-1 text-xs"
                                  >
                                    Capital
                                  </Link>

                                  <Link
                                    href={`/projects/${row.id}/board-pack`}
                                    className="touch-link rounded border px-2 py-1 text-xs"
                                  >
                                    Board Pack
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ),
                        )
                      }
                    </tbody>
                  </table>
                </ScrollRegion>
              )
        }
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Cross-project management actions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Highest-priority unresolved actions across the loaded portfolio.
          </p>
        </div>

        {
          unresolvedActions.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No unresolved management actions are present.
                </div>
              )
            :
              (
                <ScrollRegion label="Cross-project management actions">
                  <table className="w-full min-w-[1050px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Priority
                        </th>

                        <th className="px-4 py-3 text-left">
                          Project
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

                        <th className="px-4 py-3 text-left">
                          Open
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        unresolvedActions.map(
                          (
                            action,
                          ) => (
                            <tr
                              key={`${action.projectId}:${action.id}`}
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
                                    "text-warning"
                                  :
                                    ""
                              }`}>
                                {
                                  action.priority
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  action.projectName
                                }
                              </td>

                              <td className="px-4 py-3 font-medium">
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

                              <td className="px-4 py-3">
                                <Link
                                  href={`/projects/${action.projectId}/decision-center`}
                                  className="touch-link rounded border px-2 py-1 text-xs"
                                >
                                  Decision Center
                                </Link>
                              </td>
                            </tr>
                          ),
                        )
                      }
                    </tbody>
                  </table>
                </ScrollRegion>
              )
        }
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Portfolio integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          The Portfolio Dashboard is a read-only cross-project composition. Each project&apos;s authenticated forecast export and existing financial authorities remain authoritative. Currency amounts are never combined across currencies because VentureScope intentionally performs no foreign-exchange conversion.
        </p>
      </section>
    </div>
  );
}
