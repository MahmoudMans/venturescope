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

import type {
  ExecutiveActionState,
  ExecutiveReviewView,
  ReviewComparisonMetric,
} from "@/lib/finance/board-room/types";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import {
  createExecutiveReviewAction,
} from "@/app/(app)/projects/[projectId]/board-room/actions";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

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

  actionStates:
    ExecutiveActionState[];

  reviews:
    ExecutiveReviewView[];

  liveCapturedAt:
    string;
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


function signedPercent(
  metric:
    ReviewComparisonMetric,
): string {
  if (
    metric.delta ===
    null
  ) {
    return "—";
  }


  const formatted =
    percent(
      Math.abs(
        metric.delta,
      ),
    );


  if (
    metric.delta >
    0
  ) {
    return `+${formatted}`;
  }


  if (
    metric.delta <
    0
  ) {
    return `-${formatted}`;
  }


  return formatted;
}


function signedNumber(
  metric:
    ReviewComparisonMetric,
): string {
  if (
    metric.delta ===
    null
  ) {
    return "—";
  }


  return metric.delta >
    0
    ?
      `+${metric.delta}`
    :
      String(
        metric.delta,
      );
}


function signedMoney(
  metric:
    ReviewComparisonMetric,
  currency:
    string,
): string {
  if (
    metric.delta ===
    null
  ) {
    return "—";
  }


  const formatted =
    money(
      Math.abs(
        metric.delta,
      ),
      currency,
    );


  return metric.delta >
    0
    ?
      `+${formatted}`
    :
    metric.delta <
      0
      ?
        `-${formatted}`
      :
        formatted;
}


function riskTone(
  level:
    string,
): string {
  switch (
    level
  ) {
    case "CRITICAL":
    case "HIGH":
      return "text-destructive";

    case "MODERATE":
      return "text-amber-700 dark:text-amber-400";

    default:
      return "text-emerald-700 dark:text-emerald-400";
  }
}


