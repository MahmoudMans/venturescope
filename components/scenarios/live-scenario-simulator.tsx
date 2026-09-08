"use client";

import {
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Gauge,
  RotateCcw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  FinancialKpiCard,
} from "@/components/financial/financial-kpi-card";
import {
  Button,
} from "@/components/ui/button";
import {
  generateFinancialForecast,
} from "@/lib/finance/engine";
import {
  formatCompactCurrencyValue,
  formatLongMonthKey,
  formatMonthKey,
  formatRunway,
} from "@/lib/finance/formatting";
import type {
  FinancialModelInput,
} from "@/lib/finance/types";
import {
  scenarioFormValuesToStorageModifiers,
} from "@/lib/scenarios/modifiers";

type SimulatorValues = {
  growth: number;

  arpu: number;

  cac: number;

  churn: number;

  cogs: number;
};

const INITIAL_VALUES: SimulatorValues =
  {
    growth:
      0,

    arpu:
      0,

    cac:
      0,

    churn:
      0,

    cogs:
      0,
  };

export function LiveScenarioSimulator({
  baseInput,
}: {
  baseInput: FinancialModelInput;
}) {
  const [
    values,
    setValues,
  ] =
    useState<SimulatorValues>(
      INITIAL_VALUES,
    );

  const baseForecast =
    useMemo(
      () =>
        generateFinancialForecast(
          baseInput,
        ),
      [
        baseInput,
      ],
    );

  const simulatedForecast =
    useMemo(
      () => {
        const modifiers =
          scenarioFormValuesToStorageModifiers({
            growthAdjustmentPercentage:
              String(
                values.growth,
              ),

            arpuAdjustmentPercentage:
              String(
                values.arpu,
              ),

            cacAdjustmentPercentage:
              String(
                values.cac,
              ),

            churnDeltaPercentagePoints:
              String(
                values.churn,
              ),

            cogsDeltaPercentagePoints:
              String(
                values.cogs,
              ),
          });

        return generateFinancialForecast({
          ...baseInput,

          scenario: {
            name:
              "Live Simulation",

            type:
              "CUSTOM",

            modifiers,
          },
        });
      },
      [
        baseInput,
        values,
      ],
    );

  const chartData =
    baseForecast.months
      .slice(
        0,
        Math.min(
          24,
          baseForecast.months.length,
        ),
      )
      .map(
        (
          month,
          index,
        ) => ({
          label:
            formatMonthKey(
              month.month,
            ),

          baseRevenue:
            Number(
              month.revenue,
            ),

          simulatedRevenue:
            Number(
              simulatedForecast.months[
                index
              ].revenue,
            ),
        }),
      );

  const customerDriven =
    baseInput.revenueMode ===
    "CUSTOMER_DRIVEN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            Live simulation
          </h3>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Adjust scenario modifiers locally and see the financial result instantly. Nothing is persisted while you experiment.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setValues(
              INITIAL_VALUES,
            )
          }
        >
          <RotateCcw
            className="size-4"
            aria-hidden="true"
          />

          Reset simulation
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SimulatorControl
          label={
            customerDriven
              ? "Acquisition growth adjustment"
              : "Revenue growth adjustment"
          }
          value={
            values.growth
          }
          min={-100}
          max={200}
          step={1}
          suffix="%"
          onChange={(
            value,
          ) =>
            setValues(
              (
                current,
              ) => ({
                ...current,
                growth:
                  value,
              }),
            )
          }
        />

        <SimulatorControl
          label="COGS adjustment"
          value={
            values.cogs
          }
          min={-50}
          max={50}
          step={0.5}
          suffix="pp"
          onChange={(
            value,
          ) =>
            setValues(
              (
                current,
              ) => ({
                ...current,
                cogs:
                  value,
              }),
            )
          }
        />

        {customerDriven ? (
          <>
            <SimulatorControl
              label="ARPU adjustment"
              value={
                values.arpu
              }
              min={-100}
              max={200}
              step={1}
              suffix="%"
              onChange={(
                value,
              ) =>
                setValues(
                  (
                    current,
                  ) => ({
                    ...current,
                    arpu:
                      value,
                  }),
                )
              }
            />

            <SimulatorControl
              label="CAC adjustment"
              value={
                values.cac
              }
              min={-95}
              max={300}
              step={1}
              suffix="%"
              onChange={(
                value,
              ) =>
                setValues(
                  (
                    current,
                  ) => ({
                    ...current,
                    cac:
                      value,
                  }),
                )
              }
            />

            <SimulatorControl
              label="Churn adjustment"
              value={
                values.churn
              }
              min={-25}
              max={25}
              step={0.5}
              suffix="pp"
              onChange={(
                value,
              ) =>
                setValues(
                  (
                    current,
                  ) => ({
                    ...current,
                    churn:
                      value,
                  }),
                )
              }
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <FinancialKpiCard
          label="First-year revenue"
          value={formatCompactCurrencyValue(
            simulatedForecast.metrics
              .firstYearRevenue,
            simulatedForecast.currency,
          )}
          detail={`Base: ${formatCompactCurrencyValue(
            baseForecast.metrics
              .firstYearRevenue,
            baseForecast.currency,
          )}`}
          icon={
            CircleDollarSign
          }
        />

        <FinancialKpiCard
          label="First-year EBITDA"
          value={formatCompactCurrencyValue(
            simulatedForecast.metrics
              .firstYearEbitda,
            simulatedForecast.currency,
          )}
          detail={`Base: ${formatCompactCurrencyValue(
            baseForecast.metrics
              .firstYearEbitda,
            baseForecast.currency,
          )}`}
          icon={
            TrendingUp
          }
        />

        <FinancialKpiCard
          label="Ending cash"
          value={formatCompactCurrencyValue(
            simulatedForecast.metrics
              .endingCash,
            simulatedForecast.currency,
          )}
          detail={`Base: ${formatCompactCurrencyValue(
            baseForecast.metrics
              .endingCash,
            baseForecast.currency,
          )}`}
          icon={
            Wallet
          }
        />

        <FinancialKpiCard
          label="Runway"
          value={formatRunway(
            simulatedForecast.metrics
              .runway,
          )}
          detail={`Base: ${formatRunway(
            baseForecast.metrics
              .runway,
          )}`}
          icon={
            Gauge
          }
        />

        <FinancialKpiCard
          label="Ending MRR"
          value={formatCompactCurrencyValue(
            simulatedForecast.metrics
              .endingMrr,
            simulatedForecast.currency,
          )}
          detail={`Base: ${formatCompactCurrencyValue(
            baseForecast.metrics
              .endingMrr,
            baseForecast.currency,
          )}`}
          icon={
            Banknote
          }
        />

        <FinancialKpiCard
          label="Break-even"
          value={
            simulatedForecast.metrics
              .breakEven
              .sustainedBreakEvenMonth
              ? formatLongMonthKey(
                  simulatedForecast.metrics
                    .breakEven
                    .sustainedBreakEvenMonth,
                )
              : "Not reached"
          }
          detail="Live simulated sustained EBITDA break-even."
          icon={
            CalendarClock
          }
        />
      </div>

      <div className="rounded-xl border bg-background p-5">
        <div className="mb-5">
          <div className="font-medium">
            Revenue trajectory
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Base Case compared with the current unsaved simulation for the first 24 forecast months.
          </p>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={
                chartData
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
                  formatCompactCurrencyValue(
                    String(
                      value,
                    ),
                    baseForecast.currency,
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
                    baseForecast.currency,
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
                type="monotone"
                dataKey="baseRevenue"
                name="Base Case"
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="simulatedRevenue"
                name="Live Simulation"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SimulatorControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;

  value: number;

  min: number;

  max: number;

  step: number;

  suffix: string;

  onChange:
    (
      value: number,
    ) => void;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <label className="text-sm font-medium">
          {
            label
          }
        </label>

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={
              value
            }
            onChange={(
              event,
            ) => {
              const parsed =
                Number(
                  event.target.value,
                );

              if (
                Number.isFinite(
                  parsed,
                )
              ) {
                onChange(
                  Math.max(
                    min,
                    Math.min(
                      max,
                      parsed,
                    ),
                  ),
                );
              }
            }}
            className="h-8 w-20 rounded-md border bg-transparent px-2 text-right text-sm outline-none"
          />

          <span className="w-7 text-xs text-muted-foreground">
            {
              suffix
            }
          </span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            Number(
              event.target.value,
            ),
          )
        }
        className="mt-5 w-full accent-foreground"
      />

      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>
          {min}
          {suffix}
        </span>

        <span>
          Base 0
          {suffix}
        </span>

        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}
