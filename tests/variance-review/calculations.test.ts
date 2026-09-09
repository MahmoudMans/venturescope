import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateVarianceReview,
} from "@/lib/finance/variance-review/calculations";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import type {
  VarianceCommentaryView,
} from "@/lib/finance/variance-review/types";


const actual:
  ActualFinancialPeriod = {
    period:
      "2027-01",

    revenue:
      900,

    cogs:
      250,

    operatingExpenses:
      550,

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


function commentary():
  VarianceCommentaryView {
  return {
    id:
      "comment-1",

    periodKey:
      "2027-01",

    metricCode:
      "REVENUE",

    causeCode:
      "VOLUME",

    varianceNature:
      "RECURRING",

    explanation:
      "Sales volume was below plan.",

    correctiveAction:
      "Increase qualified pipeline.",

    ownerName:
      "Commercial",

    recoveryPeriodKey:
      "2027-03",

    status:
      "MONITORING",

    createdAt:
      "2027-02-01T00:00:00.000Z",

    updatedAt:
      "2027-02-01T00:00:00.000Z",

    createdBy:
      null,
  };
}


describe(
  "variance review",
  () => {
    it(
      "uses Actual minus Forecast convention",
      () => {
        const review =
          calculateVarianceReview({
            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            commentaries:
              [],
          });


        const revenue =
          review.rows.find(
            (
              row,
            ) =>
              row.metricCode ===
              "REVENUE",
          );


        expect(
          revenue?.variance,
        ).toBe(
          -100,
        );


        expect(
          revenue?.varianceRate,
        ).toBeCloseTo(
          -0.10,
        );


        expect(
          revenue?.favorability,
        ).toBe(
          "UNFAVORABLE",
        );


        expect(
          revenue?.materiality,
        ).toBe(
          "MATERIAL",
        );
      },
    );


    it(
      "treats lower COGS as favorable",
      () => {
        const review =
          calculateVarianceReview({
            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            commentaries:
              [],
          });


        const cogs =
          review.rows.find(
            (
              row,
            ) =>
              row.metricCode ===
              "COGS",
          );


        expect(
          cogs?.variance,
        ).toBe(
          -50,
        );


        expect(
          cogs?.favorability,
        ).toBe(
          "FAVORABLE",
        );
      },
    );


    it(
      "treats higher operating expenses as unfavorable",
      () => {
        const review =
          calculateVarianceReview({
            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            commentaries:
              [],
          });


        const opex =
          review.rows.find(
            (
              row,
            ) =>
              row.metricCode ===
              "OPERATING_EXPENSES",
          );


        expect(
          opex?.variance,
        ).toBe(
          50,
        );


        expect(
          opex?.favorability,
        ).toBe(
          "UNFAVORABLE",
        );
      },
    );


    it(
      "detects unexplained material variances",
      () => {
        const review =
          calculateVarianceReview({
            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            commentaries:
              [],
          });


        expect(
          review.summary
            .materialUnexplained,
        ).toBeGreaterThan(
          0,
        );
      },
    );


    it(
      "matches management commentary to period and metric",
      () => {
        const review =
          calculateVarianceReview({
            actuals: [
              actual,
            ],

            forecasts: [
              forecast,
            ],

            commentaries: [
              commentary(),
            ],
          });


        const revenue =
          review.rows.find(
            (
              row,
            ) =>
              row.metricCode ===
              "REVENUE",
          );


        expect(
          revenue?.commentary?.causeCode,
        ).toBe(
          "VOLUME",
        );


        expect(
          review.summary
            .monitoringCommentaries,
        ).toBe(
          1,
        );
      },
    );


    it(
      "only compares matched Actual and Forecast periods",
      () => {
        const review =
          calculateVarianceReview({
            actuals: [
              actual,
            ],

            forecasts: [
              {
                ...forecast,

                period:
                  "2027-02",
              },
            ],

            commentaries:
              [],
          });


        expect(
          review.rows,
        ).toHaveLength(
          0,
        );
      },
    );
  },
);