export function BoardRoomWorkspace({
  projectId,
  currency,
  editable,
  actuals,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
  actionStates,
  reviews,
  liveCapturedAt,
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
    selectedReviewId,
    setSelectedReviewId,
  ] =
    useState(
      reviews[
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
            controller.signal.aborted
          ) {
            return;
          }


          setError(
            cause instanceof Error
              ?
                cause.message
              :
                "Unable to load Board Room financial intelligence.",
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
            liveCapturedAt,

          actuals,

          forecasts,

          riskPolicy,

          latestActualPeriod,

          latestActualCash,

          actions:
            actionStates,
        }),
      [
        liveCapturedAt,
        actuals,
        forecasts,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
        actionStates,
      ],
    );


  const selectedReview =
    useMemo(
      () =>
        reviews.find(
          (
            review,
          ) =>
            review.id ===
            selectedReviewId,
        ) ??
        reviews[
          0
        ] ??
        null,
      [
        reviews,
        selectedReviewId,
      ],
    );


  const comparison =
    useMemo(
      () =>
        selectedReview
          ?
            compareExecutiveReview(
              selectedReview
                .snapshot,
              liveSnapshot,
            )
          :
            null,
      [
        selectedReview,
        liveSnapshot,
      ],
    );


  const defaultPeriod =
    latestActualPeriod ??
    liveCapturedAt.slice(
      0,
      7,
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-background p-4">
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

          <p className="mt-2 text-xs text-muted-foreground">
            Historical forecast reliability.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Liquidity risk
          </p>

          <p className={`mt-2 text-2xl font-semibold ${riskTone(
            liveSnapshot
              .kpis
              .liquidityRiskLevel,
          )}`}>
            {
              liveSnapshot
                .kpis
                .liquidityRiskLevel
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Risk score {
              liveSnapshot
                .kpis
                .liquidityRiskScore
            } / 100
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
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

          <p className="mt-2 text-xs text-muted-foreground">
            Deterministic downside funding gap.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
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

          <p className="mt-2 text-xs text-muted-foreground">
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

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Revenue vs plan
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            EBITDA vs plan
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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

      <section className="rounded-xl border bg-background">
        <div className="flex flex-col justify-between gap-4 border-b p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-semibold">
              Live executive agenda
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current Decision Center signals that should shape the next management or board discussion.
            </p>
          </div>

          <Link
            href={`/projects/${projectId}/decision-center`}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
          >
            Open Decision Center
          </Link>
        </div>

        {
          liveSnapshot
            .signals
            .length ===
            0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No material executive exception is currently detected.
                </div>
              )
            :
              (
                <div className="divide-y">
                  {
                    liveSnapshot
                      .signals
                      .map(
                        (
                          signal,
                        ) => (
                          <article
                            key={
                              signal.code
                            }
                            className="p-5"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded border px-2 py-1 text-xs font-semibold">
                                {
                                  signal.severity
                                }
                              </span>

                              <span className="text-xs text-muted-foreground">
                                {
                                  signal.category
                                }
                              </span>
                            </div>

                            <h3 className="mt-3 font-semibold">
                              {
                                signal.title
                              }
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {
                                signal.message
                              }
                            </p>

                            <p className="mt-2 text-sm">
                              {
                                signal.actionHint
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

      {
        editable
          ?
            (
              <section className="rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="text-lg font-semibold">
                  Freeze executive review
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Capture the current executive state as an immutable management or board review. Future forecast changes will not rewrite this historical snapshot.
                </p>

                <form
                  action={
                    createExecutiveReviewAction
                  }
                  className="mt-5 grid gap-4 sm:grid-cols-2"
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
                      Review period
                    </span>

                    <input
                      type="month"
                      required
                      name="periodKey"
                      defaultValue={
                        defaultPeriod
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Review title
                    </span>

                    <input
                      required
                      minLength={
                        3
                      }
                      maxLength={
                        120
                      }
                      name="title"
                      defaultValue={
                        `${defaultPeriod} Executive Review`
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Management commentary
                    </span>

                    <textarea
                      name="commentary"
                      maxLength={
                        4000
                      }
                      rows={
                        6
                      }
                      placeholder="Key developments, management interpretation, decisions required, and priorities for the next period."
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={
                        !forecastCsv
                      }
                      className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Freeze executive review
                    </button>
                  </div>
                </form>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Frozen reviews and live Board Room intelligence are visible, but creating a new executive snapshot requires Editor permission.
              </section>
            )
      }

      {
        reviews.length ===
        0
          ?
            (
              <section className="rounded-xl border border-dashed p-8">
                <h2 className="font-semibold">
                  No frozen executive review yet
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Freeze the current executive state to establish a historical management record that can later be compared with the live financial model.
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
                        Historical management record
                      </p>

                      <h2 className="mt-1 text-xl font-semibold">
                        Frozen review vs live model
                      </h2>
                    </div>

                    <label className="space-y-2">
                      <span className="text-xs font-medium">
                        Frozen review
                      </span>

                      <select
                        value={
                          selectedReview
                            ?.id ??
                          ""
                        }
                        onChange={(
                          event,
                        ) => {
                          setSelectedReviewId(
                            event.target
                              .value,
                          );
                        }}
                        className="h-10 min-w-72 rounded-lg border bg-background px-3 text-sm"
                      >
                        {
                          reviews.map(
                            (
                              review,
                            ) => (
                              <option
                                key={
                                  review.id
                                }
                                value={
                                  review.id
                                }
                              >
                                {
                                  review.periodKey
                                }
                                {" · "}
                                {
                                  review.title
                                }
                              </option>
                            ),
                          )
                        }
                      </select>
                    </label>
                  </div>

                  {
                    selectedReview
                      ?
                        (
                          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="rounded border px-2 py-1">
                              {
                                selectedReview.periodKey
                              }
                            </span>

                            <span className="rounded border px-2 py-1">
                              Model {
                                selectedReview.modelVersion
                              }
                            </span>

                            <span className="rounded border px-2 py-1">
                              {
                                new Date(
                                  selectedReview.createdAt,
                                ).toLocaleDateString()
                              }
                            </span>

                            {
                              selectedReview.createdBy
                                ?
                                  (
                                    <span className="rounded border px-2 py-1">
                                      {
                                        selectedReview.createdBy
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
                  selectedReview &&
                  comparison
                    ?
                      (
                        <>
                          <section className="overflow-hidden rounded-xl border bg-background">
                            <div className="border-b p-5">
                              <h2 className="text-lg font-semibold">
                                Executive movement since review
                              </h2>

                              <p className="mt-1 text-sm text-muted-foreground">
                                Frozen values remain unchanged; Live reflects today&apos;s VentureScope model and management-action state.
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[850px] text-sm">
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
                                      Change
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
                                          comparison
                                            .revenueVarianceRate
                                            .frozen,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        percent(
                                          comparison
                                            .revenueVarianceRate
                                            .live,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        signedPercent(
                                          comparison
                                            .revenueVarianceRate,
                                        )
                                      }
                                    </td>
                                  </tr>

                                  <tr className="border-b">
                                    <th className="px-4 py-3 text-left">
                                      EBITDA variance
                                    </th>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        percent(
                                          comparison
                                            .ebitdaVarianceRate
                                            .frozen,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        percent(
                                          comparison
                                            .ebitdaVarianceRate
                                            .live,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        signedPercent(
                                          comparison
                                            .ebitdaVarianceRate,
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
                                          comparison
                                            .forecastAccuracyScore
                                            .frozen,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        percent(
                                          comparison
                                            .forecastAccuracyScore
                                            .live,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        signedPercent(
                                          comparison
                                            .forecastAccuracyScore,
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
                                        comparison
                                          .liquidityRiskScore
                                          .frozen ??
                                        "—"
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        comparison
                                          .liquidityRiskScore
                                          .live ??
                                        "—"
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        signedNumber(
                                          comparison
                                            .liquidityRiskScore,
                                        )
                                      }
                                    </td>
                                  </tr>

                                  <tr className="border-b">
                                    <th className="px-4 py-3 text-left">
                                      Capital need
                                    </th>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        money(
                                          comparison
                                            .capitalNeed
                                            .frozen,
                                          currency,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        money(
                                          comparison
                                            .capitalNeed
                                            .live,
                                          currency,
                                        )
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        signedMoney(
                                          comparison
                                            .capitalNeed,
                                          currency,
                                        )
                                      }
                                    </td>
                                  </tr>

                                  <tr>
                                    <th className="px-4 py-3 text-left">
                                      Open actions
                                    </th>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        comparison
                                          .openActions
                                          .frozen ??
                                        "—"
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        comparison
                                          .openActions
                                          .live ??
                                        "—"
                                      }
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      {
                                        signedNumber(
                                          comparison
                                            .openActions,
                                        )
                                      }
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </section>

                          <section className="grid gap-4 lg:grid-cols-2">
                            <article className="rounded-xl border bg-background p-5">
                              <h2 className="text-lg font-semibold">
                                Frozen management commentary
                              </h2>

                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {
                                  selectedReview.commentary ??
                                  "No management commentary was recorded for this review."
                                }
                              </p>
                            </article>

                            <article className="rounded-xl border bg-background p-5">
                              <h2 className="text-lg font-semibold">
                                Frozen executive agenda
                              </h2>

                              {
                                selectedReview
                                  .snapshot
                                  .signals
                                  .length ===
                                  0
                                  ?
                                    (
                                      <p className="mt-3 text-sm text-muted-foreground">
                                        No executive signal was frozen in this review.
                                      </p>
                                    )
                                  :
                                    (
                                      <div className="mt-4 space-y-4">
                                        {
                                          selectedReview
                                            .snapshot
                                            .signals
                                            .map(
                                              (
                                                signal,
                                              ) => (
                                                <article
                                                  key={
                                                    signal.code
                                                  }
                                                  className="rounded-lg border p-4"
                                                >
                                                  <p className="text-xs font-semibold">
                                                    {
                                                      signal.severity
                                                    }
                                                    {" · "}
                                                    {
                                                      signal.category
                                                    }
                                                  </p>

                                                  <p className="mt-2 font-medium">
                                                    {
                                                      signal.title
                                                    }
                                                  </p>

                                                  <p className="mt-1 text-sm text-muted-foreground">
                                                    {
                                                      signal.message
                                                    }
                                                  </p>
                                                </article>
                                              ),
                                            )
                                        }
                                      </div>
                                    )
                              }
                            </article>
                          </section>
                        </>
                      )
                    :
                      null
                }

                <section className="overflow-hidden rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">
                      Review history
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Frozen executive reviews are retained as an append-only historical management record.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left">
                            Period
                          </th>

                          <th className="px-4 py-3 text-left">
                            Review
                          </th>

                          <th className="px-4 py-3 text-left">
                            Model
                          </th>

                          <th className="px-4 py-3 text-right">
                            Risk
                          </th>

                          <th className="px-4 py-3 text-right">
                            Capital need
                          </th>

                          <th className="px-4 py-3 text-right">
                            Open actions
                          </th>

                          <th className="px-4 py-3 text-left">
                            Created
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          reviews.map(
                            (
                              review,
                            ) => (
                              <tr
                                key={
                                  review.id
                                }
                                className="border-b last:border-0"
                              >
                                <td className="px-4 py-3 font-medium">
                                  {
                                    review.periodKey
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    review.title
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    review.modelVersion
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    review.snapshot
                                      .kpis
                                      .liquidityRiskScore
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    money(
                                      review.snapshot
                                        .kpis
                                        .capitalNeed,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {
                                    review.snapshot
                                      .actions
                                      .open
                                  }
                                </td>

                                <td className="px-4 py-3 text-muted-foreground">
                                  {
                                    new Date(
                                      review.createdAt,
                                    ).toLocaleDateString()
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
              </>
            )
      }

      <p className="text-xs leading-5 text-muted-foreground">
        Frozen executive reviews are historical management evidence. Creating a review does not alter assumptions, Actuals, financial guardrails, funding cases, management actions, forecast baselines, or immutable model revisions.
      </p>
    </div>
  );
}
