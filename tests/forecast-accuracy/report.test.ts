import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateForecastAccuracyReport,
} from "@/lib/finance/forecast-accuracy/calculations";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";


function actual(
  month:
    number,
  revenue:
    number,
): ActualFinancialPeriod {
  return {
    period:
      `2027-${month
        .toString()
        .padStart(
          2,
          "0",
        )}`,

    revenue,

    cogs:
      30,

    operatingExpenses:
      50,

    ebitda:
      20,

    netIncome:
      15,

    cashFlow:
      10,

    cashBalance:
      1000,

    mrr:
      80,

    customers:
      10,
  };
}


function forecast(
  month:
    number,
  revenue:
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

    revenue,

    cogs:
      30,

    grossProfit:
      revenue -
      30,

    operatingExpenses:
      50,

    ebitda:
      20,

    netIncome:
      15,

    cashFlow:
      10,

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
  "forecast accuracy report",
  () => {
    it(
      "builds 3/6/12-month windows",
      () => {
        const actuals =
          Array.from(
            {
              length:
                12,
            },
            (
              _,
              index,
            ) =>
              actual(
                index +
                  1,
                100,
              ),
          );


        const forecasts =
          Array.from(
            {
              length:
                12,
            },
            (
              _,
              index,
            ) =>
              forecast(
                index +
                  1,
                110,
              ),
          );


        const report =
          calculateForecastAccuracyReport(
            actuals,
            forecasts,
          );


        const revenue =
          report.metrics.find(
            (
              metric,
            ) =>
              metric.metric ===
              "revenue",
          );


        expect(
          revenue?.rolling3
            .observations,
        ).toBe(
          3,
        );


        expect(
          revenue?.rolling6
            .observations,
        ).toBe(
          6,
        );


        expect(
          revenue?.rolling12
            .observations,
        ).toBe(
          12,
        );
      },
    );


    it(
      "creates management flags for high forecast error",
      () => {
        const actuals = [
          actual(
            1,
            100,
          ),

          actual(
            2,
            100,
          ),

          actual(
            3,
            100,
          ),
        ];


        const forecasts = [
          forecast(
            1,
            150,
          ),

          forecast(
            2,
            150,
          ),

          forecast(
            3,
            150,
          ),
        ];


        const report =
          calculateForecastAccuracyReport(
            actuals,
            forecasts,
          );


        expect(
          report.flags.some(
            (
              flag,
            ) =>
              flag.metric ===
                "revenue" &&
              flag.code ===
                "HIGH_FORECAST_ERROR",
          ),
        ).toBe(
          true,
        );


        expect(
          report.flags.some(
            (
              flag,
            ) =>
              flag.metric ===
                "revenue" &&
              flag.code ===
                "PERSISTENT_OVER_FORECAST",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "preserves latest actual period",
      () => {
        const report =
          calculateForecastAccuracyReport(
            [
              actual(
                1,
                100,
              ),

              actual(
                2,
                100,
              ),
            ],
            [
              forecast(
                1,
                100,
              ),

              forecast(
                2,
                100,
              ),
            ],
          );


        expect(
          report.latestPeriod,
        ).toBe(
          "2027-02",
        );
      },
    );
  },
);
