import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildDownsideCashScenario,
  calculateLiquidityRiskReport,
} from "@/lib/finance/risk-center/calculations";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";

import type {
  ProjectRiskPolicy,
} from "@/lib/finance/risk-center/types";


const policy:
  ProjectRiskPolicy = {
    minimumCash:
      200,

    minimumRunwayMonths:
      6,

    minimumEbitdaMargin:
      0.10,

    maximumMonthlyBurn:
      100,

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
  ebitda =
    200,
  cashFlow =
    100,
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

  ebitda?:
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

    ebitda,

    netIncome:
      ebitda,

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
  "Liquidity risk calculations",
  () => {
    it(
      "reports low risk for healthy cash generation",
      () => {
        const report =
          calculateLiquidityRiskReport({
            rows: [
              row({
                month:
                  1,

                cashBalance:
                  1000,
              }),

              row({
                month:
                  2,

                cashBalance:
                  1100,
              }),

              row({
                month:
                  3,

                cashBalance:
                  1200,
              }),
            ],

            policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          report.level,
        ).toBe(
          "LOW",
        );


        expect(
          report.firstCashExhaustionPeriod,
        ).toBeNull();
      },
    );


    it(
      "detects cash-floor and exhaustion breaches",
      () => {
        const report =
          calculateLiquidityRiskReport({
            rows: [
              row({
                month:
                  1,

                cashFlow:
                  -150,

                cashBalance:
                  250,
              }),

              row({
                month:
                  2,

                cashFlow:
                  -150,

                cashBalance:
                  100,
              }),

              row({
                month:
                  3,

                cashFlow:
                  -150,

                cashBalance:
                  -50,
              }),
            ],

            policy,

            latestActualPeriod:
              null,

            latestActualCash:
              400,
          });


        expect(
          report.firstMinimumCashBreachPeriod,
        ).toBe(
          "2027-02",
        );


        expect(
          report.firstCashExhaustionPeriod,
        ).toBe(
          "2027-03",
        );


        expect(
          report.score,
        ).toBeGreaterThan(
          0,
        );
      },
    );


    it(
      "detects EBITDA-margin guardrail breaches",
      () => {
        const report =
          calculateLiquidityRiskReport({
            rows: [
              row({
                month:
                  1,

                revenue:
                  1000,

                ebitda:
                  50,
              }),
            ],

            policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          report.guardrails.find(
            (
              guardrail,
            ) =>
              guardrail.code ===
              "EBITDA_MARGIN",
          )?.state,
        ).toBe(
          "BREACH",
        );
      },
    );


    it(
      "applies revenue and cost stress to cash flow",
      () => {
        const downside =
          buildDownsideCashScenario(
            [
              row({
                month:
                  1,

                revenue:
                  1000,

                cogs:
                  300,

                operatingExpenses:
                  500,

                cashFlow:
                  100,

                cashBalance:
                  1000,
              }),
            ],
            policy,
            null,
            1000,
          );


        /*
         * 100 baseline cash flow
         * - 200 revenue shock
         * - 80 extra cost
         * = -180 stressed flow
         */
        expect(
          downside[
            0
          ].stressedCashFlow,
        ).toBe(
          -180,
        );


        expect(
          downside[
            0
          ].stressedCashBalance,
        ).toBe(
          820,
        );
      },
    );


    it(
      "uses only forecast months after the latest actual month when available",
      () => {
        const report =
          calculateLiquidityRiskReport({
            rows: [
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
            ],

            policy,

            latestActualPeriod:
              "2027-01",

            latestActualCash:
              900,
          });


        expect(
          report.forecastPeriods,
        ).toBe(
          2,
        );
      },
    );
  },
);
