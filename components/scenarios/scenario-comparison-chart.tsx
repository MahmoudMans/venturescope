"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  ScenarioComparisonItem,
} from "@/lib/finance/types";
import {
  formatCompactCurrencyValue,
} from "@/lib/finance/formatting";

export function ScenarioComparisonChart({
  comparison,
  currency,
}: {
  comparison: ScenarioComparisonItem[];

  currency: string;
}) {
  const data =
    comparison.map(
      (
        item,
      ) => ({
        name:
          item.scenarioName,

        revenue:
          Number(
            item.firstYearRevenue,
          ),

        ebitda:
          Number(
            item.firstYearEbitda,
          ),

        cash:
          Number(
            item.endingCash,
          ),
      }),
    );

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={
            data
          }
          margin={{
            top: 10,
            right: 16,
            left: 8,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />

          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{
              fill:
                "var(--muted-foreground)",
              fontSize: 11,
            }}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            width={78}
            tickFormatter={(
              value,
            ) =>
              formatCompactCurrencyValue(
                String(
                  value,
                ),
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
            contentStyle={{
              background:
                "var(--popover)",

              border:
                "1px solid var(--border)",

              borderRadius:
                "0.75rem",

              color:
                "var(--popover-foreground)",
            }}
            formatter={(
              value,
            ) =>
              formatCompactCurrencyValue(
                String(
                  value ??
                  0,
                ),
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

          <Bar
            isAnimationActive={false}
            dataKey="revenue"
            name="First-year revenue"
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
            name="First-year EBITDA"
            fill="var(--chart-4)"
            radius={[
              4,
              4,
              0,
              0,
            ]}
          />

          <Bar
            isAnimationActive={false}
            dataKey="cash"
            name="Ending cash"
            fill="var(--chart-3)"
            radius={[
              4,
              4,
              0,
              0,
            ]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
