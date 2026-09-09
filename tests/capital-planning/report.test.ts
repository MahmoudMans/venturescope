import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildCapitalSourceCashPath,
  calculateCapitalPlanningReport,
} from "@/lib/finance/capital-planning/calculations";

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


function row(
  month:
    number,
  cashBalance:
    number,
): ForecastAnalyticsRow {
  return {
    period:
      `2027-${month
        .toString()
        .padStart(
          2,
          "0",
        )}`,

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
      100,

    cashFlow:
      100,

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
  "capital planning report",
  () => {
    const rows = [
      row(
        1,
        500,
      ),

      row(
        2,
        400,
      ),

      row(
        3,
        300,
      ),
    ];


    it(
      "builds the base cash source from forecast balances",
      () => {
        const path =
          buildCapitalSourceCashPath({
            basis:
              "BASE",

            rows,

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,
          });


        expect(
          path.map(
            (
              point,
            ) =>
              point.cashBalance,
          ),
        ).toEqual([
          500,
          400,
          300,
        ]);
      },
    );


    it(
      "builds a more conservative downside cash path",
      () => {
        const base =
          buildCapitalSourceCashPath({
            basis:
              "BASE",

            rows,

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              500,
          });


        const downside =
          buildCapitalSourceCashPath({
            basis:
              "DOWNSIDE",

            rows,

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              500,
          });


        expect(
          Math.min(
            ...downside.map(
              (
                point,
              ) =>
                point.cashBalance,
            ),
          ),
        ).toBeLessThan(
          Math.min(
            ...base.map(
              (
                point,
              ) =>
                point.cashBalance,
            ),
          ),
        );
      },
    );


    it(
      "returns all three capital strategies",
      () => {
        const report =
          calculateCapitalPlanningReport({
            basis:
              "BASE",

            rows,

            riskPolicy:
              policy,

            latestActualPeriod:
              null,

            latestActualCash:
              null,

            inputs: {
              targetCashFloor:
                500,

              raisePeriodIndex:
                0,

              capitalAmount:
                200,

              preMoneyValuation:
                1000,

              annualDebtRate:
                0.10,

              debtTermMonths:
                24,

              hybridEquityShare:
                0.50,
            },
          });


        expect(
          report.strategies.map(
            (
              strategy,
            ) =>
              strategy.kind,
          ),
        ).toEqual([
          "EQUITY",
          "DEBT",
          "HYBRID",
        ]);
      },
    );
  },
);
