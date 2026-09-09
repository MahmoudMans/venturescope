import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/snapshot";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


const riskPolicy:
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


const forecast:
  ForecastAnalyticsRow = {
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
      100,

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
  };


const actual:
  ActualFinancialPeriod = {
    period:
      "2027-01",

    revenue:
      900,

    cogs:
      300,

    operatingExpenses:
      500,

    ebitda:
      100,

    netIncome:
      80,

    cashFlow:
      50,

    cashBalance:
      950,

    mrr:
      450,

    customers:
      48,
  };


describe(
  "executive review snapshot",
  () => {
    it(
      "captures finance intelligence and management-action health",
      () => {
        const snapshot =
          buildExecutiveReviewSnapshot({
            capturedAt:
              "2027-02-15T00:00:00.000Z",

            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            riskPolicy,

            latestActualPeriod:
              "2027-01",

            latestActualCash:
              950,

            actions: [
              {
                status:
                  "OPEN",

                priority:
                  "CRITICAL",

                dueDate:
                  "2027-02-01T00:00:00.000Z",
              },

              {
                status:
                  "DONE",

                priority:
                  "HIGH",

                dueDate:
                  null,
              },
            ],
          });


        expect(
          snapshot.schemaVersion,
        ).toBe(
          1,
        );


        expect(
          snapshot.kpis
            .actualPeriods,
        ).toBe(
          1,
        );


        expect(
          snapshot.actions
            .open,
        ).toBe(
          1,
        );


        expect(
          snapshot.actions
            .criticalOpen,
        ).toBe(
          1,
        );


        expect(
          snapshot.actions
            .overdue,
        ).toBe(
          1,
        );


        expect(
          snapshot.actions
            .done,
        ).toBe(
          1,
        );
      },
    );


    it(
      "captures revenue and EBITDA variance",
      () => {
        const snapshot =
          buildExecutiveReviewSnapshot({
            capturedAt:
              "2027-02-15T00:00:00.000Z",

            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            riskPolicy,

            latestActualPeriod:
              "2027-01",

            latestActualCash:
              950,

            actions:
              [],
          });


        expect(
          snapshot.kpis
            .revenueVarianceRate,
        ).toBeCloseTo(
          -0.10,
        );


        expect(
          snapshot.kpis
            .ebitdaVarianceRate,
        ).toBeCloseTo(
          -0.50,
        );
      },
    );
  },
);
