"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  markAllAlertsReadAction,
  updateAlertReceiptAction,
} from "@/app/(app)/projects/[projectId]/alerts/actions";

import {
  PendingButton,
} from "@/components/forms/pending-button";

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
  calculateVarianceReview,
} from "@/lib/finance/variance-review/calculations";

import {
  buildFinancialPeriodRegister,
} from "@/lib/finance/period-close/register";

import {
  deriveProjectAlerts,
} from "@/lib/notifications/calculations";

import {
  resolveProjectAlertInbox,
} from "@/lib/notifications/receipts";

import {
  PROJECT_ALERT_CATEGORIES,
  type AlertAuditEvent,
  type AlertDecisionAction,
  type ProjectAlertCategory,
  type ProjectAlertReceiptView,
  type ProjectAlertSeverity,
  type ResolvedProjectAlert,
} from "@/lib/notifications/types";

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


type Props = {
  projectId:
    string;

  currency:
    string;

  generatedAt:
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
    AlertDecisionAction[];

  auditEvents:
    AlertAuditEvent[];

  receipts:
    ProjectAlertReceiptView[];
};


function severityTone(
  severity:
    ProjectAlertSeverity,
): string {
  switch (
    severity
  ) {
    case "CRITICAL":
      return "text-destructive";

    case "WARNING":
      return "text-warning";

    case "INFO":
      return "text-info";
  }
}


function severitySurface(
  severity:
    ProjectAlertSeverity,
): string {
  switch (
    severity
  ) {
    case "CRITICAL":
      return "bg-destructive/5";

    case "WARNING":
      return "bg-warning/5";

    case "INFO":
      return "bg-info/5";
  }
}


function formatDate(
  value:
    string |
    null,
): string {
  if (
    !value
  ) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(
    new Date(
      value,
    ),
  );
}


