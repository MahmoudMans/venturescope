import type {
  Metadata,
} from "next";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  LockKeyhole,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import {
  FinancialDashboardCharts,
} from "@/components/dashboard/financial-dashboard-charts";
import {
  DemoScenarioTable,
} from "@/components/demo/demo-scenario-table";
import {
  DemoScenarioTabs,
} from "@/components/demo/demo-scenario-tabs";
import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
import {
  FinancialTable,
  type FinancialTableColumn,
  type FinancialTableRow,
} from "@/components/financial/financial-table";
import {
  ScenarioComparisonChart,
} from "@/components/scenarios/scenario-comparison-chart";
import {
  VentureScopeLogo,
} from "@/components/brand/venturescope-logo";
import {
  ThemeToggle,
} from "@/components/theme/theme-toggle";
import {
  Badge,
} from "@/components/ui/badge";
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
  buildFinancialDashboardData,
} from "@/lib/finance/dashboard-data";
import {
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatCustomerValue,
  formatLongMonthKey,
  formatPercentageValue,
  formatRunway,
  formatRunwayDetail,
} from "@/lib/finance/formatting";
import {
  buildOrbitAnalyticsDemoForecast,
  buildOrbitAnalyticsScenarioComparison,
  getOrbitAnalyticsScenario,
  ORBIT_ANALYTICS_SCENARIOS,
  orbitAnalyticsDemoAssumptions,
  orbitAnalyticsDemoOverrideCount,
} from "@/lib/demo/orbit-analytics";

