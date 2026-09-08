import type {
  Metadata,
} from "next";
import {
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  AnalysisSetupRequired,
} from "@/components/financial/analysis-setup-required";
import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
import {
  FinancialPageHeader,
} from "@/components/financial/financial-page-header";
import {
  FinancialTable,
  type FinancialTableColumn,
  type FinancialTableRow,
} from "@/components/financial/financial-table";
import {
  ForecastViewToggle,
} from "@/components/financial/forecast-view-toggle";
import {
  ScenarioSwitcher,
} from "@/components/scenarios/scenario-switcher";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  getFinancialAnalysis,
} from "@/lib/finance/analysis-context";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatCustomerValue,
  formatLongMonthKey,
  formatMonthKey,
  formatPercentageValue,
  formatRunway,
  formatRunwayDetail,
  resolveAnalysisTableView,
} from "@/lib/finance/formatting";

export const metadata: Metadata = {
  title: "Financial forecast",
};

export default async function ForecastPage({
  params,
  searchParams,
}: {
  params: Promise<{
    projectId: string;
  }>;

  searchParams?: Promise<{
    view?:
      | string
      | string[];

    scenario?:
      | string
      | string[];
  }>;
}) {
  const {
    projectId,
  } = await params;

  const resolvedSearchParams =
    await searchParams;

  const view =
    resolveAnalysisTableView(
      resolvedSearchParams
        ?.view,
    );

  const scenarioId =
    Array.isArray(
      resolvedSearchParams
        ?.scenario,
    )
      ? resolvedSearchParams
          ?.scenario[0]
      : resolvedSearchParams
          ?.scenario;

  const user =
    await requireUser();

  const analysis =
    await getFinancialAnalysis(
      user.id,
      projectId,
      scenarioId,
    );

  if (
    !analysis.ready
  ) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
        <FinancialPageHeader
          title="Financial forecast"
          description="Generate monthly and annual financial forecasts from your VentureScope assumptions."
        />

        <AnalysisSetupRequired
          projectId={
            projectId
          }
          missingSections={
            analysis.missingSections
          }
        />
      </div>
    );
  }

  const {
    forecast,
  } = analysis;

  const pathname =
    `/projects/${projectId}/forecast`;

  const columns: FinancialTableColumn[] =
    view ===
    "monthly"
      ? forecast.months.map(
          (
            month,
          ) => ({
            key:
              month.month,

            label:
              formatMonthKey(
                month.month,
              ),
          }),
        )
      : forecast.annual.map(
          (
            year,
          ) => ({
            key:
              String(
                year.year,
              ),

            label:
              String(
                year.year,
              ),

            detail:
              `${year.monthsIncluded} mo`,
          }),
        );

  const rows: FinancialTableRow[] =
    view ===
    "monthly"
      ? [
          {
            label:
              "Revenue",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.revenue,
                    forecast.currency,
                  ),
              ),

            kind:
              "total",
          },

          {
            label:
              "MRR",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.mrr,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "COGS",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.cogs,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Gross profit",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.grossProfit,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Gross margin",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatPercentageValue(
                    month.grossMarginPercentage,
                  ),
              ),

            kind:
              "metric",
          },

          {
            label:
              "Salaries",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.salaries,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Rent",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.rent,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Marketing",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.marketing,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Other operating expenses",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.otherOperatingExpenses,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "EBITDA",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.ebitda,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Net income",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.netIncome,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Operating cash flow",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.operatingCashFlow,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Ending cash",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.endingCash,
                    forecast.currency,
                  ),
              ),

            kind:
              "total",
          },

          {
            label:
              "Gross burn",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.grossBurn,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Net burn",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.netBurn,
                    forecast.currency,
                  ),
              ),
          },

          ...(
            forecast.revenueMode ===
            "CUSTOMER_DRIVEN"
              ? [
                  {
                    label:
                      "Active customers",

                    values:
                      forecast.months.map(
                        (
                          month,
                        ) =>
                          formatCustomerValue(
                            month.endingCustomers,
                          ),
                      ),

                    kind:
                      "metric" as const,
                  },
                ]
              : []
          ),
        ]
      : [
          {
            label:
              "Revenue",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.revenue,
                    forecast.currency,
                  ),
              ),

            kind:
              "total",
          },

          {
            label:
              "Ending MRR",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.endingMrr,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "COGS",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.cogs,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Gross profit",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.grossProfit,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Gross margin",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatPercentageValue(
                    year.grossMarginPercentage,
                  ),
              ),

            kind:
              "metric",
          },

          {
            label:
              "Salaries",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.salaries,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Rent",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.rent,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Marketing",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.marketing,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Other operating expenses",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.otherOperatingExpenses,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "EBITDA",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.ebitda,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Net income",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.netIncome,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Operating cash flow",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.operatingCashFlow,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Ending cash",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.endingCash,
                    forecast.currency,
                  ),
              ),

            kind:
              "total",
          },

          {
            label:
              "Average gross burn",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.averageGrossBurn,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Average net burn",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.averageNetBurn,
                    forecast.currency,
                  ),
              ),
          },

          ...(
            forecast.revenueMode ===
            "CUSTOMER_DRIVEN"
              ? [
                  {
                    label:
                      "Ending customers",

                    values:
                      forecast.annual.map(
                        (
                          year,
                        ) =>
                          formatCustomerValue(
                            year.endingCustomers,
                          ),
                      ),

                    kind:
                      "metric" as const,
                  },
                ]
              : []
          ),
        ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        title="Financial forecast"
        description="A deterministic monthly and annual forecast generated directly from the model's persisted assumptions."
        scenarioName={
          forecast.scenario
            .name
        }
        scenarioControl={
          <ScenarioSwitcher
            scenarios={analysis.project.scenarios.map(
              (
                scenario,
              ) => ({
                id:
                  scenario.id,

                name:
                  scenario.name,

                type:
                  scenario.type,
              }),
            )}
            currentScenarioId={
              analysis.selectedScenario
                ?.id ??
              ""
            }
          />
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FinancialKpiCard
          label="First-year revenue"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .firstYearRevenue,
            forecast.currency,
          )}
          detail="Calendar-year revenue inside the first forecast year."
          icon={
            CircleDollarSign
          }
        />

        <FinancialKpiCard
          label="Total forecast revenue"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .totalRevenue,
            forecast.currency,
          )}
          detail={`${forecast.horizonMonths}-month forecast total.`}
          icon={
            TrendingUp
          }
        />

        <FinancialKpiCard
          label="Ending cash"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .endingCash,
            forecast.currency,
          )}
          detail="Cash balance at the final forecast month."
          icon={
            Wallet
          }
        />

        <FinancialKpiCard
          label="Runway"
          value={formatRunway(
            forecast.metrics
              .runway,
          )}
          detail={formatRunwayDetail(
            forecast.metrics
              .runway,
          )}
          icon={
            Gauge
          }
        />

        <FinancialKpiCard
          label="Ending MRR"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .endingMrr,
            forecast.currency,
          )}
          detail={`ARR equivalent: ${formatCompactCurrencyValue(
            forecast.metrics
              .endingArr,
            forecast.currency,
          )}`}
          icon={
            Banknote
          }
        />

        <FinancialKpiCard
          label="Sustained break-even"
          value={
            forecast.metrics
              .breakEven
              .sustainedBreakEvenMonth
              ? formatLongMonthKey(
                  forecast.metrics
                    .breakEven
                    .sustainedBreakEvenMonth,
                )
              : "Not reached"
          }
          detail="First month of at least three consecutive EBITDA-positive months."
          icon={
            CalendarClock
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Forecast detail
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Values are generated by the shared financial engine, not calculated in the UI.
            </p>
          </div>

          <ForecastViewToggle
            pathname={
              pathname
            }
            view={
              view
            }
            scenarioId={
              analysis.selectedScenario
                ?.id
            }
          />
        </div>

        <FinancialTable
          caption={`${forecast.projectName} ${view} financial forecast`}
          columns={
            columns
          }
          rows={
            rows
          }
        />
      </section>
    </div>
  );
}
