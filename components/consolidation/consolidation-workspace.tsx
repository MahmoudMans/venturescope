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
  deleteWorkspaceFxRateAction,
  saveConsolidationSettingsAction,
  saveWorkspaceFxRateAction,
} from "@/app/(app)/projects/[projectId]/consolidation/actions";

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
  buildConsolidatedPortfolioReport,
} from "@/lib/finance/consolidation/calculations";

import {
  VENTURESCOPE_CURRENCIES,
  type ConsolidationProjectSource,
  type VentureScopeCurrency,
  type WorkspaceFxRateView,
} from "@/lib/finance/consolidation/types";


type Props = {
  projectId:
    string;

  generatedAt:
    string;

  editable:
    boolean;

  reportingCurrency:
    VentureScopeCurrency;

  rates:
    WorkspaceFxRateView[];

  projects:
    ConsolidationProjectSource[];
};


function money(
  amount:
    number |
    null,
  currency:
    string,
): string {
  if (
    amount ===
    null
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
          amount,
        ) >=
        1_000_000
          ?
            "compact"
          :
            "standard",

      maximumFractionDigits:
        2,
    },
  ).format(
    amount,
  );
}


export function ConsolidationWorkspace({
  projectId,
  generatedAt,
  editable,
  reportingCurrency,
  rates,
  projects,
}: Props) {
  const [
    asOfDate,
    setAsOfDate,
  ] =
    useState(
      generatedAt.slice(
        0,
        10,
      ),
    );


  const [
    forecasts,
    setForecasts,
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
    failures,
    setFailures,
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


  useEffect(
    () => {
      const controller =
        new AbortController();


      async function load() {
        const loaded:
          Record<
            string,
            string
          > =
            {};


        const failed:
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


                loaded[
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


                failed[
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


        setForecasts(
          loaded,
        );

        setFailures(
          failed,
        );

        setLoading(
          false,
        );
      }


      void load();


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
            const csv =
              forecasts[
                project.id
              ];


            if (
              csv ===
              undefined
            ) {
              return {
                projectId:
                  project.id,

                name:
                  project.name,

                industry:
                  project.industry,

                currency:
                  project.currency,

                latestActualPeriod:
                  project.latestActualPeriod,

                latestActualCash:
                  project.latestActualCash,

                capitalNeed:
                  null,

                forecastAvailable:
                  false,
              };
            }


            const rows =
              normalizeForecastCsv(
                csv,
              );


            const snapshot =
              buildExecutiveReviewSnapshot({
                capturedAt:
                  generatedAt,

                actuals:
                  project.actuals,

                forecasts:
                  rows,

                riskPolicy:
                  project.riskPolicy,

                latestActualPeriod:
                  project.latestActualPeriod,

                latestActualCash:
                  project.latestActualCash,

                actions:
                  project.actions,
              });


            return {
              projectId:
                project.id,

              name:
                project.name,

              industry:
                project.industry,

              currency:
                project.currency,

              latestActualPeriod:
                project.latestActualPeriod,

              latestActualCash:
                project.latestActualCash,

              capitalNeed:
                snapshot.kpis
                  .capitalNeed,

              forecastAvailable:
                true,
            };
          },
        ),
      [
        projects,
        forecasts,
        generatedAt,
      ],
    );


  const report =
    useMemo(
      () =>
        buildConsolidatedPortfolioReport({
          projects:
            analytics,

          reportingCurrency,

          asOfDate,

          rates,
        }),
      [
        analytics,
        reportingCurrency,
        asOfDate,
        rates,
      ],
    );


  if (
    loading
  ) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      <section className="rounded-xl border bg-background p-5">
        <h2 className="text-lg font-semibold">
          Consolidation policy
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Manual FX only. A rate of 1.10 for EUR/USD means 1 EUR = 1.10 USD. VentureScope uses the latest eligible direct rate as of the reporting date, then an inverse rate if available. It does not triangulate through a third currency or guess a missing rate.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Reporting currency
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {
                reportingCurrency
              }
            </p>
          </article>

          <label className="rounded-lg border p-4">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Consolidation as-of date
            </span>

            <input
              type="date"
              value={
                asOfDate
              }
              onChange={(
                event,
              ) => {
                setAsOfDate(
                  event.target.value,
                );
              }}
              className="mt-2 block h-10 rounded-lg border bg-background px-3 text-sm"
            />
          </label>
        </div>
      </section>

      {
        editable
          ?
            (
              <section className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-xl border bg-background p-5">
                  <h2 className="font-semibold">
                    Reporting currency
                  </h2>

                  <form
                    action={
                      saveConsolidationSettingsAction
                    }
                    className="mt-4 space-y-4"
                  >
                    <input
                      type="hidden"
                      name="projectId"
                      value={
                        projectId
                      }
                    />

                    <select
                      name="reportingCurrency"
                      aria-label="Reporting currency"
                      defaultValue={
                        reportingCurrency
                      }
                      className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                    >
                      {
                        VENTURESCOPE_CURRENCIES.map(
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

                    <PendingButton
                      className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
                    >
                      Save reporting currency
                    </PendingButton>
                  </form>
                </article>

                <article className="rounded-xl border bg-background p-5">
                  <h2 className="font-semibold">
                    Add or update manual FX rate
                  </h2>

                  <form
                    action={
                      saveWorkspaceFxRateAction
                    }
                    className="mt-4 grid gap-3 sm:grid-cols-2"
                  >
                    <input
                      type="hidden"
                      name="projectId"
                      value={
                        projectId
                      }
                    />

                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Base
                      </span>

                      <select
                        name="baseCurrency"
                        defaultValue="EUR"
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                      >
                        {
                          VENTURESCOPE_CURRENCIES.map(
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

                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Quote
                      </span>

                      <select
                        name="quoteCurrency"
                        defaultValue={
                          reportingCurrency
                        }
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                      >
                        {
                          VENTURESCOPE_CURRENCIES.map(
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

                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Rate
                      </span>

                      <input
                        required
                        min="0.00000001"
                        step="0.00000001"
                        type="number"
                        name="rate"
                        placeholder="1.10000000"
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        Effective date
                      </span>

                      <input
                        required
                        type="date"
                        name="effectiveDate"
                        defaultValue={
                          asOfDate
                        }
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                      />
                    </label>

                    <label className="space-y-1 sm:col-span-2">
                      <span className="text-xs text-muted-foreground">
                        Source / rationale
                      </span>

                      <input
                        required
                        minLength={
                          2
                        }
                        maxLength={
                          120
                        }
                        name="sourceLabel"
                        placeholder="ECB reference rate, bank quote, management planning rate..."
                        className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                      />
                    </label>

                    <div className="sm:col-span-2">
                      <PendingButton
                        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
                      >
                        Save FX rate
                      </PendingButton>
                    </div>
                  </form>
                </article>
              </section>
            )
          :
            (
              <section className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
                FX policy and rates are workspace governance settings. Viewer and Editor roles may use consolidated reporting, but only Workspace Owners may change the reporting currency or manual FX rates.
              </section>
            )
      }

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Consolidated cash
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              money(
                report.totalCash,
                reportingCurrency,
              )
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Consolidated capital need
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              money(
                report.totalCapitalNeed,
                reportingCurrency,
              )
            }
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Forecast ready
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {
              report.forecastReady
            }
            <span className="text-sm font-normal text-muted-foreground">
              {" / "}
              {
                report.projects
              }
            </span>
          </p>
        </article>

        <article className="rounded-xl border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Consolidation status
          </p>

          <p className={`mt-2 text-lg font-semibold ${
            report.complete
              ?
                "text-success"
              :
                "text-warning"
          }`}>
            {
              report.complete
                ?
                  "COMPLETE"
                :
                  "MISSING FX"
            }
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {
              report.missingCashRates
            } cash · {
              report.missingCapitalRates
            } capital gaps
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Consolidated project register
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Original and reporting-currency amounts remain visible side-by-side with the exact FX provenance used.
          </p>
        </div>

        <ScrollRegion label="Consolidated project register">
          <table className="w-full min-w-[1500px] text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left">
                  Project
                </th>

                <th className="px-4 py-3 text-left">
                  Source currency
                </th>

                <th className="px-4 py-3 text-right">
                  Actual cash
                </th>

                <th className="px-4 py-3 text-right">
                  Capital need
                </th>

                <th className="px-4 py-3 text-left">
                  FX
                </th>

                <th className="px-4 py-3 text-left">
                  Rate provenance
                </th>

                <th className="px-4 py-3 text-right">
                  Consolidated cash
                </th>

                <th className="px-4 py-3 text-right">
                  Consolidated capital
                </th>

                <th className="px-4 py-3 text-left">
                  Drill-down
                </th>
              </tr>
            </thead>

            <tbody>
              {
                report.rows.map(
                  (
                    row,
                  ) => (
                    <tr
                      key={
                        row.projectId
                      }
                      className="border-b align-top last:border-0"
                    >
                      <td className="px-4 py-3">
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
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {
                          row.sourceCurrency
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          money(
                            row.latestActualCash,
                            row.sourceCurrency,
                          )
                        }
                      </td>

                      <td className="px-4 py-3 text-right">
                        {
                          row.forecastAvailable
                            ?
                              money(
                                row.capitalNeed,
                                row.sourceCurrency,
                              )
                            :
                              (
                                <span
                                  title={
                                    failures[
                                      row.projectId
                                    ] ??
                                    "Forecast unavailable"
                                  }
                                  className="text-muted-foreground"
                                >
                                  Forecast unavailable
                                </span>
                              )
                        }
                      </td>

                      <td className="px-4 py-3">
                        {
                          row.resolvedFx
                            ?
                              (
                                <>
                                  <p className="font-mono text-xs">
                                    {
                                      row.resolvedFx.rate
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {
                                      row.resolvedFx.direction
                                    }
                                  </p>
                                </>
                              )
                            :
                              (
                                <span className="font-semibold text-warning">
                                  MISSING
                                </span>
                              )
                        }
                      </td>

                      <td className="max-w-sm px-4 py-3 text-xs">
                        {
                          row.resolvedFx
                            ?
                              (
                                <>
                                  <p>
                                    {
                                      row.resolvedFx.sourceLabel
                                    }
                                  </p>

                                  <p className="mt-1 text-muted-foreground">
                                    {
                                      row.resolvedFx.effectiveDate ??
                                      "Identity"
                                    }
                                  </p>
                                </>
                              )
                            :
                              "No eligible direct or inverse rate"
                        }
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {
                          row.consolidatedCash !==
                          null
                            ?
                              money(
                                row.consolidatedCash,
                                reportingCurrency,
                              )
                            :
                              (
                                <span className="text-warning">
                                  Missing FX
                                </span>
                              )
                        }
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {
                          row.consolidatedCapitalNeed !==
                          null
                            ?
                              money(
                                row.consolidatedCapitalNeed,
                                reportingCurrency,
                              )
                            :
                          row.capitalNeed ===
                            null
                            ?
                              "—"
                            :
                              (
                                <span className="text-warning">
                                  Missing FX
                                </span>
                              )
                        }
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/projects/${row.projectId}/portfolio`}
                            className="touch-link rounded border px-2 py-1 text-xs"
                          >
                            Portfolio
                          </Link>

                          <Link
                            href={`/projects/${row.projectId}/board-pack`}
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
      </section>

      <section className="overflow-hidden rounded-xl border bg-background">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">
            Manual FX rate register
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Rates are workspace-scoped and dated. Newer eligible rates supersede older rates for later consolidation dates without deleting history.
          </p>
        </div>

        {
          rates.length ===
          0
            ?
              (
                <div className="p-8 text-sm text-muted-foreground">
                  No manual FX rates have been configured yet.
                </div>
              )
            :
              (
                <ScrollRegion label="Manual FX rate register">
                  <table className="w-full min-w-[1000px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left">
                          Effective
                        </th>

                        <th className="px-4 py-3 text-left">
                          Pair
                        </th>

                        <th className="px-4 py-3 text-right">
                          Rate
                        </th>

                        <th className="px-4 py-3 text-left">
                          Source
                        </th>

                        <th className="px-4 py-3 text-left">
                          Created by
                        </th>

                        <th className="px-4 py-3 text-left">
                          Governance
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {
                        rates.map(
                          (
                            rate,
                          ) => (
                            <tr
                              key={
                                rate.id
                              }
                              className="border-b last:border-0"
                            >
                              <td className="px-4 py-3">
                                {
                                  rate.effectiveDate
                                }
                              </td>

                              <td className="px-4 py-3 font-semibold">
                                {
                                  rate.baseCurrency
                                }
                                /
                                {
                                  rate.quoteCurrency
                                }
                              </td>

                              <td className="px-4 py-3 text-right font-mono">
                                {
                                  rate.rate
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  rate.sourceLabel
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  rate.createdBy ??
                                  "Unavailable"
                                }
                              </td>

                              <td className="px-4 py-3">
                                {
                                  editable
                                    ?
                                      (
                                        <ConfirmAction
                                          action={deleteWorkspaceFxRateAction}
                                          fields={{ projectId, rateId: rate.id }}
                                          title="Delete this exchange rate?"
                                          description="Conversions that need this rate will be reported as missing until you add another one."
                                          confirmLabel="Delete rate"
                                          triggerVariant="outline"
                                          triggerClassName="text-destructive hover:text-destructive"
                                        >
                                          Delete
                                        </ConfirmAction>
                                      )
                                    :
                                      "Owner-managed"
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

      <section className="rounded-xl border bg-muted/20 p-5">
        <h2 className="font-semibold">
          Multi-currency integrity
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Consolidated totals include only amounts that can be converted using an eligible direct or inverse workspace rate as of the selected date. Missing rates are surfaced explicitly rather than replaced with stale, guessed, external, or triangulated values. Original project-currency amounts remain authoritative.
        </p>
      </section>
    </div>
  );
}
