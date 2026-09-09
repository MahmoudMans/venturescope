import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateSensitivityCell,
} from "@/lib/finance/sensitivity-lab/calculations";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


const basePolicy:
  ProjectRiskPolicy = {
    minimumCash:
      100,

    minimumRunwayMonths:
      6,

    minimumEbitdaMargin:
      null,

    maximumMonthlyBurn:
      null,

    downsideRevenueShock:
      0.20,

    downsideCostInflation:
      0.10,
  };


function row({
  month,
  revenue =
    1000,
  cogs =
    300,
  operatingExpenses =
    500,
  cashFlow =
    200,
  cashBalance =
    1000,
}: {
  month:
    number;

  revenue?:
    number;

  cogs?:
    number;

  operatingExpenses?:
    number;

  cashFlow?:
    number;

  cashBalance?:
    number;
}): ForecastAnalyticsRow {
  return {
    period:
      `2027-${month
        .toString()
        .padStart(
          2,
          "0",
        )}`,

    revenue,

    cogs,

    grossProfit:
      revenue -
      cogs,

    operatingExpenses,

    ebitda:
      revenue -
      cogs -
      operatingExpenses,

    netIncome:
      100,

    cashFlow,

    cashBalance,

    mrr:
      500,

    customers:
      50,

    cac:
      null,

    churnRate:
      null,
  };
}


describe(
  "sensitivity cell",
  () => {
    const rows = [
      row({
        month:
          1,
      }),

      row({
        month:
          2,
      }),

      row({
        month:
          3,
      }),
    ];


    it(
      "keeps healthy zero-stress case resilient",
      () => {
        const result =
          calculateSensitivityCell({
            rows,

            basePolicy,

            latestActualPeriod:
              null,

            latestActualCash:
              1000,

            targetCashFloor:
              100,

            revenueShock:
              0,

            costInflation:
              0,
          });


        expect(
          result.state,
        ).toBe(
          "RESILIENT",
        );


        expect(
          result.capitalNeed,
        ).toBe(
          0,
        );
      },
    );


    it(
      "reduces cash as stress increases",
      () => {
        const mild =
          calculateSensitivityCell({
            rows,

            basePolicy,

            latestActualPeriod:
              null,

            latestActualCash:
              1000,

            targetCashFloor:
              100,

            revenueShock:
              0.10,

            costInflation:
              0.05,
          });


        const severe =
          calculateSensitivityCell({
            rows,

            basePolicy,

            latestActualPeriod:
              null,

            latestActualCash:
              1000,

            targetCashFloor:
              100,

            revenueShock:
              0.40,

            costInflation:
              0.20,
          });


        expect(
          severe.minimumCash,
        ).toBeLessThan(
          mild.minimumCash ??
          Number.POSITIVE_INFINITY,
        );
      },
    );


    it(
      "detects cash exhaustion",
      () => {
        const result =
          calculateSensitivityCell({
            rows,

            basePolicy,

            latestActualPeriod:
              null,

            latestActualCash:
              200,

            targetCashFloor:
              100,

            revenueShock:
              0.50,

            costInflation:
              0.30,
          });


        expect(
          result.state,
        ).toBe(
          "CASH_EXHAUSTION",
        );


        expect(
          result.cashExhaustionPeriod,
        ).not.toBeNull();


        expect(
          result.capitalNeed,
        ).toBeGreaterThan(
          0,
        );
      },
    );
  },
);
