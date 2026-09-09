import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateAdvancedAnalytics,
  calculateOperatingAnalytics,
  calculateUnitEconomics,
  type ForecastAnalyticsRow,
} from "@/lib/finance/analytics";


function forecastRow(
  revenue:
    number,
  mrr:
    number,
): ForecastAnalyticsRow {
  return {
    period:
      "month",

    revenue,

    cogs:
      revenue *
      0.3,

    grossProfit:
      revenue *
      0.7,

    operatingExpenses:
      revenue *
      0.55,

    ebitda:
      revenue *
      0.15,

    netIncome:
      revenue *
      0.1,

    cashFlow:
      revenue *
      0.08,

    cashBalance:
      50000,

    mrr,

    customers:
      100,

    cac:
      200,

    churnRate:
      0.02,
  };
}


const rows = [
  ...Array.from(
    {
      length:
        12,
    },
    () =>
      forecastRow(
        10000,
        5000,
      ),
  ),

  ...Array.from(
    {
      length:
        12,
    },
    (
      _,
      index,
    ) =>
      forecastRow(
        12000,
        6000 +
          index *
          100,
      ),
  ),
];


describe(
  "operating analytics",
  () => {
    it(
      "calculates revenue growth and EBITDA margin",
      () => {
        const result =
          calculateOperatingAnalytics(
            rows,
          );


        expect(
          result.revenueGrowthRate,
        ).toBeCloseTo(
          0.2,
        );


        expect(
          result.ebitdaMarginRate,
        ).toBeCloseTo(
          0.15,
        );


        expect(
          result.ruleOf40,
        ).toBeCloseTo(
          0.35,
        );
      },
    );


    it(
      "calculates gross-margin unit economics",
      () => {
        const result =
          calculateUnitEconomics(
            rows,
          );


        expect(
          result.grossMarginRate,
        ).toBeCloseTo(
          0.7,
        );


        expect(
          result.monthlyArpu,
        ).toBeGreaterThan(
          0,
        );


        expect(
          result.lifetimeValue,
        ).toBeGreaterThan(
          result.cac ??
          0,
        );
      },
    );


    it(
      "returns one deterministic analytics result",
      () => {
        const result =
          calculateAdvancedAnalytics(
            rows,
            {
              discountRate:
                0.15,

              terminalGrowthRate:
                0.03,
            },
          );


        expect(
          result.rowCount,
        ).toBe(
          24,
        );


        expect(
          result.unitEconomics.ltvToCac,
        ).not.toBeNull();
      },
    );
  },
);
