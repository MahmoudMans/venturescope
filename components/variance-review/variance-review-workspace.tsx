"use client";

import Link from "next/link";

import { ScrollRegion } from "@/components/ui/scroll-region";
import { ConfirmAction } from "@/components/workspaces/confirm-action";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PendingButton,
} from "@/components/forms/pending-button";

import {
  normalizeForecastCsv,
} from "@/lib/finance/analytics/csv";

import {
  calculateVarianceReview,
} from "@/lib/finance/variance-review/calculations";

import {
  VARIANCE_METRICS,
  varianceMetricDefinition,
} from "@/lib/finance/variance-review/metrics";

import {
  VARIANCE_CAUSE_CODES,
  VARIANCE_COMMENTARY_STATUSES,
  VARIANCE_NATURES,
  type VarianceCommentaryView,
  type VarianceFavorability,
  type VarianceMateriality,
  type VarianceMetricCode,
  type VarianceReviewRow,
} from "@/lib/finance/variance-review/types";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import {
  deleteVarianceCommentaryAction,
  saveVarianceCommentaryAction,
} from "@/app/(app)/projects/[projectId]/variance-review/actions";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

  actuals:
    ActualFinancialPeriod[];

  commentaries:
    VarianceCommentaryView[];
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


function metricValue({
  metric,
  value,
  currency,
}: {
  metric:
    VarianceMetricCode;

  value:
    number |
    null;

  currency:
    string;
}): string {
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


function favorabilityTone(
  value:
    VarianceFavorability,
): string {
  switch (
    value
  ) {
    case "FAVORABLE":
      return "text-success";

    case "UNFAVORABLE":
      return "text-destructive";

    case "NEUTRAL":
    case "UNAVAILABLE":
      return "text-muted-foreground";
  }
}


function materialityTone(
  value:
    VarianceMateriality,
): string {
  switch (
    value
  ) {
    case "MATERIAL":
      return "text-destructive";

    case "REVIEW":
      return "text-warning";

    case "IMMATERIAL":
    case "UNAVAILABLE":
      return "text-muted-foreground";
  }
}


function commentaryStatusTone(
  status:
    string,
): string {
  switch (
    status
  ) {
    case "RESOLVED":
      return "text-success";

    case "MONITORING":
      return "text-warning";

    case "OPEN":
      return "text-destructive";

    case "ACCEPTED":
      return "text-info";

    default:
      return "text-muted-foreground";
  }
}


function metricLabel(
  row:
    VarianceReviewRow,
): string {
  return varianceMetricDefinition(
    row.metricCode,
  ).label;
}


export function VarianceReviewWorkspace({
  projectId,
  currency,
  editable,
  actuals,
  commentaries,
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


  const latestActualPeriod =
    actuals[
      actuals.length -
      1
    ]?.period ??
    "ALL";


  const [
    periodFilter,
    setPeriodFilter,
  ] =
    useState(
      latestActualPeriod,
    );


  const [
    metricFilter,
    setMetricFilter,
  ] =
    useState<
      VarianceMetricCode |
      "ALL"
    >(
      "ALL",
    );


  const [
    showMaterialOnly,
    setShowMaterialOnly,
  ] =
    useState(
      false,
    );


  const [
    selectedKey,
    setSelectedKey,
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
            controller.signal.aborted
          ) {
            return;
          }


          setError(
            cause instanceof Error
              ?
                cause.message
              :
                "Unable to load variance-review data.",
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


  const review =
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


  const selectedRow =
    useMemo(
      () =>
        review.rows.find(
          (
            row,
          ) =>
            row.key ===
            selectedKey,
        ) ??
        null,
      [
        review.rows,
        selectedKey,
      ],
    );


  const availablePeriods =
    useMemo(
      () =>
        [
          ...new Set(
            review.rows.map(
              (
                row,
              ) =>
                row.periodKey,
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
        review.rows,
      ],
    );


  const filteredRows =
    useMemo(
      () =>
        review.rows.filter(
          (
            row,
          ) =>
            (
              periodFilter ===
                "ALL" ||
              row.periodKey ===
                periodFilter
            ) &&
            (
              metricFilter ===
                "ALL" ||
              row.metricCode ===
                metricFilter
            ) &&
            (
              !showMaterialOnly ||
              row.materiality ===
                "MATERIAL"
            ),
        ),
      [
        review.rows,
        periodFilter,
        metricFilter,
        showMaterialOnly,
      ],
    );


  if (
    loading
  ) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {
            Array.from({
              length:
                5,
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
            Material variances
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              review.summary
                .material
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Unexplained material
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            review.summary
              .materialUnexplained >
            0
              ?
                "text-destructive"
              :
                "text-success"
          }`}>
            {
              review.summary
                .materialUnexplained
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Unfavorable
          </p>

          <p className="mt-2 text-3xl font-semibold text-destructive">
            {
              review.summary
                .unfavorable
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Open / monitoring
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              review.summary
                .openCommentaries
            }
            {" / "}
            {
              review.summary
                .monitoringCommentaries
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resolved
          </p>

          <p className="mt-2 text-3xl font-semibold text-success">
            {
              review.summary
                .resolvedCommentaries
            }
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-background p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-medium">
              Period
            </span>

            <select
              value={
                periodFilter
              }
              onChange={(
                event,
              ) => {
                setPeriodFilter(
                  event.target.value,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All periods
              </option>

              {
                availablePeriods.map(
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

          <label className="space-y-2">
            <span className="text-xs font-medium">
              Metric
            </span>

            <select
              value={
                metricFilter
              }
              onChange={(
                event,
              ) => {
                setMetricFilter(
                  event.target.value as
                    VarianceMetricCode |
                    "ALL",
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All metrics
              </option>

              {
                VARIANCE_METRICS.map(
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

          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={
                showMaterialOnly
              }
              onChange={(
                event,
              ) => {
                setShowMaterialOnly(
                  event.target.checked,
                );
              }}
            />

            <span className="text-sm">
              Material only
            </span>
          </label>

          <div className="flex items-end">
            <p className="pb-2 text-sm text-muted-foreground">
              {
                filteredRows.length
              } variance rows
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Monthly variance register
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Variance convention is Actual minus Forecast. Favorability accounts for whether a metric benefits from being higher or lower.
          </p>
        </div>

        {
          filteredRows.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No matched Actual-versus-Forecast rows satisfy the selected filters.
                </div>
              )
            :
              (
                <ScrollRegion label="Monthly variance register">
                  <table className="w-full min-w-[1500px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Period
                        </th>

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
                          Favorability
                        </th>

                        <th className="px-4 py-3 text-left">
                          Materiality
                        </th>

                        <th className="px-4 py-3 text-left">
                          Commentary
                        </th>

                        <th className="px-4 py-3 text-left">
                          Owner
                        </th>

                        <th className="px-4 py-3 text-left">
                          Recovery
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
                        filteredRows.map(
                          (
                            row,
                          ) => (
                            <tr
                              key={
                                row.key
                              }
                              className="border-b align-top last:border-0"
                            >
                              <td className="px-4 py-3 font-medium">
                                {
                                  row.periodKey
                                }
                              </td>

                              <th className="px-4 py-3 text-left">
                                {
                                  metricLabel(
                                    row,
                                  )
                                }
                              </th>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  metricValue({
                                    metric:
                                      row.metricCode,

                                    value:
                                      row.actual,

                                    currency,
                                  })
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  metricValue({
                                    metric:
                                      row.metricCode,

                                    value:
                                      row.forecast,

                                    currency,
                                  })
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  metricValue({
                                    metric:
                                      row.metricCode,

                                    value:
                                      row.variance,

                                    currency,
                                  })
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  percent(
                                    row.varianceRate,
                                  )
                                }
                              </td>

                              <td className={`px-4 py-3 font-medium ${favorabilityTone(
                                row.favorability,
                              )}`}>
                                {
                                  row.favorability
                                }
                              </td>

                              <td className={`px-4 py-3 font-medium ${materialityTone(
                                row.materiality,
                              )}`}>
                                {
                                  row.materiality
                                }
                              </td>

                              <td className="max-w-sm px-4 py-3">
                                {
                                  row.commentary
                                    ?
                                      (
                                        <>
                                          <p className={`text-xs font-semibold ${commentaryStatusTone(
                                            row.commentary.status,
                                          )}`}>
                                            {
                                              row.commentary.status
                                            }
                                            {" · "}
                                            {
                                              row.commentary.causeCode
                                            }
                                          </p>

                                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                            {
                                              row.commentary.explanation
                                            }
                                          </p>
                                        </>
                                      )
                                    :
                                      (
                                        <span className="text-xs text-muted-foreground">
                                          Not explained
                                        </span>
                                      )
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  row.commentary
                                    ?.ownerName ??
                                  "—"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  row.commentary
                                    ?.recoveryPeriodKey ??
                                  "—"
                                }
                              </td>

                              {
                                editable
                                  ?
                                    (
                                      <td className="px-4 py-3">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedKey(
                                              row.key,
                                            );


                                            document
                                              .getElementById(
                                                "variance-commentary-editor",
                                              )
                                              ?.scrollIntoView({
                                                behavior:
                                                  "smooth",

                                                block:
                                                  "start",
                                              });
                                          }}
                                          className="touch-target rounded-lg border px-3 py-2 text-xs font-medium"
                                        >
                                          {
                                            row.commentary
                                              ?
                                                "Edit explanation"
                                              :
                                                "Explain"
                                          }
                                        </button>
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
                </ScrollRegion>
              )
        }
      </section>

      {
        editable &&
        selectedRow
          ?
            (
              <section
                id="variance-commentary-editor"
                className="rounded-xl border bg-background p-5 sm:p-6"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Management explanation
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      {
                        selectedRow.periodKey
                      }
                      {" · "}
                      {
                        metricLabel(
                          selectedRow,
                        )
                      }
                    </h2>

                    <p className={`mt-2 text-sm font-medium ${favorabilityTone(
                      selectedRow.favorability,
                    )}`}>
                      {
                        selectedRow.favorability
                      }
                      {" · "}
                      {
                        selectedRow.materiality
                      }
                      {" · "}
                      {
                        percent(
                          selectedRow.varianceRate,
                        )
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKey(
                        null,
                      );
                    }}
                    className="touch-target rounded-lg border px-3 py-2 text-sm"
                  >
                    Close
                  </button>
                </div>

                <form
                  key={`${selectedRow.key}-${selectedRow.commentary?.updatedAt ?? "new"}`}
                  action={
                    saveVarianceCommentaryAction
                  }
                  className="mt-6 grid gap-4 sm:grid-cols-2"
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
                    name="periodKey"
                    value={
                      selectedRow.periodKey
                    }
                  />

                  <input
                    type="hidden"
                    name="metricCode"
                    value={
                      selectedRow.metricCode
                    }
                  />

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Root cause
                    </span>

                    <select
                      name="causeCode"
                      defaultValue={
                        selectedRow.commentary
                          ?.causeCode ??
                        "OTHER"
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        VARIANCE_CAUSE_CODES.map(
                          (
                            cause,
                          ) => (
                            <option
                              key={
                                cause
                              }
                              value={
                                cause
                              }
                            >
                              {
                                cause
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Variance nature
                    </span>

                    <select
                      name="varianceNature"
                      defaultValue={
                        selectedRow.commentary
                          ?.varianceNature ??
                        "UNKNOWN"
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        VARIANCE_NATURES.map(
                          (
                            nature,
                          ) => (
                            <option
                              key={
                                nature
                              }
                              value={
                                nature
                              }
                            >
                              {
                                nature
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Management explanation
                    </span>

                    <textarea
                      required
                      minLength={
                        5
                      }
                      maxLength={
                        2000
                      }
                      rows={
                        5
                      }
                      name="explanation"
                      defaultValue={
                        selectedRow.commentary
                          ?.explanation ??
                        ""
                      }
                      placeholder="What caused this variance and why did performance differ from forecast?"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Corrective action
                    </span>

                    <textarea
                      maxLength={
                        2000
                      }
                      rows={
                        4
                      }
                      name="correctiveAction"
                      defaultValue={
                        selectedRow.commentary
                          ?.correctiveAction ??
                        ""
                      }
                      placeholder="What management action is being taken?"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
                        selectedRow.commentary
                          ?.ownerName ??
                        ""
                      }
                      placeholder="Commercial lead"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Expected recovery
                    </span>

                    <input
                      type="month"
                      name="recoveryPeriodKey"
                      defaultValue={
                        selectedRow.commentary
                          ?.recoveryPeriodKey ??
                        ""
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Review status
                    </span>

                    <select
                      name="status"
                      defaultValue={
                        selectedRow.commentary
                          ?.status ??
                        "OPEN"
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        VARIANCE_COMMENTARY_STATUSES.map(
                          (
                            status,
                          ) => (
                            <option
                              key={
                                status
                              }
                              value={
                                status
                              }
                            >
                              {
                                status
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
                  </label>

                  <div className="flex items-end">
                    <PendingButton
                      className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                    >
                      Save explanation
                    </PendingButton>
                  </div>
                </form>

                {
                  selectedRow.commentary
                    ?
                      (
                        <div className="mt-4">
                          <ConfirmAction
                            action={deleteVarianceCommentaryAction}
                            fields={{ projectId, commentaryId: selectedRow.commentary.id }}
                            title="Delete this explanation?"
                            description="The written explanation for this row is removed. The forecast and the actuals are not changed."
                            confirmLabel="Delete explanation"
                            triggerVariant="outline"
                            triggerClassName="text-destructive hover:text-destructive"
                          >
                            Delete explanation
                          </ConfirmAction>
                        </div>
                      )
                    :
                      null
                }
              </section>
            )
          :
            null
      }

      {
        !editable
          ?
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Variances and management explanations are visible, but creating or changing commentary requires Editor permission.
              </section>
            )
          :
            null
      }

      <section className="flex flex-wrap gap-2 rounded-xl border bg-muted/20 p-5">
        <Link
          href={`/projects/${projectId}/actuals`}
          className="touch-link rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Actuals
        </Link>

        <Link
          href={`/projects/${projectId}/forecast-accuracy`}
          className="touch-link rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Forecast Accuracy
        </Link>

        <Link
          href={`/projects/${projectId}/scorecard`}
          className="touch-link rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Scorecard
        </Link>

        <Link
          href={`/projects/${projectId}/decision-center`}
          className="touch-link rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Decision Center
        </Link>

        <Link
          href={`/projects/${projectId}/board-room`}
          className="touch-link rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Board Room
        </Link>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Variance commentary is management interpretation attached to observed Actual-versus-Forecast performance. It does not rewrite Actuals, forecasts, scenarios, targets, baselines, risk policies, or immutable model revisions.
      </p>
    </div>
  );
}
