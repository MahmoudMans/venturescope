import type {
  Metadata,
} from "next";
import {
  BadgeDollarSign,
  CircleDollarSign,
  Landmark,
  Percent,
  ReceiptText,
  TrendingUp,
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
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatExpenseCurrencyValue,
  formatMonthKey,
  formatPercentageValue,
  resolveAnalysisTableView,
} from "@/lib/finance/formatting";

export const metadata: Metadata = {
  title: "P&L",
};

export default async function ProfitAndLossPage({
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
          title="Profit & loss"
          description="Review revenue, gross profit, operating expenses, EBITDA and net income."
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
    `/projects/${projectId}/pnl`;

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
              "Cost of goods sold",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatExpenseCurrencyValue(
                    month.cogs,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
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
                  formatExpenseCurrencyValue(
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
                  formatExpenseCurrencyValue(
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
                  formatExpenseCurrencyValue(
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
                  formatExpenseCurrencyValue(
                    month.otherOperatingExpenses,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Total operating expenses",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatExpenseCurrencyValue(
                    month.totalOperatingExpenses,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
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
              "total",
          },

          {
            label:
              "EBITDA margin",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatPercentageValue(
                    month.ebitdaMarginPercentage,
                  ),
              ),

            kind:
              "metric",
          },

          {
            label:
              "Interest",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatExpenseCurrencyValue(
                    month.interestExpense,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Profit before tax",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.profitBeforeTax,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Tax",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatExpenseCurrencyValue(
                    month.tax,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
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

            kind:
              "total",
          },

          {
            label:
              "Net margin",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatPercentageValue(
                    month.netMarginPercentage,
                  ),
              ),

            kind:
              "metric",
          },
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
              "Cost of goods sold",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatExpenseCurrencyValue(
                    year.cogs,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
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
                  formatExpenseCurrencyValue(
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
                  formatExpenseCurrencyValue(
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
                  formatExpenseCurrencyValue(
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
                  formatExpenseCurrencyValue(
                    year.otherOperatingExpenses,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Total operating expenses",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatExpenseCurrencyValue(
                    year.totalOperatingExpenses,
                    forecast.currency,
                  ),
              ),

            kind:
              "subtotal",
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
              "total",
          },

          {
            label:
              "EBITDA margin",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatPercentageValue(
                    year.ebitdaMarginPercentage,
                  ),
              ),

            kind:
              "metric",
          },

          {
            label:
              "Interest",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatExpenseCurrencyValue(
                    year.interestExpense,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Tax",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatExpenseCurrencyValue(
                    year.tax,
                    forecast.currency,
                  ),
              ),

            indent:
              true,
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

            kind:
              "total",
          },

          {
            label:
              "Net margin",

            values:
              forecast.annual.map(
                (
                  year,
                ) =>
                  formatPercentageValue(
                    year.netMarginPercentage,
                  ),
              ),

            kind:
              "metric",
          },
        ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        title="Profit & loss"
        description="Revenue, direct costs, operating expenses, profitability and tax across the Base Case forecast."
        scenarioName={
          forecast.scenario
            .name
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FinancialKpiCard
          label="Revenue"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .totalRevenue,
            forecast.currency,
          )}
          detail="Total forecast revenue."
          icon={
            CircleDollarSign
          }
        />

        <FinancialKpiCard
          label="Gross profit"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .totalGrossProfit,
            forecast.currency,
          )}
          detail="Revenue after COGS."
          icon={
            TrendingUp
          }
        />

        <FinancialKpiCard
          label="EBITDA"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .totalEbitda,
            forecast.currency,
          )}
          detail="Total operating profitability before interest and tax."
          icon={
            BadgeDollarSign
          }
        />

        <FinancialKpiCard
          label="Net income"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .totalNetIncome,
            forecast.currency,
          )}
          detail="Forecast income after interest and tax."
          icon={
            Landmark
          }
        />

        <FinancialKpiCard
          label="Gross margin"
          value={formatPercentageValue(
            forecast.metrics
              .grossMarginPercentage,
          )}
          detail="Gross profit as a percentage of revenue."
          icon={
            Percent
          }
        />

        <FinancialKpiCard
          label="EBITDA margin"
          value={formatPercentageValue(
            forecast.metrics
              .ebitdaMarginPercentage,
          )}
          detail="EBITDA as a percentage of revenue."
          icon={
            ReceiptText
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              P&L statement
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Simplified planning P&L. VentureScope is not a statutory accounting system.
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
          caption={`${forecast.projectName} ${view} profit and loss`}
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
