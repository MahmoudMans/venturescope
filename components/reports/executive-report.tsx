import {
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
import {
  FinancialTable,
  type FinancialTableColumn,
  type FinancialTableRow,
} from "@/components/financial/financial-table";
import {
  ScenarioComparisonTable,
} from "@/components/scenarios/scenario-comparison-table";
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
  formatCompactCurrencyValue,
  formatCurrencyValue,
  formatLongMonthKey,
  formatPercentageValue,
  formatRunway,
  formatRunwayDetail,
} from "@/lib/finance/formatting";
import type {
  ReadyReportContext,
} from "@/lib/reports/context";
import {
  buildExecutiveSummary,
} from "@/lib/reports/summary";
import {
  scenarioModifiersToFormValues,
} from "@/lib/scenarios/modifiers";

export function ExecutiveReport({
  context,
}: {
  context: ReadyReportContext;
}) {
  const {
    project,
    forecast,
    assumptions,
    comparison,
  } = context;

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
    ];

  const scenarioModifiers =
    context.selectedScenario &&
    context.selectedScenario
      .type !==
      "BASE"
      ? scenarioModifiersToFormValues(
          context.selectedScenario
            .modifiers,
          project.revenueMode,
        )
      : null;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FinancialKpiCard
          label="First-year revenue"
          value={formatCompactCurrencyValue(
            forecast.metrics
              .firstYearRevenue,
            forecast.currency,
          )}
          detail="Revenue in the first forecast calendar year."
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
          detail={`EBITDA margin ${formatPercentageValue(
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
          detail="Projected final cash balance."
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
          detail="Sustained EBITDA break-even."
          icon={
            CalendarClock
          }
        />
      </section>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>
            Executive summary
          </CardTitle>

          <CardDescription>
            Deterministic narrative generated from the selected forecast.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {buildExecutiveSummary(
            context,
          ).map(
            (
              paragraph,
              index,
            ) => (
              <p
                key={
                  index
                }
                className="text-sm leading-7 text-muted-foreground"
              >
                {
                  paragraph
                }
              </p>
            ),
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Annual financial forecast
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Calendar-year aggregation of the selected scenario.
          </p>
        </div>

        <FinancialTable
          caption={`${project.name} annual executive forecast`}
          columns={
            annualColumns
          }
          rows={
            annualRows
          }
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Scenario comparison
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Base, Bull, Bear and custom scenarios evaluated through the same engine.
          </p>
        </div>

        <ScenarioComparisonTable
          projectId={
            project.id
          }
          comparison={
            comparison
          }
          currency={
            project.currency
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>
              Core assumptions
            </CardTitle>

            <CardDescription>
              Baseline inputs behind the financial forecast.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <AssumptionRow
              label="Revenue model"
              value={
                project.revenueMode ===
                "DIRECT"
                  ? "Direct revenue"
                  : "Customer-driven"
              }
            />

            <AssumptionRow
              label="Starting cash"
              value={formatCurrencyValue(
                assumptions.general
                  .startingCash,
                project.currency,
              )}
            />

            <AssumptionRow
              label="Corporate tax"
              value={`${assumptions.general.corporateTaxRate}%`}
            />

            <AssumptionRow
              label="Monthly salaries"
              value={formatCurrencyValue(
                assumptions.expenses
                  .salaries
                  .monthlyAmount,
                project.currency,
              )}
            />

            <AssumptionRow
              label="Monthly rent"
              value={formatCurrencyValue(
                assumptions.expenses
                  .rent
                  .monthlyAmount,
                project.currency,
              )}
            />

            <AssumptionRow
              label="Monthly marketing"
              value={formatCurrencyValue(
                assumptions.expenses
                  .marketing
                  .monthlyAmount,
                project.currency,
              )}
            />

            <AssumptionRow
              label="COGS method"
              value={
                assumptions.expenses
                  .cogs.method ===
                "PERCENTAGE"
                  ? `${assumptions.expenses.cogs.percentage}% of revenue`
                  : formatCurrencyValue(
                      assumptions.expenses
                        .cogs
                        .fixedMonthlyAmount,
                      project.currency,
                    )
              }
            />

            <AssumptionRow
              label="Financing events"
              value={String(
                project.financingEvents
                  .length,
              )}
            />

            <AssumptionRow
              label="Monthly overrides"
              value={String(
                project.monthlyOverrides
                  .length,
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Revenue assumptions
                </CardTitle>

                <CardDescription>
                  Revenue-engine-specific planning inputs.
                </CardDescription>
              </div>

              <Badge variant="outline">
                {
                  project.revenueMode
                }
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {project.revenueMode ===
            "DIRECT" ? (
              <>
                <AssumptionRow
                  label="Starting monthly revenue"
                  value={formatCurrencyValue(
                    assumptions.directRevenue
                      .startingMonthlyRevenue,
                    project.currency,
                  )}
                />

                <AssumptionRow
                  label="Monthly growth"
                  value={`${assumptions.directRevenue.monthlyGrowthRate}%`}
                />

                <AssumptionRow
                  label="Recurring share"
                  value={`${assumptions.directRevenue.recurringRevenuePercentage}%`}
                />

                <AssumptionRow
                  label="Monthly one-time revenue"
                  value={formatCurrencyValue(
                    assumptions.directRevenue
                      .monthlyOneTimeRevenue,
                    project.currency,
                  )}
                />
              </>
            ) : (
              <>
                <AssumptionRow
                  label="Starting customers"
                  value={
                    assumptions.customerRevenue
                      .startingCustomers
                  }
                />

                <AssumptionRow
                  label="ARPU"
                  value={formatCurrencyValue(
                    assumptions.customerRevenue
                      .arpu,
                    project.currency,
                    {
                      maximumFractionDigits:
                        2,
                    },
                  )}
                />

                <AssumptionRow
                  label="Monthly churn"
                  value={`${assumptions.customerRevenue.monthlyChurnRate}%`}
                />

                <AssumptionRow
                  label="CAC"
                  value={formatCurrencyValue(
                    assumptions.customerRevenue
                      .cac,
                    project.currency,
                  )}
                />

                <AssumptionRow
                  label="Organic acquisition"
                  value={`${assumptions.customerRevenue.organicNewCustomers} / month`}
                />
              </>
            )}

            {scenarioModifiers ? (
              <>
                <div className="pt-3">
                  <div className="mb-3 flex items-center gap-2">
                    <Percent
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <div className="text-sm font-medium">
                      Selected scenario modifiers
                    </div>
                  </div>
                </div>

                <AssumptionRow
                  label="Growth adjustment"
                  value={`${scenarioModifiers.growthAdjustmentPercentage}%`}
                />

                <AssumptionRow
                  label="ARPU adjustment"
                  value={`${scenarioModifiers.arpuAdjustmentPercentage}%`}
                />

                <AssumptionRow
                  label="CAC adjustment"
                  value={`${scenarioModifiers.cacAdjustmentPercentage}%`}
                />

                <AssumptionRow
                  label="Churn adjustment"
                  value={`${scenarioModifiers.churnDeltaPercentagePoints} pp`}
                />

                <AssumptionRow
                  label="COGS adjustment"
                  value={`${scenarioModifiers.cogsDeltaPercentagePoints} pp`}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function AssumptionRow({
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
