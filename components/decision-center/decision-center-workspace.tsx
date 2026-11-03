"use client";

import Link from "next/link";

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
  calculateVarianceReport,
} from "@/lib/finance/actuals/variance";

import {
  calculateForecastAccuracyReport,
} from "@/lib/finance/forecast-accuracy/calculations";

import {
  calculateLiquidityRiskReport,
} from "@/lib/finance/risk-center/calculations";

import {
  calculateCapitalPlanningReport,
} from "@/lib/finance/capital-planning/calculations";

import {
  buildExecutiveDecisionSignals,
} from "@/lib/finance/decision-center/signals";

import {
  DECISION_ACTION_PRIORITIES,
  DECISION_ACTION_STATUSES,
  type DecisionActionPriority,
  type DecisionActionView,
  type DecisionSignalSeverity,
  type DecisionSourceCode,
} from "@/lib/finance/decision-center/types";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import {
  createDecisionActionAction,
  updateDecisionActionStatusAction,
} from "@/app/(app)/projects/[projectId]/decision-center/actions";


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

  actions:
    DecisionActionView[];
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


function severityTone(
  severity:
    DecisionSignalSeverity,
): string {
  switch (
    severity
  ) {
    case "CRITICAL":
      return "text-destructive";

    case "WARNING":
      return "text-warning";

    case "INFO":
      return "text-muted-foreground";
  }
}


function severityPriority(
  severity:
    DecisionSignalSeverity,
): DecisionActionPriority {
  switch (
    severity
  ) {
    case "CRITICAL":
      return "CRITICAL";

    case "WARNING":
      return "HIGH";

    case "INFO":
      return "MEDIUM";
  }
}


function statusTone(
  status:
    string,
): string {
  switch (
    status
  ) {
    case "DONE":
      return "text-success";

    case "BLOCKED":
      return "text-destructive";

    case "IN_PROGRESS":
      return "text-info";

    case "DISMISSED":
      return "text-muted-foreground";

    default:
      return "";
  }
}


