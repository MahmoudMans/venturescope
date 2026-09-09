import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateManagementScorecard,
} from "@/lib/finance/scorecard/calculations";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";

import type {
  KpiMetricCode,
  KpiTargetView,
} from "@/lib/finance/scorecard/types";


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


function target(
  metricCode:
    KpiMetricCode,
  targetValue:
    number,
  periodKey =
    "2027-01",
): KpiTargetView {
  return {
    id:
      `${periodKey}-${metricCode}`,

    periodKey,

    metricCode,

    targetValue,

    ownerName:
      null,

    note:
      null,

    createdAt:
      "2027-01-01T00:00:00.000Z",

    updatedAt:
      "2027-01-01T00:00:00.000Z",

    createdBy:
      null,
  };
}


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
      100,

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
      90,
  };


describe(
  "management scorecard",
  () => {
    it(
      "prefers Actuals over forecast for completed periods",
      () => {
        const scorecard =
          calculateManagementScorecard({
            targets: [
              target(
                "REVENUE",
                1000,
              ),
            ],

            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            riskPolicy:
              policy,

            latestActualPeriod:
              "2027-01",

            latestActualCash:
              950,
          });


        expect(
          scorecard.rows[
            0
          ].currentValue,
        ).toBe(
          900,
        );


        expect(
          scorecard.rows[
            0
          ].source,
        ).toBe(
          "ACTUAL",
        );


        expect(
          scorecard.rows[
            0
          ].status,
        ).toBe(
          "AT_RISK",
        );
      },
    );


    it(
      "uses forecast when Actuals are unavailable",
      () => {
        const scorecard =
          calculateManagementScorecard({
            targets: [
              target(
                "REVENUE",
                1000,
              ),
            ],

            actuals:
              [],

            forecasts: [
              forecast,
            ],

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          scorecard.rows[
            0
          ].source,
        ).toBe(
          "FORECAST",
        );


        expect(
          scorecard.rows[
            0
          ].status,
        ).toBe(
          "ON_TRACK",
        );
      },
    );


    it(
      "classifies material misses as off track",
      () => {
        const scorecard =
          calculateManagementScorecard({
            targets: [
              target(
                "REVENUE",
                1500,
              ),
            ],

            actuals:
              [],

            forecasts: [
              forecast,
            ],

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          scorecard.rows[
            0
          ].status,
        ).toBe(
          "OFF_TRACK",
        );
      },
    );


    it(
      "calculates EBITDA margin targets",
      () => {
        const scorecard =
          calculateManagementScorecard({
            targets: [
              target(
                "EBITDA_MARGIN",
                0.20,
              ),
            ],

            actuals:
              [],

            forecasts: [
              forecast,
            ],

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          scorecard.rows[
            0
          ].currentValue,
        ).toBeCloseTo(
          0.20,
        );


        expect(
          scorecard.rows[
            0
          ].status,
        ).toBe(
          "ON_TRACK",
        );
      },
    );


    it(
      "uses live analytics for runway targets",
      () => {
        const scorecard =
          calculateManagementScorecard({
            targets: [
              target(
                "RUNWAY_MONTHS",
                1,
              ),
            ],

            actuals:
              [],

            forecasts: [
              forecast,
            ],

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          scorecard.rows[
            0
          ].source,
        ).toBe(
          "LIVE_ANALYTICS",
        );


        expect(
          scorecard.rows[
            0
          ].currentValue,
        ).not.toBeNull();
      },
    );


    it(
      "reports unavailable metrics when no matching observation exists",
      () => {
        const scorecard =
          calculateManagementScorecard({
            targets: [
              target(
                "REVENUE",
                1000,
                "2030-01",
              ),
            ],

            actuals:
              [],

            forecasts: [
              forecast,
            ],

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          scorecard.rows[
            0
          ].status,
        ).toBe(
          "UNAVAILABLE",
        );
      },
    );
  },
);