export const metadata: Metadata = {
  title:
    "Live Demo",

  description:
    "Explore VentureScope with the public Orbit Analytics financial model.",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams?: Promise<{
    scenario?:
      | string
      | string[];
  }>;
}) {
  const resolved =
    await searchParams;

  const requestedScenario =
    Array.isArray(
      resolved?.scenario,
    )
      ? resolved
          ?.scenario[0]
      : resolved
          ?.scenario;

  const scenario =
    getOrbitAnalyticsScenario(
      requestedScenario,
    );

  const forecast =
    buildOrbitAnalyticsDemoForecast(
      scenario.id,
    );

  const comparison =
    buildOrbitAnalyticsScenarioComparison();

  const assumptions =
    orbitAnalyticsDemoAssumptions();

  const dashboardData =
    buildFinancialDashboardData(
      forecast.months,
      forecast.revenueMode,
    );

  const annualColumns: FinancialTableColumn[] =
    forecast.annual.map(
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

  const annualRows: FinancialTableRow[] =
    [
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
          "metric",
      },
    ];

  return (
    <div className="min-h-svh bg-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 lg:px-8">
          <VentureScopeLogo />

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden sm:inline-flex"
            >
              PUBLIC DEMO
            </Badge>

            <ThemeToggle />

            <Button
              asChild
              variant="ghost"
              className="hidden sm:inline-flex"
            >
              <Link href="/login">
                Sign in
              </Link>
            </Button>

            <Button asChild>
              <Link href="/register">
                Create account
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b bg-background">
          <div className="mx-auto max-w-[1600px] px-5 py-10 lg:px-8 lg:py-14">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge>
                ORBIT ANALYTICS
              </Badge>

              <Badge variant="outline">
                SaaS
              </Badge>

              <Badge variant="outline">
                36-month forecast
              </Badge>

              <Badge variant="outline">
                EUR
              </Badge>
            </div>

            <div className="grid items-end gap-8 xl:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles
                    className="size-4"
                    aria-hidden="true"
                  />

                  VentureScope portfolio demonstration
                </div>

                <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Explore a complete startup financial model.
                </h1>

                <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground">
                  Orbit Analytics is a deterministic sample company bundled with VentureScope.
                  Switch scenarios, inspect forecasts, compare cash outcomes and explore the same
                  financial engine available inside private workspaces.
                </p>
              </div>

              <div className="space-y-3">
                <DemoScenarioTabs
                  scenarios={
                    ORBIT_ANALYTICS_SCENARIOS
                  }
                  activeScenarioId={
                    scenario.id ??
                    "demo-base"
                  }
                />

                <p className="text-right text-xs text-muted-foreground">
                  Current view:{" "}
                  <span className="font-medium text-foreground">
                    {
                      scenario.name
                    }
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
              <LockKeyhole
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-muted-foreground">
                This page is read-only and uses bundled demonstration data.
                No private VentureScope project or user information is exposed.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1600px] space-y-10 px-5 py-10 lg:px-8 lg:py-12">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <FinancialKpiCard
              label="First-year revenue"
              value={formatCompactCurrencyValue(
                forecast.metrics
                  .firstYearRevenue,
                forecast.currency,
              )}
              detail="First forecast calendar year."
              icon={
                CircleDollarSign
              }
            />

            <FinancialKpiCard
              label="First-year EBITDA"
              value={formatCompactCurrencyValue(
                forecast.metrics
                  .firstYearEbitda,
                forecast.currency,
              )}
              detail={`Margin ${formatPercentageValue(
                forecast.metrics
                  .ebitdaMarginPercentage,
              )}`}
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
              detail="Final projected cash position."
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
              detail={`ARR ${formatCompactCurrencyValue(
                forecast.metrics
                  .endingArr,
                forecast.currency,
              )}`}
              icon={
                Banknote
              }
            />

            <FinancialKpiCard
              label="Break-even"
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
              detail="Three consecutive EBITDA-positive months."
              icon={
                CalendarClock
              }
            />
          </section>

          <section>
            <FinancialDashboardCharts
              data={
                dashboardData
              }
              currency={
                forecast.currency
              }
              sustainedBreakEvenMonth={
                forecast.metrics
                  .breakEven
                  .sustainedBreakEvenMonth
              }
            />
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Scenario comparison
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Base, Bull and Bear run independently through the exact same financial engine.
                Only their scenario modifiers differ.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>
                    Financial outcomes
                  </CardTitle>

                  <CardDescription>
                    First-year revenue, EBITDA and ending cash.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ScenarioComparisonChart
                    comparison={
                      comparison
                    }
                    currency={
                      forecast.currency
                    }
                  />
                </CardContent>
              </Card>

              <div>
                <DemoScenarioTable
                  comparison={
                    comparison
                  }
                  currency={
                    forecast.currency
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Annual forecast
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Calendar-year financial aggregation for {
                  scenario.name
                }.
              </p>
            </div>

            <FinancialTable
              caption={`Orbit Analytics ${scenario.name} annual forecast`}
              columns={
                annualColumns
              }
              rows={
                annualRows
              }
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>
                  Business model
                </CardTitle>

                <CardDescription>
                  Core assumptions powering Orbit Analytics.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <DemoRow
                  label="Starting customers"
                  value={
                    assumptions
                      .customerRevenue
                      .startingCustomers
                  }
                />

                <DemoRow
                  label="ARPU"
                  value={formatCurrencyValue(
                    assumptions
                      .customerRevenue
                      .arpu,
                    forecast.currency,
                    {
                      maximumFractionDigits:
                        2,
                    },
                  )}
                />

                <DemoRow
                  label="Monthly churn"
                  value={`${assumptions.customerRevenue.monthlyChurnRate}%`}
                />

                <DemoRow
                  label="CAC"
                  value={formatCurrencyValue(
                    assumptions
                      .customerRevenue
                      .cac,
                    forecast.currency,
                  )}
                />

                <DemoRow
                  label="Organic acquisition"
                  value={`${assumptions.customerRevenue.organicNewCustomers} / month`}
                />

                <DemoRow
                  label="Monthly marketing"
                  value={formatCurrencyValue(
                    assumptions
                      .expenses
                      .marketing
                      .monthlyAmount,
                    forecast.currency,
                  )}
                />

                <DemoRow
                  label="COGS"
                  value={`${assumptions.expenses.cogs.percentage}% of revenue`}
                />
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>
                  Planning complexity
                </CardTitle>

                <CardDescription>
                  The demo exercises more than simple recurring revenue.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <DemoFeature
                  icon={
                    Rocket
                  }
                  title="Product launch override"
                  description="A one-off revenue and marketing intervention in September 2027."
                />

                <DemoFeature
                  icon={
                    Banknote
                  }
                  title="Three financing events"
                  description="Equity, grant funding and venture debt with interest and principal repayment."
                />

                <DemoFeature
                  icon={
                    Users
                  }
                  title="Customer-driven engine"
                  description="Paid acquisition, organic acquisition, CAC, churn, ARPU and MRR evolve monthly."
                />

                <DemoFeature
                  icon={
                    Gauge
                  }
                  title={`${orbitAnalyticsDemoOverrideCount()} planning overrides`}
                  description="Global and scenario-specific events demonstrate deterministic precedence."
                />
              </CardContent>
            </Card>
          </section>

          <section className="overflow-hidden rounded-3xl border bg-foreground text-background">
            <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:p-12">
              <div>
                <Badge
                  variant="secondary"
                  className="mb-5"
                >
                  BUILD YOUR OWN MODEL
                </Badge>

                <h2 className="max-w-3xl text-3xl font-semibold tracking-tight">
                  Orbit Analytics is only the demonstration.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-background/70">
                  Create a private VentureScope workspace to build your own assumptions,
                  financing plan, scenarios, monthly overrides, forecasts and executive reports.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                >
                  <Link href="/register">
                    Create your model

                    <ArrowRight
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                >
                  <Link href="/login">
                    Sign in
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function DemoRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">
        {
          label
        }
      </span>

      <span className="text-right text-sm font-medium">
        {
          value
        }
      </span>
    </div>
  );
}

function DemoFeature({
  icon: Icon,
  title,
  description,
}: {
  icon:
    React.ComponentType<{
      className?: string;
    }>;

  title: string;

  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon
          className="size-4"
          aria-hidden="true"
        />
      </div>

      <div>
        <div className="text-sm font-medium">
          {
            title
          }
        </div>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {
            description
          }
        </p>
      </div>
    </div>
  );
}
