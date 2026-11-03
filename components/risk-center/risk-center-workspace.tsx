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
  calculateLiquidityRiskReport,
} from "@/lib/finance/risk-center/calculations";

import type {
  GuardrailState,
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import {
  saveRiskPolicyAction,
} from "@/app/(app)/projects/[projectId]/risk-center/actions";


type Props = {
  projectId:
    string;

  currency:
    string;

  editable:
    boolean;

  policy:
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


function guardrailTone(
  state:
    GuardrailState,
): string {
  switch (
    state
  ) {
    case "PASS":
      return "text-success";

    case "WARNING":
      return "text-warning";

    case "BREACH":
      return "text-destructive";

    case "UNAVAILABLE":
      return "text-muted-foreground";
  }
}


function riskTone(
  level:
    string,
): string {
  switch (
    level
  ) {
    case "LOW":
      return "text-success";

    case "MODERATE":
      return "text-warning";

    case "HIGH":
    case "CRITICAL":
      return "text-destructive";

    default:
      return "text-muted-foreground";
  }
}


export function RiskCenterWorkspace({
  projectId,
  currency,
  editable,
  policy,
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
                "Unable to load forecast risk data.",
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


  const report =
    useMemo(
      () =>
        calculateLiquidityRiskReport({
          rows,

          policy,

          latestActualPeriod,

          latestActualCash,
        }),
      [
        rows,
        policy,
        latestActualPeriod,
        latestActualCash,
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
                  Financial guardrails
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Define the limits management wants VentureScope to watch continuously against the live forecast.
                </p>

                <form
                  action={
                    saveRiskPolicyAction
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
                      Minimum cash
                    </span>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="minimumCash"
                      defaultValue={
                        policy.minimumCash ??
                        ""
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Minimum runway months
                    </span>

                    <input
                      type="number"
                      min="1"
                      max="60"
                      step="1"
                      required
                      name="minimumRunwayMonths"
                      defaultValue={
                        policy.minimumRunwayMonths
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Minimum EBITDA margin %
                    </span>

                    <input
                      type="number"
                      min="-100"
                      max="100"
                      step="0.1"
                      name="minimumEbitdaMarginPercent"
                      defaultValue={
                        policy.minimumEbitdaMargin ===
                          null
                          ?
                            ""
                          :
                            policy.minimumEbitdaMargin *
                            100
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Maximum monthly burn
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="maximumMonthlyBurn"
                      defaultValue={
                        policy.maximumMonthlyBurn ??
                        ""
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Downside revenue shock %
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="90"
                      step="1"
                      required
                      name="downsideRevenueShockPercent"
                      defaultValue={
                        policy.downsideRevenueShock *
                        100
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium">
                      Downside cost inflation %
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      required
                      name="downsideCostInflationPercent"
                      defaultValue={
                        policy.downsideCostInflation *
                        100
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    />
                  </label>

                  <div className="sm:col-span-2 xl:col-span-3">
                    <PendingButton
                      className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
                    >
                      Save financial guardrails
                    </PendingButton>
                  </div>
                </form>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                You have Viewer access. Risk analysis is visible, but changing financial guardrails requires Editor permission.
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
                      Liquidity risk
                    </p>

                    <p className={`mt-2 text-3xl font-semibold ${riskTone(
                      report.level,
                    )}`}>
                      {
                        report.level
                      }
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Risk score {
                        report.score
                      } / 100
                    </p>
                  </article>

                  <article className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Minimum forecast cash
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        money(
                          report.minimumForecastCash,
                          currency,
                        )
                      }
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Lowest live-forecast cash balance.
                    </p>
                  </article>

                  <article className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Downside minimum cash
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        money(
                          report.minimumDownsideCash,
                          currency,
                        )
                      }
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Revenue shock + cost inflation stress.
                    </p>
                  </article>

                  <article className="rounded-xl border bg-background p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Cash exhaustion
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {
                        report.firstCashExhaustionPeriod ??
                        "Not in horizon"
                      }
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {
                        report.runwayMonths ===
                          null
                          ?
                            "No modeled exhaustion."
                          :
                            `${report.runwayMonths} months from current actual period.`
                      }
                    </p>
                  </article>
                </section>

                <section className="overflow-hidden rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">
                      Guardrail monitor
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Early-warning checks against management-defined financial limits.
                    </p>
                  </div>

                  <ScrollRegion label="Guardrail monitor">
                    <table className="w-full min-w-[820px] text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-4 py-3 text-left">
                            Guardrail
                          </th>

                          <th className="px-4 py-3 text-left">
                            Status
                          </th>

                          <th className="px-4 py-3 text-right">
                            Current
                          </th>

                          <th className="px-4 py-3 text-right">
                            Threshold
                          </th>

                          <th className="px-4 py-3 text-left">
                            First breach
                          </th>

                          <th className="px-4 py-3 text-left">
                            Assessment
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          report.guardrails.map(
                            (
                              guardrail,
                            ) => (
                              <tr
                                key={
                                  guardrail.code
                                }
                                className="border-b last:border-0"
                              >
                                <th className="px-4 py-3 text-left font-medium">
                                  {
                                    guardrail.label
                                  }
                                </th>

                                <td className={`px-4 py-3 font-medium ${guardrailTone(
                                  guardrail.state,
                                )}`}>
                                  {
                                    guardrail.state
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    guardrail.code ===
                                      "EBITDA_MARGIN"
                                      ?
                                        percent(
                                          guardrail.current,
                                        )
                                      :
                                      guardrail.code ===
                                        "RUNWAY"
                                        ?
                                          guardrail.current ===
                                            null
                                            ?
                                              "Beyond horizon"
                                            :
                                              `${guardrail.current} mo`
                                        :
                                          money(
                                            guardrail.current,
                                            currency,
                                          )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    guardrail.code ===
                                      "EBITDA_MARGIN"
                                      ?
                                        percent(
                                          guardrail.threshold,
                                        )
                                      :
                                      guardrail.code ===
                                        "RUNWAY"
                                        ?
                                          guardrail.threshold ===
                                            null
                                            ?
                                              "—"
                                            :
                                              `${guardrail.threshold} mo`
                                        :
                                          money(
                                            guardrail.threshold,
                                            currency,
                                          )
                                  }
                                </td>

                                <td className="px-4 py-3">
                                  {
                                    guardrail.breachPeriod ??
                                    "—"
                                  }
                                </td>

                                <td className="max-w-sm px-4 py-3 text-muted-foreground">
                                  {
                                    guardrail.message
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

                <section className="rounded-xl border bg-background p-5 sm:p-6">
                  <h2 className="text-lg font-semibold">
                    Downside stress
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    The downside case applies a {
                      percent(
                        policy.downsideRevenueShock,
                      )
                    } revenue reduction and {
                      percent(
                        policy.downsideCostInflation,
                      )
                    } inflation to modeled COGS and operating expenses.
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Latest actual cash
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {
                          money(
                            latestActualCash,
                            currency,
                          )
                        }
                      </p>
                    </article>

                    <article className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Downside minimum
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {
                          money(
                            report.minimumDownsideCash,
                            currency,
                          )
                        }
                      </p>
                    </article>

                    <article className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Downside exhaustion
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {
                          report.firstDownsideCashExhaustionPeriod ??
                          "Not in horizon"
                        }
                      </p>
                    </article>

                    <article className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Maximum forecast burn
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {
                          money(
                            report.maximumMonthlyBurn,
                            currency,
                          )
                        }
                      </p>
                    </article>
                  </div>
                </section>

                <section className="overflow-hidden rounded-xl border bg-background">
                  <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">
                      Downside cash path
                    </h2>
                  </div>

                  <ScrollRegion label="Downside cash path" className="max-h-[520px] overflow-y-auto">
                    <table className="w-full min-w-[650px] text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left">
                            Period
                          </th>

                          <th className="px-4 py-3 text-right">
                            Baseline cash flow
                          </th>

                          <th className="px-4 py-3 text-right">
                            Stressed cash flow
                          </th>

                          <th className="px-4 py-3 text-right">
                            Stressed cash balance
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {
                          report.downsideCash.map(
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

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      row.baselineCashFlow,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      row.stressedCashFlow,
                                      currency,
                                    )
                                  }
                                </td>

                                <td className="px-4 py-3 text-right tabular-nums">
                                  {
                                    money(
                                      row.stressedCashBalance,
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
        Liquidity Risk Center outputs are deterministic planning diagnostics. Stress calculations do not modify assumptions, actual observations, forecast baselines, or immutable model versions.
      </p>
    </div>
  );
}
