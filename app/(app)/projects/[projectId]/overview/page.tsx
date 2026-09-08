import type {
  Metadata,
} from "next";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  CalendarClock,
  Calculator,
  CircleDollarSign,
  Gauge,
  Landmark,
  Percent,
  ReceiptText,
  TrendingUp,
  Users,
  Wallet,
  FileText,
} from "lucide-react";
import Link from "next/link";

import {
  FinancialDashboardCharts,
} from "@/components/dashboard/financial-dashboard-charts";
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
  ScenarioSwitcher,
} from "@/components/scenarios/scenario-switcher";
import {
  Badge,
} from "@/components/ui/badge";
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
  getFinancialAnalysis,
} from "@/lib/finance/analysis-context";
import {
  buildFinancialDashboardData,
} from "@/lib/finance/dashboard-data";
import {
  formatCompactCurrencyValue,
  formatLongMonthKey,
  formatPercentageValue,
  formatRunway,
  formatRunwayDetail,
} from "@/lib/finance/formatting";
import {
  formatRevenueMode,
} from "@/lib/projects/project-formatting";

export const metadata: Metadata = {
  title:
    "Overview",
};

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{
    projectId: string;
  }>;

  searchParams?: Promise<{
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

  const project =
    analysis.project;

  if (
    !analysis.ready
  ) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
        <FinancialPageHeader
          eyebrow="Overview"
          title={
            project.name
          }
          description="Complete the financial assumptions to activate VentureScope's interactive analytics dashboard."
          scenarioName="Base Case"
        />

        <AnalysisSetupRequired
          projectId={
            project.id
          }
          missingSections={
            analysis.missingSections
          }
        />
      </div>
    );
  }

  const forecast =
    analysis.forecast;

  const dashboardData =
    buildFinancialDashboardData(
      forecast.months,
      forecast.revenueMode,
    );

  const breakEvenMonth =
    forecast.metrics
      .breakEven
      .sustainedBreakEvenMonth;

  const activeScenarioId =
    analysis.selectedScenario
      ?.id ??
    "";

  const scenarioSuffix =
    activeScenarioId
      ? `?scenario=${encodeURIComponent(
          activeScenarioId,
        )}`
      : "";

  const quickLinks = [
    {
      label:
        "Forecast",

      description:
        "Detailed monthly and annual forecast.",

      href:
        `/projects/${project.id}/forecast${scenarioSuffix}`,

      icon:
        BarChart3,
    },

    {
      label:
        "P&L",

      description:
        "Revenue, margins and profitability.",

      href:
        `/projects/${project.id}/pnl${scenarioSuffix}`,

      icon:
        Calculator,
    },

    {
      label:
        "Cash Flow",

      description:
        "Burn, runway and cash movements.",

      href:
        `/projects/${project.id}/cash-flow${scenarioSuffix}`,

      icon:
        Wallet,
    },

    {
      label:
        "Financing",

      description:
        "Funding events and debt schedule.",

      href:
        `/projects/${project.id}/financing`,

      icon:
        Landmark,
    },

    {
      label:
        "Scenarios",

      description:
        "Compare and simulate alternative cases.",

      href:
        `/projects/${project.id}/scenarios`,

      icon:
        Gauge,
    },

    {
      label:
        "Reports",

      description:
        "Executive report and CSV/PDF exports.",

      href:
        `/projects/${project.id}/reports${scenarioSuffix}`,

      icon:
        FileText,
    },

    ...(
      forecast.revenueMode ===
      "CUSTOMER_DRIVEN"
        ? [
            {
              label:
                "Customers",

              description:
                "Acquisition, churn and MRR.",

              href:
                `/projects/${project.id}/customers${scenarioSuffix}`,

              icon:
                Users,
            },
          ]
        : []
    ),
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <FinancialPageHeader
        eyebrow="Overview"
        title={
          project.name
        }
        description="Interactive analytics generated from the selected VentureScope financial scenario."
        scenarioName={
          forecast.scenario
            .name
        }
        scenarioControl={
          <ScenarioSwitcher
            scenarios={project.scenarios.map(
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
              activeScenarioId
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
          detail="Revenue within the first forecast calendar year."
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
          detail={`Forecast EBITDA margin: ${formatPercentageValue(
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
          detail={`Final month of the ${forecast.horizonMonths}-month forecast.`}
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
          label="Break-even"
          value={
            breakEvenMonth
              ? formatLongMonthKey(
                  breakEvenMonth,
                )
              : "Not reached"
          }
          detail="First month of three consecutive EBITDA-positive months."
          icon={
            CalendarClock
          }
        />
      </section>

      <FinancialDashboardCharts
        data={
          dashboardData
        }
        currency={
          forecast.currency
        }
        sustainedBreakEvenMonth={
          breakEvenMonth
        }
      />

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>
              Financial health
            </CardTitle>

            <CardDescription>
              Core metrics generated from {forecast.scenario.name}.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <HealthRow
              label="Gross margin"
              value={formatPercentageValue(
                forecast.metrics
                  .grossMarginPercentage,
              )}
              icon={
                Percent
              }
            />

            <HealthRow
              label="EBITDA margin"
              value={formatPercentageValue(
                forecast.metrics
                  .ebitdaMarginPercentage,
              )}
              icon={
                TrendingUp
              }
            />

            <HealthRow
              label="Net margin"
              value={formatPercentageValue(
                forecast.metrics
                  .netMarginPercentage,
              )}
              icon={
                ReceiptText
              }
            />

            <HealthRow
              label="3-month average gross burn"
              value={formatCompactCurrencyValue(
                forecast.metrics
                  .initialThreeMonthAverageGrossBurn,
                forecast.currency,
              )}
              icon={
                Wallet
              }
            />

            <HealthRow
              label="3-month average net burn"
              value={formatCompactCurrencyValue(
                forecast.metrics
                  .initialThreeMonthAverageNetBurn,
                forecast.currency,
              )}
              icon={
                Gauge
              }
            />

            <HealthRow
              label="Initial break-even revenue"
              value={
                forecast.metrics
                  .initialBreakEvenRevenue
                  ? formatCompactCurrencyValue(
                      forecast.metrics
                        .initialBreakEvenRevenue,
                      forecast.currency,
                    )
                  : "Not achievable"
              }
              icon={
                CircleDollarSign
              }
            />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Analysis workspace
                </CardTitle>

                <CardDescription className="mt-1">
                  Open a detailed VentureScope analysis surface.
                </CardDescription>
              </div>

              <Badge variant="outline">
                {
                  formatRevenueMode(
                    forecast.revenueMode,
                  )
                }
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map(
              (
                item,
              ) => {
                const Icon =
                  item.icon;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    className="group rounded-xl border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                        <Icon
                          className="size-4"
                          aria-hidden="true"
                        />
                      </div>

                      <ArrowRight
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="mt-4 font-medium">
                      {
                        item.label
                      }
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {
                        item.description
                      }
                    </p>
                  </Link>
                );
              },
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function HealthRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;

  value: string;

  icon:
    React.ComponentType<{
      className?: string;
    }>;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon
            className="size-4"
            aria-hidden="true"
          />
        </div>

        <span className="text-sm text-muted-foreground">
          {
            label
          }
        </span>
      </div>

      <span className="text-right text-sm font-semibold">
        {
          value
        }
      </span>
    </div>
  );
}