export function DecisionCenterWorkspace({
  projectId,
  currency,
  editable,
  actuals,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
  actions,
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
    actionTitle,
    setActionTitle,
  ] =
    useState(
      "",
    );


  const [
    actionDetails,
    setActionDetails,
  ] =
    useState(
      "",
    );


  const [
    actionSource,
    setActionSource,
  ] =
    useState<
      DecisionSourceCode
    >(
      "MANUAL",
    );


  const [
    actionPriority,
    setActionPriority,
  ] =
    useState<
      DecisionActionPriority
    >(
      "MEDIUM",
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
                "Unable to load executive financial intelligence.",
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


  const variance =
    useMemo(
      () =>
        calculateVarianceReport(
          actuals,
          forecasts,
        ),
      [
        actuals,
        forecasts,
      ],
    );


  const accuracy =
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


  const risk =
    useMemo(
      () =>
        calculateLiquidityRiskReport({
          rows:
            forecasts,

          policy:
            riskPolicy,

          latestActualPeriod,

          latestActualCash,
        }),
      [
        forecasts,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
      ],
    );


  const capital =
    useMemo(
      () =>
        calculateCapitalPlanningReport({
          basis:
            "DOWNSIDE",

          rows:
            forecasts,

          riskPolicy,

          latestActualPeriod,

          latestActualCash,

          inputs: {
            targetCashFloor:
              Math.max(
                0,
                riskPolicy.minimumCash ??
                0,
              ),

            raisePeriodIndex:
              0,

            capitalAmount:
              0,

            preMoneyValuation:
              0,

            annualDebtRate:
              0,

            debtTermMonths:
              36,

            hybridEquityShare:
              0.50,
          },
        }),
      [
        forecasts,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
      ],
    );


  const signals =
    useMemo(
      () =>
        buildExecutiveDecisionSignals({
          actualPeriods:
            actuals.length,

          revenueVarianceRate:
            variance.summary
              .revenueVarianceRate,

          ebitdaVarianceRate:
            variance.summary
              .ebitdaVarianceRate,

          forecastAccuracyScore:
            accuracy
              .overallAccuracyScore,

          forecastBiasCount:
            accuracy.metrics.filter(
              (
                metric,
              ) =>
                metric.bias ===
                  "OVER_FORECASTING" ||
                metric.bias ===
                  "UNDER_FORECASTING",
            ).length,

          liquidityRiskLevel:
            risk.level,

          downsideCashExhaustionPeriod:
            risk
              .firstDownsideCashExhaustionPeriod,

          requiredCapital:
            capital
              .requiredCapitalAfterRaise,
        }),
      [
        actuals.length,
        variance,
        accuracy,
        risk,
        capital,
      ],
    );


  const openActions =
    actions.filter(
      (
        action,
      ) =>
        action.status !==
          "DONE" &&
        action.status !==
          "DISMISSED",
    );


  const criticalSignals =
    signals.filter(
      (
        signal,
      ) =>
        signal.severity ===
        "CRITICAL",
    );


  function populateActionFromSignal(
    signal:
      typeof signals[
        number
      ],
  ) {
    setActionTitle(
      signal.title,
    );

    setActionDetails(
      signal.actionHint,
    );

    setActionSource(
      signal.code,
    );

    setActionPriority(
      severityPriority(
        signal.severity,
      ),
    );


    document
      .getElementById(
        "decision-action-form",
      )
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start",
      });
  }


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

        <div className="h-72 animate-pulse rounded-xl bg-muted" />
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
            Critical signals
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            criticalSignals.length >
              0
              ?
                "text-destructive"
              :
                "text-success"
          }`}>
            {
              criticalSignals.length
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Derived from performance, forecast, liquidity, and capital intelligence.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Open actions
          </p>

          <p className="mt-2 text-3xl font-semibold">
            {
              openActions.length
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Actions not marked Done or Dismissed.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Liquidity risk
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            risk.level ===
              "CRITICAL" ||
            risk.level ===
              "HIGH"
              ?
                "text-destructive"
              :
                ""
          }`}>
            {
              risk.level
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Risk Center score {
              risk.score
            } / 100
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Downside capital need
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              money(
                capital
                  .requiredCapitalAfterRaise,
                currency,
              )
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Modeled funding gap against the Risk Center cash floor.
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Revenue variance
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              percent(
                variance.summary
                  .revenueVarianceRate,
              )
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Actual versus matched forecast.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            EBITDA variance
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              percent(
                variance.summary
                  .ebitdaVarianceRate,
              )
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Actual versus matched forecast.
          </p>
        </article>

        <article className="rounded-xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Forecast accuracy
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              percent(
                accuracy
                  .overallAccuracyScore,
              )
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Historical planning reliability.
          </p>
        </article>
      </section>

      <section className="rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Executive decision signals
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            VentureScope converts the major financial exceptions into a prioritized management queue. Signals remain diagnostics until management deliberately creates an action.
          </p>
        </div>

        {
          signals.length ===
            0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No material decision signal is currently detected from the available financial data and configured guardrails.
                </div>
              )
            :
              (
                <div className="divide-y">
                  {
                    signals.map(
                      (
                        signal,
                      ) => (
                        <article
                          key={
                            signal.code
                          }
                          className="p-5"
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row">
                            <div className="max-w-3xl">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-xs font-semibold ${severityTone(
                                  signal.severity,
                                )}`}>
                                  {
                                    signal.severity
                                  }
                                </span>

                                <span className="rounded border px-2 py-1 text-xs text-muted-foreground">
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
                                <span className="font-medium">
                                  Suggested management response:
                                </span>{" "}
                                {
                                  signal.actionHint
                                }
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-start gap-2">
                              <Link
                                href={`/projects/${projectId}/${signal.hrefSuffix}`}
                                className="touch-link rounded-lg border px-3 py-2 text-sm font-medium"
                              >
                                View source
                              </Link>

                              {
                                editable
                                  ?
                                    (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          populateActionFromSignal(
                                            signal,
                                          );
                                        }}
                                        className="touch-target rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background"
                                      >
                                        Create action
                                      </button>
                                    )
                                  :
                                    null
                              }
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
        editable
          ?
            (
              <section
                id="decision-action-form"
                className="rounded-xl border bg-background p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold">
                  Create management action
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Turn an executive signal into an accountable decision or enter a manual management action.
                </p>

                <form
                  action={
                    createDecisionActionAction
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

                  <input
                    type="hidden"
                    name="sourceCode"
                    value={
                      actionSource
                    }
                  />

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Action title
                    </span>

                    <input
                      name="title"
                      required
                      minLength={
                        3
                      }
                      maxLength={
                        120
                      }
                      value={
                        actionTitle
                      }
                      onChange={(
                        event,
                      ) => {
                        setActionTitle(
                          event.target.value,
                        );
                      }}
                      placeholder="Review Q4 discretionary spend"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Details
                    </span>

                    <textarea
                      name="details"
                      maxLength={
                        1000
                      }
                      value={
                        actionDetails
                      }
                      onChange={(
                        event,
                      ) => {
                        setActionDetails(
                          event.target.value,
                        );
                      }}
                      rows={
                        4
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Priority
                    </span>

                    <select
                      name="priority"
                      value={
                        actionPriority
                      }
                      onChange={(
                        event,
                      ) => {
                        setActionPriority(
                          event.target.value as
                            DecisionActionPriority,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        DECISION_ACTION_PRIORITIES.map(
                          (
                            priority,
                          ) => (
                            <option
                              key={
                                priority
                              }
                              value={
                                priority
                              }
                            >
                              {
                                priority
                              }
                            </option>
                          ),
                        )
                      }
                    </select>
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
                      placeholder="Finance lead"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Due date
                    </span>

                    <input
                      type="date"
                      name="dueDate"
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <div className="flex items-end">
                    <PendingButton
                      className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                    >
                      Add to action register
                    </PendingButton>
                  </div>

                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Source: {
                      actionSource
                    }
                  </p>
                </form>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Executive signals and the action register are visible, but creating or changing management actions requires Editor permission.
              </section>
            )
      }

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Management action register
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Track ownership, priority, deadlines, and execution status for management decisions.
          </p>
        </div>

        {
          actions.length ===
            0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No management actions have been registered yet.
                </div>
              )
            :
              (
                <ScrollRegion label="Management action register">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Action
                        </th>

                        <th className="px-4 py-3 text-left">
                          Priority
                        </th>

                        <th className="px-4 py-3 text-left">
                          Owner
                        </th>

                        <th className="px-4 py-3 text-left">
                          Due
                        </th>

                        <th className="px-4 py-3 text-left">
                          Source
                        </th>

                        <th className="px-4 py-3 text-left">
                          Status
                        </th>

                        <th className="px-4 py-3 text-left">
                          Created
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        actions.map(
                          (
                            action,
                          ) => (
                            <tr
                              key={
                                action.id
                              }
                              className="border-b align-top last:border-0"
                            >
                              <td className="max-w-md px-4 py-3">
                                <p className="font-medium">
                                  {
                                    action.title
                                  }
                                </p>

                                {
                                  action.details
                                    ?
                                      (
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                          {
                                            action.details
                                          }
                                        </p>
                                      )
                                    :
                                      null
                                }
                              </td>

                              <td className="px-4 py-3 font-medium">
                                {
                                  action.priority
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

                              <td className="px-4 py-3 text-xs">
                                {
                                  action.sourceCode ??
                                  "MANUAL"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  editable
                                    ?
                                      (
                                        <form
                                          action={
                                            updateDecisionActionStatusAction
                                          }
                                          className="flex items-center gap-2"
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
                                            name="actionId"
                                            value={
                                              action.id
                                            }
                                          />

                                          <select
                                            name="status"
                                            aria-label={`Status of action: ${action.title}`}
                                            defaultValue={
                                              action.status
                                            }
                                            className={`h-9 rounded-lg border bg-background px-2 text-xs ${statusTone(
                                              action.status,
                                            )}`}
                                          >
                                            {
                                              DECISION_ACTION_STATUSES.map(
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

                                          <PendingButton
                                            className="h-9 rounded-lg border px-3 text-xs font-medium"
                                          >
                                            Update
                                          </PendingButton>
                                        </form>
                                      )
                                    :
                                      (
                                        <span className={statusTone(
                                          action.status,
                                        )}>
                                          {
                                            action.status
                                          }
                                        </span>
                                      )
                                }
                              </td>

                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                <p>
                                  {
                                    new Date(
                                      action.createdAt,
                                    ).toLocaleDateString()
                                  }
                                </p>

                                {
                                  action.createdBy
                                    ?
                                      (
                                        <p className="mt-1">
                                          {
                                            action.createdBy
                                          }
                                        </p>
                                      )
                                    :
                                      null
                                }
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

      <p className="text-xs leading-5 text-muted-foreground">
        Executive Decision Center signals are deterministic management diagnostics. VentureScope does not automatically execute recommendations, alter assumptions, create financing transactions, or modify Actuals, baselines, guardrails, or immutable model versions.
      </p>
    </div>
  );
}
