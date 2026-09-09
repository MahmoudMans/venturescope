import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateSensitivitySurface,
} from "@/lib/finance/sensitivity-lab/calculations";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


const policy:
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


const rows:
  ForecastAnalyticsRow[] = [
    {
      period:
        "2027-01",

      revenue:
        1000,

      cogs:
        300,

      grossProfit:
        700,

      operatingExpenses:
        500,

      ebitda:
        200,

      netIncome:
        150,

      cashFlow:
        150,

      cashBalance:
        1000,

      mrr:
        500,

      customers:
        50,

      cac:
        null,

      churnRate:
        null,
    },

    {
      period:
        "2027-02",

      revenue:
        1000,

      cogs:
        300,

      grossProfit:
        700,

      operatingExpenses:
        500,

      ebitda:
        200,

      netIncome:
        150,

      cashFlow:
        150,

      cashBalance:
        1150,

      mrr:
        500,

      customers:
        50,

      cac:
        null,

      churnRate:
        null,
    },
  ];


describe(
  "sensitivity surface",
  () => {
    it(
      "creates complete Cartesian grid",
      () => {
        const result =
          calculateSensitivitySurface({
            rows,

            basePolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              1000,

            targetCashFloor:
              100,

            revenueShocks: [
              0,
              0.20,
              0.40,
            ],

            costInflations: [
              0,
              0.10,
              0.20,
            ],
          });


        expect(
          result.cells,
        ).toHaveLength(
          9,
        );


        expect(
          result.summary
            .totalCells,
        ).toBe(
          9,
        );
      },
    );


    it(
      "creates one funding boundary row per revenue shock",
      () => {
        const result =
          calculateSensitivitySurface({
            rows,

            basePolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              1000,

            targetCashFloor:
              100,

            revenueShocks: [
              0,
              0.20,
              0.40,
            ],

            costInflations: [
              0,
              0.10,
              0.20,
            ],
          });


        expect(
          result.boundary,
        ).toHaveLength(
          3,
        );
      },
    );


    it(
      "tracks maximum capital need",
      () => {
        const result =
          calculateSensitivitySurface({
            rows,

            basePolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              400,

            targetCashFloor:
              200,

            revenueShocks: [
              0,
              0.40,
              0.80,
            ],

            costInflations: [
              0,
              0.20,
              0.40,
            ],
          });


        expect(
          result.summary
            .maximumCapitalNeed,
        ).toBeGreaterThanOrEqual(
          0,
        );


        expect(
          result.summary
            .resilientCells +
          result.summary
            .floorBreachCells +
          result.summary
            .cashExhaustionCells,
        ).toBe(
          9,
        );
      },
    );
  },
);
