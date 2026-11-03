"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { ScrollRegion } from "@/components/ui/scroll-region";
import {
  calculateAdvancedAnalytics,
  normalizeForecastCsv,
  type ForecastAnalyticsRow,
} from "@/lib/finance/analytics";


type Props = {
  projectId:
    string;

  projectName:
    string;

  currency:
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


function multiple(
  value:
    number |
    null,
): string {
  return (
    value ===
      null ||
    !Number.isFinite(
      value,
    )
  )
    ?
      "—"
    :
      `${value.toFixed(1)}×`;
}


function months(
  value:
    number |
    null,
): string {
  return (
    value ===
      null ||
    !Number.isFinite(
      value,
    )
  )
    ?
      "—"
    :
      `${value.toFixed(1)} mo`;
}


function MetricCard({
  label,
  value,
  detail,
}: {
  label:
    string;

  value:
    string;

  detail:
    string;
}) {
  return (
    <article className="rounded-xl border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {
          label
        }
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {
          value
        }
      </p>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {
          detail
        }
      </p>
    </article>
  );
}


export function AdvancedFinancialAnalytics({
  projectId,
  projectName,
  currency,
}: Props) {
  const [
    rows,
    setRows,
  ] =
    useState<
      ForecastAnalyticsRow[]
    >(
      [],
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
    discountRate,
    setDiscountRate,
  ] =
    useState(
      0.15,
    );


  const [
    terminalGrowthRate,
    setTerminalGrowthRate,
  ] =
    useState(
      0.03,
    );


  useEffect(
    () => {
      const controller =
        new AbortController();


      async function load() {
        setLoading(
          true,
        );

        setError(
          null,
        );


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


          const csv =
            await response.text();


          const normalized =
            normalizeForecastCsv(
              csv,
            );


          if (
            normalized.length ===
            0
          ) {
            throw new Error(
              "The current forecast export does not contain recognizable monthly financial rows.",
            );
          }


          setRows(
            normalized,
          );
        }
        catch (
          cause
        ) {
          if (
            controller.signal
              .aborted
          ) {
            return;
          }


          setError(
            cause instanceof Error
              ?
                cause.message
              :
                "Unable to load advanced analytics.",
          );
        }
        finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(
              false,
            );
          }
        }
      }


      void load();


      return () => {
        controller.abort();
      };
    },
    [
      projectId,
    ],
  );


  const analytics =
    useMemo(
      () =>
        calculateAdvancedAnalytics(
          rows,
          {
            discountRate,

            terminalGrowthRate,
          },
        ),
      [
        rows,
        discountRate,
        terminalGrowthRate,
      ],
    );


  if (
    loading
  ) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }


  if (
    error
  ) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-5"
      >
        <h2 className="font-semibold text-destructive">
          Analytics unavailable
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {
            error
          }
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          Complete enough model assumptions to produce a forecast, then return here.
        </p>
      </section>
    );
  }


  const dcf =
    analytics.dcf;


  const operating =
    analytics.operating;


  const unit =
    analytics.unitEconomics;


  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="DCF enterprise value"
          value={
            money(
              dcf?.enterpriseValue ??
              null,
              currency,
            )
          }
          detail="Present value of forecast cash flows plus terminal value."
        />

        <MetricCard
          label="Equity value proxy"
          value={
            money(
              dcf?.equityValueProxy ??
              null,
              currency,
            )
          }
          detail="Enterprise value plus modeled ending cash; debt is not netted here."
        />

        <MetricCard
          label="Rule of 40"
          value={
            percent(
              operating.ruleOf40,
            )
          }
          detail="Trailing revenue growth plus EBITDA margin."
        />

        <MetricCard
          label="Burn multiple"
          value={
            multiple(
              operating.burnMultiple,
            )
          }
          detail="Trailing net burn divided by modeled net-new ARR."
        />

        <MetricCard
          label="LTV / CAC"
          value={
            multiple(
              unit.ltvToCac,
            )
          }
          detail="Modeled customer lifetime value divided by acquisition cost."
        />

        <MetricCard
          label="CAC payback"
          value={
            months(
              unit.cacPaybackMonths,
            )
          }
          detail="Months of gross-margin contribution required to recover CAC."
        />
      </section>

      <section className="rounded-xl border bg-background p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Valuation
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              DCF assumptions
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              VentureScope discounts modeled annual cash flows and applies a Gordon-growth terminal value. These are planning assumptions, not investment advice.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium">
                Discount rate
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="80"
                  step="0.5"
                  value={
                    Number(
                      (
                        discountRate *
                        100
                      ).toFixed(
                        2,
                      ),
                    )
                  }
                  onChange={(
                    event,
                  ) => {
                    setDiscountRate(
                      Number(
                        event.target
                          .value,
                      ) /
                        100,
                    );
                  }}
                  className="h-10 w-28 rounded-lg border bg-background px-3 text-sm"
                />

                <span className="text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium">
                Terminal growth
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="-5"
                  max="15"
                  step="0.25"
                  value={
                    Number(
                      (
                        terminalGrowthRate *
                        100
                      ).toFixed(
                        2,
                      ),
                    )
                  }
                  onChange={(
                    event,
                  ) => {
                    setTerminalGrowthRate(
                      Number(
                        event.target
                          .value,
                      ) /
                        100,
                    );
                  }}
                  className="h-10 w-28 rounded-lg border bg-background px-3 text-sm"
                />

                <span className="text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </label>
          </div>
        </div>

        {
          dcf
            ?
              (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Forecast PV"
                    value={
                      money(
                        dcf.presentValueOfForecast,
                        currency,
                      )
                    }
                    detail="Present value of explicit modeled cash flows."
                  />

                  <MetricCard
                    label="Terminal-value PV"
                    value={
                      money(
                        dcf.presentValueOfTerminalValue,
                        currency,
                      )
                    }
                    detail="Discounted terminal value contribution."
                  />

                  <MetricCard
                    label="Ending cash"
                    value={
                      money(
                        operating.endingCashBalance,
                        currency,
                      )
                    }
                    detail="Ending modeled cash used in the equity-value proxy."
                  />
                </div>
              )
            :
              (
                <div className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  DCF requires a positive discount rate greater than terminal growth and at least one usable forecast period.
                </div>
              )
        }
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <p className="text-sm font-medium text-muted-foreground">
            Decision support
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            DCF sensitivity matrix
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Rows vary terminal growth; columns vary discount rate.
          </p>
        </div>

        <ScrollRegion label="DCF sensitivity matrix">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium">
                  Terminal growth
                </th>

                {
                  analytics.sensitivity.discountRates.map(
                    (
                      rate,
                    ) => (
                      <th
                        key={
                          rate
                        }
                        className="px-4 py-3 text-right font-medium"
                      >
                        {
                          percent(
                            rate,
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
                analytics.sensitivity.terminalGrowthRates.map(
                  (
                    growth,
                  ) => (
                    <tr
                      key={
                        growth
                      }
                      className="border-b last:border-0"
                    >
                      <th className="px-4 py-3 text-left font-medium">
                        {
                          percent(
                            growth,
                          )
                        }
                      </th>

                      {
                        analytics.sensitivity.discountRates.map(
                          (
                            discount,
                          ) => {
                            const cell =
                              analytics.sensitivity.cells.find(
                                (
                                  candidate,
                                ) =>
                                  candidate.discountRate ===
                                    discount &&
                                  candidate.terminalGrowthRate ===
                                    growth,
                              );


                            return (
                              <td
                                key={
                                  discount
                                }
                                className="px-4 py-3 text-right tabular-nums"
                              >
                                {
                                  money(
                                    cell?.enterpriseValue ??
                                    null,
                                    currency,
                                  )
                                }
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
        </ScrollRegion>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-background p-5">
          <h2 className="font-semibold">
            Operating efficiency
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                Trailing revenue
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  money(
                    operating.trailingRevenue,
                    currency,
                  )
                }
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                Revenue growth
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  percent(
                    operating.revenueGrowthRate,
                  )
                }
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                EBITDA margin
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  percent(
                    operating.ebitdaMarginRate,
                  )
                }
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                Contribution / gross margin
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  percent(
                    operating.contributionMarginRate,
                  )
                }
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-background p-5">
          <h2 className="font-semibold">
            Unit economics
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                Monthly ARPU
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  money(
                    unit.monthlyArpu,
                    currency,
                  )
                }
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                CAC
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  money(
                    unit.cac,
                    currency,
                  )
                }
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                Lifetime value
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  money(
                    unit.lifetimeValue,
                    currency,
                  )
                }
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">
                Churn rate
              </dt>

              <dd className="font-medium tabular-nums">
                {
                  percent(
                    unit.churnRate,
                  )
                }
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {
        dcf?.annualCashFlows.length
          ?
            (
              <section className="overflow-hidden rounded-xl border bg-background">
                <div className="border-b p-5">
                  <h2 className="font-semibold">
                    Annual valuation cash flows
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Derived from the authoritative monthly forecast export for {
                      projectName
                    }.
                  </p>
                </div>

                <ScrollRegion label="Annual valuation cash flows">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Year
                        </th>

                        <th className="px-4 py-3 text-right">
                          Revenue
                        </th>

                        <th className="px-4 py-3 text-right">
                          EBITDA
                        </th>

                        <th className="px-4 py-3 text-right">
                          Cash-flow proxy
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        dcf.annualCashFlows.map(
                          (
                            year,
                          ) => (
                            <tr
                              key={
                                year.year
                              }
                              className="border-b last:border-0"
                            >
                              <td className="px-4 py-3 font-medium">
                                Year {
                                  year.year
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  money(
                                    year.revenue,
                                    currency,
                                  )
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  money(
                                    year.ebitda,
                                    currency,
                                  )
                                }
                              </td>

                              <td className="px-4 py-3 text-right tabular-nums">
                                {
                                  money(
                                    year.freeCashFlow,
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
            )
          :
            null
      }

      <p className="text-xs leading-5 text-muted-foreground">
        Parsed {
          analytics.rowCount
        } forecast rows. Advanced analytics are deterministic planning outputs derived from your VentureScope forecast and should not be treated as accounting, tax, or investment advice.
      </p>
    </div>
  );
}
