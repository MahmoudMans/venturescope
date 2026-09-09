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
  buildSensitivityAxis,
  calculateSensitivityCell,
  calculateSensitivitySurface,
} from "@/lib/finance/sensitivity-lab/calculations";

import type {
  SensitivityCell,
  SensitivityCellState,
} from "@/lib/finance/sensitivity-lab/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


type Props = {
  projectId:
    string;

  currency:
    string;

  riskPolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;
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


function stateTone(
  state:
    SensitivityCellState,
): string {
  switch (
    state
  ) {
    case "RESILIENT":
      return "text-emerald-700 dark:text-emerald-400";

    case "FLOOR_BREACH":
      return "text-amber-700 dark:text-amber-400";

    case "CASH_EXHAUSTION":
      return "text-destructive";
  }
}


function stateSurface(
  state:
    SensitivityCellState,
): string {
  switch (
    state
  ) {
    case "RESILIENT":
      return "bg-emerald-500/10";

    case "FLOOR_BREACH":
      return "bg-amber-500/10";

    case "CASH_EXHAUSTION":
      return "bg-destructive/10";
  }
}


function numericInput(
  value:
    string,
  fallback:
    number,
): number {
  if (
    value.trim() ===
    ""
  ) {
    return fallback;
  }


  const parsed =
    Number(
      value,
    );


  return Number.isFinite(
    parsed,
  )
    ?
      parsed
    :
      fallback;
}


export function SensitivityLabWorkspace({
  projectId,
  currency,
  riskPolicy,
  latestActualPeriod,
  latestActualCash,
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
    revenueMaxPercent,
    setRevenueMaxPercent,
  ] =
    useState(
      "40",
    );


  const [
    costMaxPercent,
    setCostMaxPercent,
  ] =
    useState(
      "20",
    );


  const [
    gridPoints,
    setGridPoints,
  ] =
    useState(
      5,
    );


  const [
    targetFloor,
    setTargetFloor,
  ] =
    useState(
      String(
        riskPolicy.minimumCash ??
        0,
      ),
    );


  const [
    metric,
    setMetric,
  ] =
    useState<
      "MIN_CASH" |
      "CAPITAL_NEED"
    >(
      "MIN_CASH",
    );


  const [
    selectedCell,
    setSelectedCell,
  ] =
    useState<
      SensitivityCell |
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
                "Unable to load sensitivity data.",
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


  const rows =
    useMemo(
      () =>
        normalizeForecastCsv(
          forecastCsv,
        ),
      [
        forecastCsv,
      ],
    );


  const parsedRevenueMax =
    Math.min(
      0.90,
      Math.max(
        0,
        numericInput(
          revenueMaxPercent,
          40,
        ) /
        100,
      ),
    );


  const parsedCostMax =
    Math.min(
      1,
      Math.max(
        0,
        numericInput(
          costMaxPercent,
          20,
        ) /
        100,
      ),
    );


  const parsedFloor =
    Math.max(
      0,
      numericInput(
        targetFloor,
        riskPolicy.minimumCash ??
        0,
      ),
    );


  const revenueAxis =
    useMemo(
      () =>
        buildSensitivityAxis(
          parsedRevenueMax,
          gridPoints,
        ),
      [
        parsedRevenueMax,
        gridPoints,
      ],
    );


  const costAxis =
    useMemo(
      () =>
        buildSensitivityAxis(
          parsedCostMax,
          gridPoints,
        ),
      [
        parsedCostMax,
        gridPoints,
      ],
    );


  const surface =
    useMemo(
      () =>
        calculateSensitivitySurface({
          rows,

          basePolicy:
            riskPolicy,

          latestActualPeriod,

          latestActualCash,

          targetCashFloor:
            parsedFloor,

          revenueShocks:
            revenueAxis,

          costInflations:
            costAxis,
        }),
      [
        rows,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
        parsedFloor,
        revenueAxis,
        costAxis,
      ],
    );


  const currentPolicyCase =
    useMemo(
      () =>
        calculateSensitivityCell({
          rows,

          basePolicy:
            riskPolicy,

          latestActualPeriod,

          latestActualCash,

          targetCashFloor:
            parsedFloor,

          revenueShock:
            riskPolicy.downsideRevenueShock,

          costInflation:
            riskPolicy.downsideCostInflation,
        }),
      [
        rows,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
        parsedFloor,
      ],
    );


  const cellByCoordinates =
    useMemo(
      () =>
        new Map(
          surface.cells.map(
            (
              cell,
            ) => [
              `${cell.revenueShock}:${cell.costInflation}`,
              cell,
            ],
          ),
        ),
      [
        surface.cells,
      ],
    );


  const effectiveSelectedCell =
    selectedCell ??
    currentPolicyCase;


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

      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <h2 className="text-lg font-semibold">
          Sensitivity design
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Test combinations of revenue downside and cost inflation. Every cell reuses the existing Risk Center downside engine and Capital Planning funding-gap authority.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              Maximum revenue shock %
            </span>

            <input
              type="number"
              min="0"
              max="90"
              step="1"
              value={
                revenueMaxPercent
              }
              onChange={(
                event,
              ) => {
                setRevenueMaxPercent(
                  event.target.value,
                );

                setSelectedCell(
                  null,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Maximum cost inflation %
            </span>

            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={
                costMaxPercent
              }
              onChange={(
                event,
              ) => {
                setCostMaxPercent(
                  event.target.value,
                );

                setSelectedCell(
                  null,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Grid resolution
            </span>

            <select
              value={
                gridPoints
              }
              onChange={(
                event,
              ) => {
                setGridPoints(
                  Number(
                    event.target.value,
                  ),
                );

                setSelectedCell(
                  null,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="3">
                3 × 3
              </option>

              <option value="5">
                5 × 5
              </option>

              <option value="7">
                7 × 7
              </option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Target cash floor
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                targetFloor
              }
              onChange={(
                event,
              ) => {
                setTargetFloor(
                  event.target.value,
                );

                setSelectedCell(
                  null,
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Surface metric
            </span>

            <select
              value={
                metric
              }
              onChange={(
                event,
              ) => {
                setMetric(
                  event.target.value as
                    "MIN_CASH" |
                    "CAPITAL_NEED",
                );
              }}
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="MIN_CASH">
                Minimum cash
              </option>

              <option value="CAPITAL_NEED">
                Capital need
              </option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resilient cases
          </p>

          <p className="mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-400">
            {
              surface.summary
                .resilientCells
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            of {
              surface.summary
                .totalCells
            } combinations
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cash exhaustion cases
          </p>

          <p className={`mt-2 text-3xl font-semibold ${
            surface.summary
              .cashExhaustionCells >
            0
              ?
                "text-destructive"
              :
                ""
          }`}>
            {
              surface.summary
                .cashExhaustionCells
            }
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            Earliest: {
              surface.summary
                .earliestCashExhaustionPeriod ??
              "none"
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Worst minimum cash
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              money(
                surface.summary
                  .worstMinimumCash,
                currency,
              )
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Maximum capital need
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              money(
                surface.summary
                  .maximumCapitalNeed,
                currency,
              )
            }
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Revenue shock × cost inflation
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select a cell to inspect its liquidity and capital consequences.
          </p>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-3 text-left">
                  Revenue shock
                </th>

                {
                  surface.costInflations.map(
                    (
                      costInflation,
                    ) => (
                      <th
                        key={
                          costInflation
                        }
                        className="border p-3 text-center"
                      >
                        Cost +{
                          percent(
                            costInflation,
                          )
                        }
                      </th>
                    ),
                  )
                }
              </tr>
            </thead>

            <tbody>
              {
                surface.revenueShocks.map(
                  (
                    revenueShock,
                  ) => (
                    <tr
                      key={
                        revenueShock
                      }
                    >
                      <th className="border p-3 text-left">
                        Revenue -{
                          percent(
                            revenueShock,
                          )
                        }
                      </th>

                      {
                        surface.costInflations.map(
                          (
                            costInflation,
                          ) => {
                            const cell =
                              cellByCoordinates.get(
                                `${revenueShock}:${costInflation}`,
                              );


                            if (
                              !cell
                            ) {
                              return (
                                <td
                                  key={
                                    costInflation
                                  }
                                  className="border p-3"
                                >
                                  —
                                </td>
                              );
                            }


                            return (
                              <td
                                key={
                                  costInflation
                                }
                                className={`border p-0 ${stateSurface(
                                  cell.state,
                                )}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCell(
                                      cell,
                                    );
                                  }}
                                  className="block min-h-24 w-full p-3 text-left"
                                >
                                  <p className={`text-xs font-semibold ${stateTone(
                                    cell.state,
                                  )}`}>
                                    {
                                      cell.state
                                    }
                                  </p>

                                  <p className="mt-2 font-semibold">
                                    {
                                      metric ===
                                        "MIN_CASH"
                                        ?
                                          money(
                                            cell.minimumCash,
                                            currency,
                                          )
                                        :
                                          money(
                                            cell.capitalNeed,
                                            currency,
                                          )
                                    }
                                  </p>

                                  {
                                    cell.cashExhaustionPeriod
                                      ?
                                        (
                                          <p className="mt-1 text-xs text-destructive">
                                            Exhausts {
                                              cell.cashExhaustionPeriod
                                            }
                                          </p>
                                        )
                                      :
                                        null
                                  }
                                </button>
                              </td>
                            );
                          },
                        )
                      }
                    </tr>
                  ),
                )
              }
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Selected stress case
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Revenue -{
              percent(
                effectiveSelectedCell
                  .revenueShock,
              )
            } · Costs +{
              percent(
                effectiveSelectedCell
                  .costInflation,
              )
            }
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                State
              </p>

              <p className={`mt-2 font-semibold ${stateTone(
                effectiveSelectedCell
                  .state,
              )}`}>
                {
                  effectiveSelectedCell
                    .state
                }
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                Minimum cash
              </p>

              <p className="mt-2 font-semibold">
                {
                  money(
                    effectiveSelectedCell
                      .minimumCash,
                    currency,
                  )
                }
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                Ending cash
              </p>

              <p className="mt-2 font-semibold">
                {
                  money(
                    effectiveSelectedCell
                      .endingCash,
                    currency,
                  )
                }
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                Capital need
              </p>

              <p className="mt-2 font-semibold">
                {
                  money(
                    effectiveSelectedCell
                      .capitalNeed,
                    currency,
                  )
                }
              </p>
            </div>

            <div className="rounded-lg border p-4 sm:col-span-2">
              <p className="text-xs text-muted-foreground">
                First cash exhaustion
              </p>

              <p className="mt-2 font-semibold">
                {
                  effectiveSelectedCell
                    .cashExhaustionPeriod ??
                  "Not within forecast horizon"
                }
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current Risk Center stress
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Revenue -{
              percent(
                riskPolicy
                  .downsideRevenueShock,
              )
            } · Costs +{
              percent(
                riskPolicy
                  .downsideCostInflation,
              )
            }
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                State
              </p>

              <p className={`mt-2 font-semibold ${stateTone(
                currentPolicyCase.state,
              )}`}>
                {
                  currentPolicyCase.state
                }
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                Minimum cash
              </p>

              <p className="mt-2 font-semibold">
                {
                  money(
                    currentPolicyCase
                      .minimumCash,
                    currency,
                  )
                }
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                Capital need
              </p>

              <p className="mt-2 font-semibold">
                {
                  money(
                    currentPolicyCase
                      .capitalNeed,
                    currency,
                  )
                }
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                Exhaustion
              </p>

              <p className="mt-2 font-semibold">
                {
                  currentPolicyCase
                    .cashExhaustionPeriod ??
                  "None"
                }
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/projects/${projectId}/risk-center`}
              className="rounded-lg border px-3 py-2 text-sm font-medium"
            >
              Open Risk Center
            </Link>

            <Link
              href={`/projects/${projectId}/capital-planning`}
              className="rounded-lg border px-3 py-2 text-sm font-medium"
            >
              Open Capital Planning
            </Link>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Funding-resilience boundary
          </h2>

          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            For each revenue shock, this shows the highest modeled cost inflation in the current grid that still requires no additional capital to preserve the target cash floor.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left">
                  Revenue shock
                </th>

                <th className="px-4 py-3 text-left">
                  Maximum cost inflation without funding
                </th>

                <th className="px-4 py-3 text-left">
                  Interpretation
                </th>
              </tr>
            </thead>

            <tbody>
              {
                surface.boundary.map(
                  (
                    point,
                  ) => (
                    <tr
                      key={
                        point.revenueShock
                      }
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {
                          percent(
                            point.revenueShock,
                          )
                        }
                      </td>

                      <td className="px-4 py-3">
                        {
                          point.maximumCostInflationWithoutFunding ===
                            null
                            ?
                              "None in grid"
                            :
                              percent(
                                point.maximumCostInflationWithoutFunding,
                              )
                        }
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {
                          point.maximumCostInflationWithoutFunding ===
                            null
                            ?
                              "Even the lowest modeled cost case requires capital at this revenue shock."
                            :
                              "Cases at or below this modeled cost shock remain within the no-funding boundary."
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

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Sensitivity integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          The Sensitivity Lab is a deterministic stress-analysis layer. Revenue shock and cost inflation are passed into the existing Risk Center downside calculation, and capital need is calculated by the existing Capital Planning authority. No scenario, forecast assumption, Actual, risk policy, planning baseline, or model revision is changed.
        </p>
      </section>
    </div>
  );
}