function ReceiptForm({
  projectId,
  item,
  operation,
  label,
}: {
  projectId:
    string;

  item:
    ResolvedProjectAlert;

  operation:
    "READ" |
    "UNREAD" |
    "DISMISS" |
    "SNOOZE_24H";

  label:
    string;
}) {
  return (
    <form
      action={
        updateAlertReceiptAction
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
        name="alertKey"
        value={
          item.alert.key
        }
      />

      <input
        type="hidden"
        name="fingerprint"
        value={
          item.alert.fingerprint
        }
      />

      <input
        type="hidden"
        name="operation"
        value={
          operation
        }
      />

      <PendingButton
        className="rounded-lg border px-2.5 py-1.5 text-xs font-medium"
      >
        {
          label
        }
      </PendingButton>
    </form>
  );
}


export function AlertInboxWorkspace({
  projectId,
  generatedAt,
  actuals,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
  targets,
  commentaries,
  periodStates,
  actions,
  auditEvents,
  receipts,
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
    severityFilter,
    setSeverityFilter,
  ] =
    useState<
      ProjectAlertSeverity |
      "ALL"
    >(
      "ALL",
    );


  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState<
      ProjectAlertCategory |
      "ALL"
    >(
      "ALL",
    );


  const [
    unreadOnly,
    setUnreadOnly,
  ] =
    useState(
      false,
    );


  const [
    showDismissed,
    setShowDismissed,
  ] =
    useState(
      false,
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
                "Unable to calculate live alerts.",
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


  const alerts =
    useMemo(
      () =>
        deriveProjectAlerts({
          projectId,

          latestActualPeriod,

          liveSnapshot,

          scorecard,

          varianceReview,

          periodRegister,

          actions,

          auditEvents,
        }),
      [
        projectId,
        latestActualPeriod,
        liveSnapshot,
        scorecard,
        varianceReview,
        periodRegister,
        actions,
        auditEvents,
      ],
    );


  const inbox =
    useMemo(
      () =>
        resolveProjectAlertInbox({
          alerts,

          receipts,

          now:
            new Date(
              generatedAt,
            ),
        }),
      [
        alerts,
        receipts,
        generatedAt,
      ],
    );


  const filtered =
    useMemo(
      () =>
        inbox.visible.filter(
          (
            item,
          ) =>
            (
              severityFilter ===
                "ALL" ||
              item.alert.severity ===
                severityFilter
            ) &&
            (
              categoryFilter ===
                "ALL" ||
              item.alert.category ===
                categoryFilter
            ) &&
            (
              !unreadOnly ||
              !item.read
            ),
        ),
      [
        inbox.visible,
        severityFilter,
        categoryFilter,
        unreadOnly,
      ],
    );


  const markAllPayload =
    JSON.stringify(
      inbox.visible.map(
        (
          item,
        ) => ({
          alertKey:
            item.alert.key,

          fingerprint:
            item.alert.fingerprint,
        }),
      ),
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Active
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              inbox.summary
                .visible
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Unread
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              inbox.summary
                .unread
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Critical
          </p>

          <p className="mt-2 text-3xl font-semibold text-destructive">
            {
              inbox.summary
                .critical
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Warning
          </p>

          <p className="mt-2 text-3xl font-semibold text-warning">
            {
              inbox.summary
                .warning
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Snoozed
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              inbox.summary
                .snoozed
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Dismissed
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              inbox.summary
                .dismissed
            }
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-background p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Severity
            </span>

            <select
              value={
                severityFilter
              }
              onChange={(
                event,
              ) => {
                setSeverityFilter(
                  event.target.value as
                    ProjectAlertSeverity |
                    "ALL",
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="WARNING">
                Warning
              </option>

              <option value="INFO">
                Info
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Category
            </span>

            <select
              value={
                categoryFilter
              }
              onChange={(
                event,
              ) => {
                setCategoryFilter(
                  event.target.value as
                    ProjectAlertCategory |
                    "ALL",
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="ALL">
                All
              </option>

              {
                PROJECT_ALERT_CATEGORIES.map(
                  (
                    category,
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {
                        category
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
                unreadOnly
              }
              onChange={(
                event,
              ) => {
                setUnreadOnly(
                  event.target.checked,
                );
              }}
            />

            <span className="text-sm">
              Unread only
            </span>
          </label>

          <div className="flex items-end">
            {
              inbox.summary.unread >
              0
                ?
                  (
                    <form
                      action={
                        markAllAlertsReadAction
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
                        name="alerts"
                        value={
                          markAllPayload
                        }
                      />

                      <PendingButton
                        className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                      >
                        Mark all read
                      </PendingButton>
                    </form>
                  )
                :
                  (
                    <span className="pb-2 text-sm text-muted-foreground">
                      Inbox is read.
                    </span>
                  )
            }
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Active alert inbox
          </h2>

          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            Alerts are derived from live VentureScope authorities. A read, dismissed, or snoozed alert becomes active again automatically when the underlying alert fingerprint changes.
          </p>
        </div>

        {
          filtered.length ===
          0
            ?
              (
                <div className="p-8">
                  <p className="font-medium">
                    No active alerts match the selected filters.
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    This does not mean the project has no risks; review the dedicated financial and governance workspaces for full detail.
                  </p>
                </div>
              )
            :
              (
                <div className="divide-y">
                  {
                    filtered.map(
                      (
                        item,
                      ) => (
                        <article
                          key={
                            item.alert.key
                          }
                          className={`p-5 ${severitySurface(
                            item.alert.severity,
                          )}`}
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                            <div className="max-w-4xl">
                              <div className="flex flex-wrap items-center gap-2">
                                {
                                  !item.read
                                    ?
                                      (
                                        <span className="rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background">
                                          UNREAD
                                        </span>
                                      )
                                    :
                                      null
                                }

                                {
                                  item.changedSinceReceipt
                                    ?
                                      (
                                        <span className="rounded border px-2 py-1 text-[10px] font-semibold">
                                          CHANGED
                                        </span>
                                      )
                                    :
                                      null
                                }

                                <span className={`text-xs font-semibold ${severityTone(
                                  item.alert.severity,
                                )}`}>
                                  {
                                    item.alert.severity
                                  }
                                </span>

                                <span className="text-xs text-muted-foreground">
                                  {
                                    item.alert.category
                                  }
                                </span>
                              </div>

                              <h3 className="mt-2 text-lg font-semibold">
                                {
                                  item.alert.title
                                }
                              </h3>

                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                {
                                  item.alert.detail
                                }
                              </p>

                              {
                                item.alert.createdAt
                                  ?
                                    (
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        Event time: {
                                          formatDate(
                                            item.alert.createdAt,
                                          )
                                        }
                                      </p>
                                    )
                                  :
                                    null
                              }
                            </div>

                            <div className="flex min-w-fit flex-wrap gap-2">
                              <Link
                                href={
                                  item.alert.sourceHref
                                }
                                className="touch-link rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                              >
                                {
                                  item.alert.sourceLabel
                                }
                              </Link>

                              <ReceiptForm
                                projectId={
                                  projectId
                                }
                                item={
                                  item
                                }
                                operation={
                                  item.read
                                    ?
                                      "UNREAD"
                                    :
                                      "READ"
                                }
                                label={
                                  item.read
                                    ?
                                      "Mark unread"
                                    :
                                      "Mark read"
                                }
                              />

                              <ReceiptForm
                                projectId={
                                  projectId
                                }
                                item={
                                  item
                                }
                                operation="SNOOZE_24H"
                                label="Snooze 24h"
                              />

                              <ReceiptForm
                                projectId={
                                  projectId
                                }
                                item={
                                  item
                                }
                                operation="DISMISS"
                                label="Dismiss"
                              />
                            </div>
                          </div>
                        </article>
                      ),
                    )
                  }
                </div>
              )
        }
      </section>

      {
        inbox.snoozed.length >
        0
          ?
            (
              <section className="overflow-hidden rounded-xl border bg-background">
                <div className="border-b p-5">
                  <h2 className="text-lg font-semibold">
                    Snoozed alerts
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Snoozed alerts return automatically after their snooze time, unless the underlying alert changes sooner.
                  </p>
                </div>

                <div className="divide-y">
                  {
                    inbox.snoozed.map(
                      (
                        item,
                      ) => (
                        <article
                          key={
                            item.alert.key
                          }
                          className="flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {
                                item.alert.title
                              }
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Snoozed until {
                                formatDate(
                                  item.receipt
                                    ?.snoozedUntil ??
                                  null,
                                )
                              }
                            </p>
                          </div>

                          <ReceiptForm
                            projectId={
                              projectId
                            }
                            item={
                              item
                            }
                            operation="UNREAD"
                            label="Reactivate now"
                          />
                        </article>
                      ),
                    )
                  }
                </div>
              </section>
            )
          :
            null
      }

      <section className="rounded-xl border bg-background p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold">
              Dismissed alerts
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Dismissal hides the current fingerprint only. A materially changed underlying alert will automatically return.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowDismissed(
                (
                  value,
                ) =>
                  !value,
              );
            }}
            className="touch-target rounded-lg border px-3 py-2 text-sm font-medium"
          >
            {
              showDismissed
                ?
                  "Hide dismissed"
                :
                  `Show dismissed (${inbox.dismissed.length})`
            }
          </button>
        </div>

        {
          showDismissed
            ?
              (
                <div className="mt-5 divide-y rounded-lg border">
                  {
                    inbox.dismissed.length ===
                    0
                      ?
                        (
                          <div className="p-4 text-sm text-muted-foreground">
                            No dismissed alerts.
                          </div>
                        )
                      :
                        inbox.dismissed.map(
                          (
                            item,
                          ) => (
                            <div
                              key={
                                item.alert.key
                              }
                              className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center"
                            >
                              <div>
                                <p className="font-medium">
                                  {
                                    item.alert.title
                                  }
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {
                                    item.alert.category
                                  }
                                  {" · "}
                                  {
                                    item.alert.severity
                                  }
                                </p>
                              </div>

                              <ReceiptForm
                                projectId={
                                  projectId
                                }
                                item={
                                  item
                                }
                                operation="UNREAD"
                                label="Reactivate"
                              />
                            </div>
                          ),
                        )
                  }
                </div>
              )
            :
              null
        }
      </section>

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Notification integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Alert Inbox state is personal to the signed-in user. Marking an alert read, snoozing it, or dismissing it does not resolve the underlying management issue and does not mutate forecasts, Actuals, actions, KPI targets, variance commentary, risk policies, financial-close status, or audit events.
        </p>
      </section>
    </div>
  );
}
