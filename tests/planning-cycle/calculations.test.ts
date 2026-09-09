import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildRollingReforecast,
  calculatePlanningCycleReport,
} from "@/lib/finance/planning-cycle/calculations";

import type {
  ActualFinancialPeriod,
} from "@/lib/finance/actuals/types";

import type {
  ForecastAnalyticsRow,
} from "@/lib/finance/analytics/types";


function forecast(
  period:
    string,
  revenue:
    number,
): ForecastAnalyticsRow {
  return {
    period,

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


function actual(
  period:
    string,
  revenue:
    number,
): ActualFinancialPeriod {
  return {
    period,

    revenue,

    cogs:
      28,

    operatingExpenses:
      48,

    ebitda:
      24,

    netIncome:
      18,

    cashFlow:
      12,

    cashBalance:
      1050,

    mrr:
      82,

    customers:
      11,
  };
}


describe(
  "rolling reforecast",
  () => {
    it(
      "uses Actuals when the month has observed performance",
      () => {
        const rows =
          buildRollingReforecast(
            [
              actual(
                "2027-01",
                120,
              ),
            ],
            [
              forecast(
                "2027-01",
                100,
              ),

              forecast(
                "2027-02",
                110,
              ),
            ],
          );


        expect(
          rows[
            0
          ].source,
        ).toBe(
          "ACTUAL",
        );


        expect(
          rows[
            0
          ].revenue,
        ).toBe(
          120,
        );


        expect(
          rows[
            1
          ].source,
        ).toBe(
          "FORECAST",
        );


        expect(
          rows[
            1
          ].revenue,
        ).toBe(
          110,
        );
      },
    );


    it(
      "does not mutate future forecast periods",
      () => {
        const current = [
          forecast(
            "2027-01",
            100,
          ),

          forecast(
            "2027-02",
            110,
          ),
        ];


        const original =
          JSON.stringify(
            current,
          );


        buildRollingReforecast(
          [
            actual(
              "2027-01",
              120,
            ),
          ],
          current,
        );


        expect(
          JSON.stringify(
            current,
          ),
        ).toBe(
          original,
        );
      },
    );


    it(
      "compares baseline, current forecast and rolling reforecast",
      () => {
        const report =
          calculatePlanningCycleReport(
            [
              forecast(
                "2027-01",
                100,
              ),

              forecast(
                "2027-02",
                100,
              ),
            ],
            [
              forecast(
                "2027-01",
                110,
              ),

              forecast(
                "2027-02",
                120,
              ),
            ],
            [
              actual(
                "2027-01",
                130,
              ),
            ],
          );


        expect(
          report.metrics
            .revenue
            .baseline,
        ).toBe(
          200,
        );


        expect(
          report.metrics
            .revenue
            .currentForecast,
        ).toBe(
          230,
        );


        expect(
          report.metrics
            .revenue
            .rollingReforecast,
        ).toBe(
          250,
        );


        expect(
          report.actualPeriodsUsed,
        ).toBe(
          1,
        );


        expect(
          report.forecastPeriodsUsed,
        ).toBe(
          1,
        );
      },
    );


    it(
      "uses the final cash balance rather than summing cash balances",
      () => {
        const report =
          calculatePlanningCycleReport(
            [
              {
                ...forecast(
                  "2027-01",
                  100,
                ),

                cashBalance:
                  900,
              },

              {
                ...forecast(
                  "2027-02",
                  100,
                ),

                cashBalance:
                  1000,
              },
            ],
            [
              {
                ...forecast(
                  "2027-01",
                  100,
                ),

                cashBalance:
                  950,
              },

              {
                ...forecast(
                  "2027-02",
                  100,
                ),

                cashBalance:
                  1100,
              },
            ],
            [],
          );


        expect(
          report.metrics
            .cashBalance
            .baseline,
        ).toBe(
          1000,
        );


        expect(
          report.metrics
            .cashBalance
            .currentForecast,
        ).toBe(
          1100,
        );
      },
    );
  },
);
