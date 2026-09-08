"use client";

import {
  Activity,
  Banknote,
  BarChart3,
  Flame,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DashboardChartCard,
} from "@/components/dashboard/dashboard-chart-card";
import {
  Button,
} from "@/components/ui/button";
import type {
  FinancialDashboardData,
} from "@/lib/finance/dashboard-data";
import {
  formatCompactCurrencyValue,
  formatCustomerValue,
  formatMonthKey,
} from "@/lib/finance/formatting";
import {
  cn,
} from "@/lib/utils";

type DashboardRange =
  | 12
  | 24
  | "ALL";

type FinancialDashboardChartsProps = {
  data: FinancialDashboardData;

  currency: string;

  sustainedBreakEvenMonth:
    | string
    | null;
};

export function FinancialDashboardCharts({
  data,
  currency,
  sustainedBreakEvenMonth,
}: FinancialDashboardChartsProps) {
  const defaultRange: DashboardRange =
    data.points.length >
    12
      ? 12
      : "ALL";

  const [
    range,
    setRange,
  ] =
    useState<DashboardRange>(
      defaultRange,
    );

  const visiblePoints =
    useMemo(
      () => {
        const source =
          range ===
          "ALL"
            ? data.points
            : data.points.slice(
                0,
                range,
              );

        return source.map(
          (
            point,
          ) => ({
            ...point,

            label:
              formatMonthKey(
                point.month,
              ),
          }),
        );
      },
      [
        data.points,
        range,
      ],
    );

  const breakEvenLabel =
    sustainedBreakEvenMonth
      ? visiblePoints.find(
          (
            point,
          ) =>
            point.month ===
            sustainedBreakEvenMonth,
        )?.label ??
        null
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-medium">
            Dashboard horizon
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Change the visible chart period without changing the financial model.
          </p>
        </div>

        <DashboardRangeSelector
          range={
            range
          }
          onChange={
            setRange
          }
          availableMonths={
            data.points.length
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardChartCard
          title="Revenue vs expenses"
          description="Monthly operating revenue compared with COGS and operating expenses."
          icon={
            TrendingUp
          }
        >
          <ChartContainer label="Revenue and expenses by forecast month">
            <LineChart
              data={
                visiblePoints
              }
              margin={{
                top: 10,
                right: 12,
                bottom: 0,
                left: 4,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(
                  value,
                ) =>
                  formatAxisCurrency(
                    value,
                    currency,
                  )
                }
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={
                  tooltipStyle
                }
                labelStyle={{
                  color:
                    "var(--popover-foreground)",
                  fontWeight:
                    600,
                }}
                formatter={(
                  value,
                ) =>
                  formatTooltipCurrency(
                    value,
                    currency,
                  )
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize:
                    12,
                }}
              />

              {breakEvenLabel ? (
                <ReferenceLine
                  x={
                    breakEvenLabel
                  }
                  stroke="var(--muted-foreground)"
                  strokeDasharray="5 5"
                  ifOverflow="extendDomain"
                />
              ) : null}

              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 4,
                }}
              />

              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey="totalExpenses"
                name="Expenses"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </DashboardChartCard>

        <DashboardChartCard
          title="Cash runway"
          description="Projected ending cash with external financing shown in funding months."
          icon={
            Wallet
          }
        >
          <ChartContainer label="Ending cash and financing inflows by forecast month">
            <ComposedChart
              data={
                visiblePoints
              }
              margin={{
                top: 10,
                right: 12,
                bottom: 0,
                left: 4,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(
                  value,
                ) =>
                  formatAxisCurrency(
                    value,
                    currency,
                  )
                }
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={
                  tooltipStyle
                }
                labelStyle={{
                  color:
                    "var(--popover-foreground)",
                  fontWeight:
                    600,
                }}
                formatter={(
                  value,
                ) =>
                  formatTooltipCurrency(
                    value,
                    currency,
                  )
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize:
                    12,
                }}
              />

              <ReferenceLine
                y={0}
                stroke="var(--destructive)"
                strokeDasharray="5 5"
              />

              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="endingCash"
                name="Ending cash"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.12}
                strokeWidth={2.5}
              />

              <Bar
                isAnimationActive={false}
                dataKey="financingInflow"
                name="Financing"
                fill="var(--chart-3)"
                opacity={0.7}
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
            </ComposedChart>
          </ChartContainer>
        </DashboardChartCard>

        <DashboardChartCard
          title="Revenue & EBITDA"
          description="Monthly top-line performance compared with operating profitability."
          icon={
            BarChart3
          }
        >
          <ChartContainer label="Revenue and EBITDA by forecast month">
            <BarChart
              data={
                visiblePoints
              }
              margin={{
                top: 10,
                right: 12,
                bottom: 0,
                left: 4,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(
                  value,
                ) =>
                  formatAxisCurrency(
                    value,
                    currency,
                  )
                }
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={
                  tooltipStyle
                }
                labelStyle={{
                  color:
                    "var(--popover-foreground)",
                  fontWeight:
                    600,
                }}
                formatter={(
                  value,
                ) =>
                  formatTooltipCurrency(
                    value,
                    currency,
                  )
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize:
                    12,
                }}
              />

              <ReferenceLine
                y={0}
                stroke="var(--muted-foreground)"
                strokeDasharray="5 5"
              />

              <Bar
                isAnimationActive={false}
                dataKey="revenue"
                name="Revenue"
                fill="var(--chart-1)"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />

              <Bar
                isAnimationActive={false}
                dataKey="ebitda"
                name="EBITDA"
                fill="var(--chart-4)"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />
            </BarChart>
          </ChartContainer>
        </DashboardChartCard>

        <DashboardChartCard
          title="Monthly recurring revenue"
          description="Recurring monthly revenue generated by the active revenue model."
          icon={
            Banknote
          }
        >
          <ChartContainer label="Monthly recurring revenue by forecast month">
            <AreaChart
              data={
                visiblePoints
              }
              margin={{
                top: 10,
                right: 12,
                bottom: 0,
                left: 4,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(
                  value,
                ) =>
                  formatAxisCurrency(
                    value,
                    currency,
                  )
                }
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={
                  tooltipStyle
                }
                labelStyle={{
                  color:
                    "var(--popover-foreground)",
                  fontWeight:
                    600,
                }}
                formatter={(
                  value,
                ) =>
                  formatTooltipCurrency(
                    value,
                    currency,
                  )
                }
              />

              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="mrr"
                name="MRR"
                stroke="var(--chart-3)"
                fill="var(--chart-3)"
                fillOpacity={0.14}
                strokeWidth={2.5}
              />
            </AreaChart>
          </ChartContainer>
        </DashboardChartCard>

        <DashboardChartCard
          title="Burn profile"
          description="Gross operating burn and revenue-adjusted net burn over time."
          icon={
            Flame
          }
        >
          <ChartContainer label="Gross and net burn by forecast month">
            <LineChart
              data={
                visiblePoints
              }
              margin={{
                top: 10,
                right: 12,
                bottom: 0,
                left: 4,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 11,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(
                  value,
                ) =>
                  formatAxisCurrency(
                    value,
                    currency,
                  )
                }
                tick={{
                  fill:
                    "var(--muted-foreground)",
                  fontSize: 10,
                }}
              />

              <Tooltip
                contentStyle={
                  tooltipStyle
                }
                labelStyle={{
                  color:
                    "var(--popover-foreground)",
                  fontWeight:
                    600,
                }}
                formatter={(
                  value,
                ) =>
                  formatTooltipCurrency(
                    value,
                    currency,
                  )
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize:
                    12,
                }}
              />

              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey="grossBurn"
                name="Gross burn"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />

              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey="netBurn"
                name="Net burn"
                stroke="var(--chart-5)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </DashboardChartCard>

        {data.revenueMode ===
        "CUSTOMER_DRIVEN" ? (
          <DashboardChartCard
            title="Customer growth"
            description="Active customers, acquisition and churn throughout the forecast."
            icon={
              Users
            }
          >
            <ChartContainer label="Active, acquired and churned customers by forecast month">
              <LineChart
                data={
                  visiblePoints
                }
                margin={{
                  top: 10,
                  right: 12,
                  bottom: 0,
                  left: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                  tick={{
                    fill:
                      "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  tickFormatter={(
                    value,
                  ) =>
                    formatCustomerValue(
                      String(
                        value,
                      ),
                    )
                  }
                  tick={{
                    fill:
                      "var(--muted-foreground)",
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                  labelStyle={{
                    color:
                      "var(--popover-foreground)",
                    fontWeight:
                      600,
                  }}
                  formatter={(
                    value,
                  ) =>
                    formatCustomerValue(
                      String(
                        value ??
                        0,
                      ),
                    )
                  }
                />

                <Legend
                  wrapperStyle={{
                    fontSize:
                      12,
                  }}
                />

                <Line
                isAnimationActive={false}
                  type="monotone"
                  dataKey="endingCustomers"
                  name="Active customers"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={false}
                />

                <Line
                isAnimationActive={false}
                  type="monotone"
                  dataKey="newCustomers"
                  name="New customers"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                isAnimationActive={false}
                  type="monotone"
                  dataKey="churnedCustomers"
                  name="Churned customers"
                  stroke="var(--chart-5)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </DashboardChartCard>
        ) : (
          <DashboardChartCard
            title="Revenue model"
            description="This project forecasts revenue directly rather than deriving it from customer acquisition."
            icon={
              Activity
            }
          >
            <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed bg-muted/20 px-8 text-center">
              <div className="max-w-md">
                <Activity
                  className="mx-auto size-8 text-muted-foreground"
                  aria-hidden="true"
                />

                <div className="mt-4 font-medium">
                  Direct revenue model
                </div>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Customer acquisition and churn charts are intentionally unavailable because this model forecasts revenue directly.
                </p>
              </div>
            </div>
          </DashboardChartCard>
        )}
      </div>
    </div>
  );
}

function DashboardRangeSelector({
  range,
  onChange,
  availableMonths,
}: {
  range: DashboardRange;

  onChange:
    (
      range: DashboardRange,
    ) => void;

  availableMonths: number;
}) {
  const options: Array<{
    value: DashboardRange;

    label: string;

    enabled: boolean;
  }> = [
    {
      value:
        12,

      label:
        "12M",

      enabled:
        availableMonths >=
        12,
    },

    {
      value:
        24,

      label:
        "24M",

      enabled:
        availableMonths >=
        24,
    },

    {
      value:
        "ALL",

      label:
        "All",

      enabled:
        true,
    },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {options.map(
        (
          option,
        ) => (
          <Button
            key={
              String(
                option.value,
              )
            }
            type="button"
            variant="ghost"
            size="sm"
            disabled={
              !option.enabled
            }
            onClick={() =>
              onChange(
                option.value,
              )
            }
            className={cn(
              "h-8 px-3 text-xs",
              range ===
                option.value &&
                "bg-background shadow-sm hover:bg-background",
            )}
          >
            {
              option.label
            }
          </Button>
        ),
      )}
    </div>
  );
}

function ChartContainer({
  children,
  label,
}: {
  children:
    React.ReactNode;

  label: string;
}) {
  return (
    <figure>
      <div
        role="img"
        aria-label={
          label
        }
        className="h-[300px] w-full"
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          {
            children
          }
        </ResponsiveContainer>
      </div>

      <figcaption className="sr-only">
        {
          label
        }. Equivalent financial values are also available in VentureScope&apos;s tabular analysis views.
      </figcaption>
    </figure>
  );
}

function formatAxisCurrency(
  value: unknown,
  currency: string,
): string {
  return formatCompactCurrencyValue(
    String(
      value ??
      0,
    ),
    currency,
  );
}

function formatTooltipCurrency(
  value: unknown,
  currency: string,
): string {
  return formatCompactCurrencyValue(
    String(
      value ??
      0,
    ),
    currency,
  );
}

const tooltipStyle = {
  background:
    "var(--popover)",

  border:
    "1px solid var(--border)",

  borderRadius:
    "0.75rem",

  color:
    "var(--popover-foreground)",

  boxShadow:
    "0 10px 30px rgba(0, 0, 0, 0.10)",
};
