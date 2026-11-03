"use client";

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
  calculateCapitalPlanningReport,
} from "@/lib/finance/capital-planning/calculations";

import type {
  CapitalPlanningBasis,
  CapitalStrategyKind,
} from "@/lib/finance/capital-planning/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

  riskPolicy:
    ProjectRiskPolicy;

  latestActualPeriod:
    string |
    null;

  latestActualCash:
    number |
    null;
};


const STRATEGY_LABELS:
  Record<
    CapitalStrategyKind,
    string
  > = {
    EQUITY:
      "Equity",

    DEBT:
      "Debt",

    HYBRID:
      "Hybrid",
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


function floorTone(
  breach:
    string |
    null,
): string {
  return breach
    ?
      "text-destructive"
    :
      "text-success";
}


export function CapitalPlanningWorkspace({
  projectId,
  currency,
  editable,
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
    basis,
    setBasis,
  ] =
    useState<
      CapitalPlanningBasis
    >(
      "DOWNSIDE",
    );


  const [
    targetCashFloor,
    setTargetCashFloor,
  ] =
    useState(
      String(
        riskPolicy.minimumCash ??
        0,
      ),
    );


  const [
    raisePeriodIndex,
    setRaisePeriodIndex,
  ] =
    useState(
      0,
    );


  const [
    capitalOverride,
    setCapitalOverride,
  ] =
    useState(
      "",
    );


  const [
    preMoneyValuation,
    setPreMoneyValuation,
  ] =
    useState(
      "5000000",
    );


  const [
    debtRatePercent,
    setDebtRatePercent,
  ] =
    useState(
      "8",
    );


  const [
    debtTermMonths,
    setDebtTermMonths,
  ] =
    useState(
      "36",
    );


  const [
    hybridEquityPercent,
    setHybridEquityPercent,
  ] =
    useState(
      "50",
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
                "Unable to load forecast capital data.",
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


  const parsedTargetFloor =
    Math.max(
      0,
      numericInput(
        targetCashFloor,
        0,
      ),
    );


  const baseInputs =
    useMemo(
      () => ({
        targetCashFloor:
          parsedTargetFloor,

        raisePeriodIndex,

        capitalAmount:
          0,

        preMoneyValuation:
          Math.max(
            0,
            numericInput(
              preMoneyValuation,
              0,
            ),
          ),

        annualDebtRate:
          Math.min(
            1,
            Math.max(
              0,
              numericInput(
                debtRatePercent,
                0,
              ) /
              100,
            ),
          ),

        debtTermMonths:
          Math.min(
            120,
            Math.max(
              1,
              Math.round(
                numericInput(
                  debtTermMonths,
                  36,
                ),
              ),
            ),
          ),

        hybridEquityShare:
          Math.min(
            1,
            Math.max(
              0,
              numericInput(
                hybridEquityPercent,
                50,
              ) /
              100,
            ),
          ),
      }),
      [
        parsedTargetFloor,
        raisePeriodIndex,
        preMoneyValuation,
        debtRatePercent,
        debtTermMonths,
        hybridEquityPercent,
      ],
    );


  const fundingGapReport =
    useMemo(
      () =>
        calculateCapitalPlanningReport({
          basis,

          rows,

          riskPolicy,

          latestActualPeriod,

          latestActualCash,

          inputs:
            baseInputs,
        }),
      [
        basis,
        rows,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
        baseInputs,
      ],
    );


  const effectiveCapital =
    capitalOverride.trim() ===
      ""
      ?
        fundingGapReport
          .requiredCapitalAfterRaise
      :
        Math.max(
          0,
          numericInput(
            capitalOverride,
            fundingGapReport
              .requiredCapitalAfterRaise,
          ),
        );


  const report =
    useMemo(
      () =>
        calculateCapitalPlanningReport({
          basis,

          rows,

          riskPolicy,

          latestActualPeriod,

          latestActualCash,

          inputs: {
            ...baseInputs,

            capitalAmount:
              effectiveCapital,
          },
        }),
      [
        basis,
        rows,
        riskPolicy,
        latestActualPeriod,
        latestActualCash,
        baseInputs,
        effectiveCapital,
      ],
    );


  const equity =
    report.strategies.find(
      (
        strategy,
      ) =>
        strategy.kind ===
        "EQUITY",
    );


  const debt =
    report.strategies.find(
      (
        strategy,
      ) =>
        strategy.kind ===
        "DEBT",
    );


  const hybrid =
    report.strategies.find(
      (
        strategy,
      ) =>
        strategy.kind ===
        "HYBRID",
    );


  return (
    <div className="space-y-8">
      {
        editable
          ?
            (
              <section className="rounded-xl border bg-background p-5 sm:p-6">
                <h2 className="text-lg font-semibold">
                  Capital planning assumptions
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Compare capital structures without changing the underlying VentureScope forecast. Blank capital amount uses the calculated funding gap automatically.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Planning basis
                    </span>

                    <select
                      value={
                        basis
                      }
                      onChange={(
                        event,
                      ) => {
                        setBasis(
                          event.target.value as
                            CapitalPlanningBasis,
                        );

                        setRaisePeriodIndex(
                          0,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      <option value="DOWNSIDE">
                        Downside stress
                      </option>

                      <option value="BASE">
                        Base forecast
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
                        targetCashFloor
                      }
                      onChange={(
                        event,
                      ) => {
                        setTargetCashFloor(
                          event.target.value,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Funding month
                    </span>

                    <select
                      value={
                        Math.min(
                          raisePeriodIndex,
                          Math.max(
                            0,
                            report.sourcePath
                              .length -
                            1,
                          ),
                        )
                      }
                      onChange={(
                        event,
                      ) => {
                        setRaisePeriodIndex(
                          Number(
                            event.target.value,
                          ),
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        report.sourcePath.length ===
                          0
                          ?
                            (
                              <option value="0">
                                No forecast periods
                              </option>
                            )
                          :
                            report.sourcePath.map(
                              (
                                point,
                                index,
                              ) => (
                                <option
                                  key={
                                    point.period
                                  }
                                  value={
                                    index
                                  }
                                >
                                  {
                                    point.period
                                  }
                                </option>
                              ),
                            )
                      }
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Capital amount
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        capitalOverride
                      }
                      placeholder={
                        String(
                          Math.round(
                            fundingGapReport
                              .requiredCapitalAfterRaise,
                          ),
                        )
                      }
                      onChange={(
                        event,
                      ) => {
                        setCapitalOverride(
                          event.target.value,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Equity pre-money valuation
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={
                        preMoneyValuation
                      }
                      onChange={(
                        event,
                      ) => {
                        setPreMoneyValuation(
                          event.target.value,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Debt annual rate %
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={
                        debtRatePercent
                      }
                      onChange={(
                        event,
                      ) => {
                        setDebtRatePercent(
                          event.target.value,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Debt term months
                    </span>

                    <input
                      type="number"
                      min="1"
                      max="120"
                      step="1"
                      value={
                        debtTermMonths
                      }
                      onChange={(
                        event,
                      ) => {
                        setDebtTermMonths(
                          event.target.value,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Hybrid equity share %
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={
                        hybridEquityPercent
                      }
                      onChange={(
                        event,
                      ) => {
                        setHybridEquityPercent(
                          event.target.value,
                        );
                      }}
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>
                </div>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Capital-plan outputs are visible using the default Risk Center assumptions; changing funding-case inputs requires Editor permission.
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
            (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Capital need
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        money(
                          report.requiredCapitalAfterRaise,
                          currency,
                        )
                      }
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Minimum gross injection needed after the selected funding month to protect the target cash floor before financing costs.
                    </p>
                  </article>

                  <article className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Modeled capital
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        money(
                          effectiveCapital,
                          currency,
                        )
                      }
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {
                        capitalOverride.trim() ===
                          ""
                          ?
                            "Automatically using calculated funding gap."
                          :
                            "Using manual capital-plan amount."
                      }
                    </p>
                  </article>

                  <article className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Source minimum cash
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        money(
                          report.sourceMinimumCash,
                          currency,
                        )
                      }
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {
                        basis ===
                          "DOWNSIDE"
                          ?
                            "Minimum cash under Risk Center downside stress."
                          :
                            "Minimum cash under the current base forecast."
                      }
                    </p>
                  </article>

                  <article className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Funding timing
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        report.raisePeriod ??
                        "—"
                      }
                    </p>

                    <p className={`mt-2 text-xs ${floorTone(
                      report.preRaiseFloorBreachPeriod,
                    )}`}>
                      {
                        report.preRaiseFloorBreachPeriod
                          ?
                            `Cash floor already breaches in ${report.preRaiseFloorBreachPeriod} before the selected raise.`
                          :
                            "No cash-floor breach occurs before funding."
                      }
                    </p>
                  </article>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                  {
                    report.strategies.map(
                      (
                        strategy,
                      ) => (
                        <article
                          key={
                            strategy.kind
                          }
                          className="rounded-xl border bg-background p-5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold">
                              {
                                STRATEGY_LABELS[
                                  strategy.kind
                                ]
                              }
                            </h2>

                            <span className={`text-xs font-semibold ${floorTone(
                              strategy.floorBreachPeriod,
                            )}`}>
                              {
                                strategy.floorBreachPeriod
                                  ?
                                    "FLOOR BREACH"
                                  :
                                    "FLOOR PROTECTED"
                              }
                            </span>
                          </div>

                          <p className="mt-4 text-2xl font-semibold">
                            {
                              money(
                                strategy.minimumCash,
                                currency,
                              )
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Minimum modeled cash
                          </p>

                          <dl className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">
                                Equity
                              </dt>

                              <dd>
                                {
                                  money(
                                    strategy.equityAmount,
                                    currency,
                                  )
                                }
                              </dd>
                            </div>

                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">
                                Debt
                              </dt>

                              <dd>
                                {
                                  money(
                                    strategy.debtAmount,
                                    currency,
                                  )
                                }
                              </dd>
                            </div>

                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">
                                Dilution
                              </dt>

                              <dd>
                                {
                                  percent(
                                    strategy.dilution,
                                  )
                                }
                              </dd>
                            </div>

                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">
                                Monthly debt service
                              </dt>

                              <dd>
                                {
                                  money(
                                    strategy.monthlyDebtService,
                                    currency,
                                  )
                                }
                              </dd>
                            </div>

                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">
                                Total debt interest
                              </dt>

                              <dd>
                                {
                                  money(
                                    strategy.totalDebtInterest,
                                    currency,
                                  )
                                }
                              </dd>
                            </div>

                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">
                                Ending cash
                              </dt>

                              <dd>
                                {
                                  money(
                                    strategy.endingCash,
                                    currency,
                                  )
                                }
                              </dd>
                            </div>

                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">
                                Months below floor
                              </dt>

                              <dd>
                                {
                                  strategy.monthsBelowFloor
                                }
                              </dd>
                            </div>
                          </dl>
                        </article>
                      ),
                    )
                  }
                </section>

                <section className="overflow-hidden rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">
                      Capital structure comparison
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Same gross capital amount, different equity dilution and debt-service consequences.
                    </p>
                  </div>

                  <ScrollRegion label="Capital structure comparison">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left">
                            Strategy
                          </th>

                          <th className="px-4 py-3 text-right">
                            Equity
                          </th>

                          <th className="px-4 py-3 text-right">
                            Debt
                          </th>

                          <th className="px-4 py-3 text-right">
                            Dilution
                          </th>

                          <th className="px-4 py-3 text-right">
                            Monthly debt service
                          </th>

                          <th className="px-4 py-3 text-right">
                            Min cash
                          </th>

                          <th className="px-4 py-3 text-right">
                            Ending cash
                          </th>

                          <th className="px-4 py-3 text-left">
                            Floor breach
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          report.strategies.map(
                            (
                              strategy,
                            ) => (
                              <tr
                                key={
                                  strategy.kind
                                }
                                className="border-b last:border-0"
                              >
                                <th className="px-4 py-3 text-left font-medium">
                                  {
                                    STRATEGY_LABELS[
                                      strategy.kind
                                    ]
                                  }
                                </th>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      strategy.equityAmount,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      strategy.debtAmount,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    percent(
                                      strategy.dilution,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      strategy.monthlyDebtService,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      strategy.minimumCash,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      strategy.endingCash,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className={`px-4 py-3 ${floorTone(
                                  strategy.floorBreachPeriod,
                                )}`}>
                                  {
                                    strategy.floorBreachPeriod ??
                                    "None"
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

                {
                  equity &&
                  debt &&
                  hybrid
                    ?
                      (
                        <section className="rounded-xl border bg-background p-5 sm:p-6">
                          <h2 className="text-lg font-semibold">
                            Capital trade-offs
                          </h2>

                          <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <article className="rounded-lg border p-4">
                              <p className="font-medium">
                                Equity
                              </p>

                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                No modeled debt service. Estimated dilution is {
                                  percent(
                                    equity.dilution,
                                  )
                                } at the entered pre-money valuation.
                              </p>
                            </article>

                            <article className="rounded-lg border p-4">
                              <p className="font-medium">
                                Debt
                              </p>

                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                No modeled equity dilution, but monthly debt service is {
                                  money(
                                    debt.monthlyDebtService,
                                    currency,
                                  )
                                } and reduces post-funding liquidity.
                              </p>
                            </article>

                            <article className="rounded-lg border p-4">
                              <p className="font-medium">
                                Hybrid
                              </p>

                              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                Splits the modeled capital between equity and debt, producing {
                                  percent(
                                    hybrid.dilution,
                                  )
                                } estimated dilution and {
                                  money(
                                    hybrid.monthlyDebtService,
                                    currency,
                                  )
                                } monthly debt service.
                              </p>
                            </article>
                          </div>
                        </section>
                      )
                    :
                      null
                }

                <section className="overflow-hidden rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">
                      Liquidity path after funding
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Compare source cash with the three capital structures over the modeled horizon.
                    </p>
                  </div>

                  <ScrollRegion label="Liquidity path after funding" className="max-h-[540px] overflow-y-auto">
                    <table className="w-full min-w-[820px] text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left">
                            Period
                          </th>

                          <th className="px-4 py-3 text-right">
                            Source
                          </th>

                          <th className="px-4 py-3 text-right">
                            Equity
                          </th>

                          <th className="px-4 py-3 text-right">
                            Debt
                          </th>

                          <th className="px-4 py-3 text-right">
                            Hybrid
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          report.sourcePath.map(
                            (
                              point,
                              index,
                            ) => (
                              <tr
                                key={
                                  point.period
                                }
                                className="border-b last:border-0"
                              >
                                <td className="px-4 py-3 font-medium">
                                  {
                                    point.period
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      point.cashBalance,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      equity?.cashPath[
                                        index
                                      ]?.adjustedCashBalance ??
                                      null,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      debt?.cashPath[
                                        index
                                      ]?.adjustedCashBalance ??
                                      null,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      hybrid?.cashPath[
                                        index
                                      ]?.adjustedCashBalance ??
                                      null,
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
      }

      <p className="text-xs leading-5 text-muted-foreground">
        Capital Planning is a deterministic modeling workspace, not an investment or lending recommendation. Cases do not create financing transactions, change forecast assumptions, alter Actuals, or mutate immutable baselines or model versions.
      </p>
    </div>
  );
}
