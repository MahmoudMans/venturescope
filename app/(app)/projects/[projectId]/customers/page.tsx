import type {
  Metadata,
} from "next";
import {
  ArrowRight,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

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
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  requireUser,
} from "@/lib/auth/require-user";
import {
  getBaseFinancialAnalysis,
} from "@/lib/finance/analysis-context";
import {
  aggregateCustomerAnalytics,
  calculateCustomerForecastSummary,
} from "@/lib/finance/customer-analytics";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatCustomerValue,
  formatMonthKey,
  resolveAnalysisTableView,
} from "@/lib/finance/formatting";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function CustomersPage({
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
          title="Customer analytics"
          description="Understand acquisition, churn, active customers, ARPU and MRR."
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

  if (
    forecast.revenueMode !==
    "CUSTOMER_DRIVEN"
  ) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
        <FinancialPageHeader
          title="Customer analytics"
          description="Customer acquisition and churn analytics are available for customer-driven financial models."
          scenarioName={
            forecast.scenario
              .name
          }
        />

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
              <Users
                className="size-5"
                aria-hidden="true"
              />
            </div>

            <CardTitle className="mt-4">
              This model uses direct revenue forecasting
            </CardTitle>

            <CardDescription className="max-w-2xl leading-6">
              Direct revenue models do not derive revenue from customers, CAC or churn, so customer analytics are intentionally unavailable.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              asChild
              variant="outline"
            >
              <Link
                href={`/projects/${projectId}/revenue`}
              >
                Review revenue assumptions

                <ArrowRight
                  className="size-4"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summary =
    calculateCustomerForecastSummary(
      forecast.months,
    );

  const annualCustomers =
    aggregateCustomerAnalytics(
      forecast.months,
    );

  const pathname =
    `/projects/${projectId}/customers`;

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
      : annualCustomers.map(
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
              "Opening customers",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCustomerValue(
                    month.openingCustomers,
                  ),
              ),
          },

          {
            label:
              "Paid new customers",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCustomerValue(
                    month.paidNewCustomers,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Organic new customers",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCustomerValue(
                    month.organicNewCustomers,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Total new customers",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCustomerValue(
                    month.newCustomers,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Churned customers",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCustomerValue(
                    month.churnedCustomers,
                  ),
              ),
          },

          {
            label:
              "Ending customers",

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
              "total",
          },

          {
            label:
              "ARPU",

            values:
              forecast.months.map(
                (
                  month,
                ) =>
                  formatCurrencyValue(
                    month.arpu ??
                    "0",
                    forecast.currency,
                    {
                      maximumFractionDigits:
                        2,
                    },
                  ),
              ),

            kind:
              "metric",
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

            kind:
              "total",
          },
        ]
      : [
          {
            label:
              "Opening customers",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCustomerValue(
                    year.openingCustomers,
                  ),
              ),
          },

          {
            label:
              "Paid new customers",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCustomerValue(
                    year.paidNewCustomers,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Organic new customers",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCustomerValue(
                    year.organicNewCustomers,
                  ),
              ),

            indent:
              true,
          },

          {
            label:
              "Total new customers",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCustomerValue(
                    year.newCustomers,
                  ),
              ),

            kind:
              "subtotal",
          },

          {
            label:
              "Churned customers",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCustomerValue(
                    year.churnedCustomers,
                  ),
              ),
          },

          {
            label:
              "Net customer growth",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCustomerValue(
                    year.netCustomerGrowth,
                  ),
              ),
          },

          {
            label:
              "Ending customers",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCustomerValue(
                    year.endingCustomers,
                  ),
              ),

            kind:
              "total",
          },

          {
            label:
              "Ending ARPU",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.endingArpu,
                    forecast.currency,
                    {
                      maximumFractionDigits:
                        2,
                    },
                  ),
              ),

            kind:
              "metric",
          },

          {
            label:
              "Ending MRR",

            values:
              annualCustomers.map(
                (
                  year,
                ) =>
                  formatCurrencyValue(
                    year.endingMrr,
                    forecast.currency,
                  ),
              ),

            kind:
              "total",
          },
        ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        title="Customer analytics"
        description="Track paid acquisition, organic growth, churn, active customers, ARPU and recurring revenue."
        scenarioName={
          forecast.scenario
            .name
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FinancialKpiCard
          label="Ending customers"
          value={formatCustomerValue(
            summary.endingCustomers,
          )}
          detail={`Starting customers: ${formatCustomerValue(
            summary.startingCustomers,
          )}`}
          icon={
            Users
          }
        />

        <FinancialKpiCard
          label="New customers"
          value={formatCustomerValue(
            summary.totalNewCustomers,
          )}
          detail={`${formatCustomerValue(
            summary.totalPaidNewCustomers,
          )} paid + ${formatCustomerValue(
            summary.totalOrganicNewCustomers,
          )} organic`}
          icon={
            UserPlus
          }
        />

        <FinancialKpiCard
          label="Customers churned"
          value={formatCustomerValue(
            summary.totalChurnedCustomers,
          )}
          detail="Total churn across the forecast horizon."
          icon={
            UserMinus
          }
        />

        <FinancialKpiCard
          label="Net customer growth"
          value={formatCustomerValue(
            summary.netCustomerGrowth,
          )}
          detail="Ending customers minus starting customers."
          icon={
            summary.netCustomerGrowth.startsWith(
              "-",
            )
              ? TrendingDown
              : TrendingUp
          }
        />

        <FinancialKpiCard
          label="Ending ARPU"
          value={formatCurrencyValue(
            summary.endingArpu,
            forecast.currency,
            {
              maximumFractionDigits:
                2,
            },
          )}
          detail="Average monthly revenue per active customer."
          icon={
            CircleDollarSign
          }
        />

        <FinancialKpiCard
          label="Ending MRR"
          value={formatCompactCurrencyValue(
            summary.endingMrr,
            forecast.currency,
          )}
          detail="Recurring revenue generated by ending active customers."
          icon={
            TrendingUp
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Customer forecast
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Forecast customer counts are internally fractional and rounded only for display.
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
          caption={`${forecast.projectName} ${view} customer forecast`}
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
