import type {
  Metadata,
} from "next";
import {
  ArrowDownToLine,
  Banknote,
  CircleDollarSign,
  Flame,
  Gauge,
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
  requireUser,
} from "@/lib/auth/require-user";
import {
  getBaseFinancialAnalysis,
} from "@/lib/finance/analysis-context";
import {
  aggregateCashAnalytics,
  calculateCashForecastSummary,
} from "@/lib/finance/cash-analytics";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatExpenseCurrencyValue,
  formatMonthKey,
  formatRunway,
  formatRunwayDetail,
  resolveAnalysisTableView,
} from "@/lib/finance/formatting";

export const metadata: Metadata = {
  title: "Cash flow",
};

export default async function CashFlowPage({
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

  const user =
    await requireUser();

  const analysis =
    await getBaseFinancialAnalysis(
      user.id,
      projectId,
    );

  if (
    !analysis.ready
  ) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
        <FinancialPageHeader
          title="Simplified cash-flow forecast"
          description="Understand operating cash flow, financing, debt repayment, burn and runway."
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

  const cashSummary =
    calculateCashForecastSummary(
      forecast.months,
    );

  const annualCash =
    aggregateCashAnalytics(
      forecast.months,
    );

  const pathname =
    `/projects/${projectId}/cash-flow`;

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
      : annualCash.map(
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
              "Opening cash",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.openingCash,
                    forecast.currency,
                  ),
              ),

            kind:
              "total",
          },

          {
            label:
              "Operating cash inflow",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.operatingCashInflow,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Operating cash outflow",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatExpenseCurrencyValue(
                    month.operatingCashOutflow,
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

            kind:
              "subtotal",
          },

          {
            label:
              "Financing inflow",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.financingInflows
                      .total,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Debt principal repayment",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatExpenseCurrencyValue(
                    month.debtPrincipalRepayment,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Net cash movement",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.netCashMovement,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
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

            kind:
              "metric",
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

            kind:
              "metric",
          },
        ]
      : [
          {
            label:
              "Opening cash",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.openingCash,
                    forecast.currency,
                  ),
              ),

            kind:
              "total",
          },

          {
            label:
              "Operating cash inflow",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.operatingCashInflow,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Operating cash outflow",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatExpenseCurrencyValue(
                    year.operatingCashOutflow,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Operating cash flow",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.operatingCashFlow,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Financing inflow",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.financingInflow,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Debt principal repayment",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatExpenseCurrencyValue(
                    year.debtPrincipalRepayment,
                    forecast.currency,
                  ),
              ),
          },

          {
            label:
              "Net cash movement",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.netCashMovement,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Ending cash",

            values:
              annualCash.map(
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
              annualCash.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.averageGrossBurn,
                    forecast.currency,
                  ),
              ),

            kind:
              "metric",
          },

          {
            label:
              "Average net burn",

            values:
              annualCash.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.averageNetBurn,
                    forecast.currency,
                  ),
              ),

            kind:
              "metric",
          },
        ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        title="Simplified cash-flow forecast"
        description="Track operating cash generation, financing inflows, debt repayments, burn rate and projected runway."
        scenarioName={
          forecast.scenario
            .name
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FinancialKpiCard
          label="Starting cash"
          value={formatCompactCurrencyValue(
            cashSummary.startingCash,
            forecast.currency,
          )}
          detail="Opening cash at the beginning of the forecast."
          icon={
            Wallet
          }
        />

        <FinancialKpiCard
          label="Ending cash"
          value={formatCompactCurrencyValue(
            cashSummary.endingCash,
            forecast.currency,
          )}
          detail="Projected cash at the final forecast month."
          icon={
            CircleDollarSign
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
          label="3-mo avg net burn"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .initialThreeMonthAverageNetBurn,
            forecast.currency,
          )}
          detail="Average net burn across the first three forecast months."
          icon={
            Flame
          }
        />

        <FinancialKpiCard
          label="3-mo avg gross burn"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .initialThreeMonthAverageGrossBurn,
            forecast.currency,
          )}
          detail="Average recurring operating cash outflow before revenue."
          icon={
            ArrowDownToLine
          }
        />

        <FinancialKpiCard
          label="Total financing"
          value={formatCompactCurrencyValue(
            cashSummary.totalFinancingInflow,
            forecast.currency,
          )}
          detail="Equity, debt, grants and other financing during the forecast."
          icon={
            Banknote
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Cash-flow detail
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Financing affects cash but is never counted as operating revenue.
            </p>
          </div>

          <ForecastViewToggle
            pathname={
              pathname
            }
            view={
              view
            }
          />
        </div>

        <FinancialTable
          caption={`${forecast.projectName} ${view} cash-flow forecast`}
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
