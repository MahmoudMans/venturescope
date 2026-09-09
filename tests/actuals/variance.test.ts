import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateVarianceReport,
  metricVariance,
  normalizeForecastPeriodKey,
} from "@/lib/finance/actuals";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics";


function forecast(
  period:
    string,
): ForecastAnalyticsRow {
  return {
    period,

    revenue:
      100,

    cogs:
      40,

    grossProfit:
      60,

    operatingExpenses:
      30,

    ebitda:
      30,

    netIncome:
      20,

    cashFlow:
      15,

    cashBalance:
      1000,

    mrr:
      80,

    customers:
      10,

    cac:
      null,

    churnRate:
      null,
  };
}


describe(
  "Actuals vs forecast variance",
  () => {
    it(
      "treats higher revenue as favorable",
      () => {
        const result =
          metricVariance(
            "revenue",
            120,
            100,
          );


        expect(
          result.variance,
        ).toBe(
          20,
        );


        expect(
          result.varianceRate,
        ).toBeCloseTo(
          0.2,
        );


        expect(
          result.favorable,
        ).toBe(
          true,
        );
      },
    );


    it(
      "treats lower COGS as favorable",
      () => {
        expect(
          metricVariance(
            "cogs",
            30,
            40,
          ).favorable,
        ).toBe(
          true,
        );


        expect(
          metricVariance(
            "cogs",
            50,
            40,
          ).favorable,
        ).toBe(
          false,
        );
      },
    );


    it(
      "matches readable forecast periods to actual month keys",
      () => {
        expect(
          normalizeForecastPeriodKey(
            "Jan 2027",
          ),
        ).toBe(
          "2027-01",
        );
      },
    );


    it(
      "aggregates matched revenue and EBITDA",
      () => {
        const result =
          calculateVarianceReport(
            [
              {
                period:
                  "2027-01",

                revenue:
                  120,

                cogs:
                  35,

                operatingExpenses:
                  30,

                ebitda:
                  55,

                netIncome:
                  40,

                cashFlow:
                  30,

                cashBalance:
                  1100,

                mrr:
                  90,

                customers:
                  11,
              },
            ],
            [
              forecast(
                "2027-01",
              ),
            ],
          );


        expect(
          result.summary
            .matchedPeriods,
        ).toBe(
          1,
        );


        expect(
          result.summary
            .revenueVariance,
        ).toBe(
          20,
        );


        expect(
          result.summary
            .ebitdaVariance,
        ).toBe(
          25,
        );


        expect(
          result.summary
            .latestCashVariance,
        ).toBe(
          100,
        );
      },
    );
  },
);
