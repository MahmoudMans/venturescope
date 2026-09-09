import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateDcf,
  calculateDcfSensitivity,
  type ForecastAnalyticsRow,
} from "@/lib/finance/analytics";


function row(
  month:
    number,
  cashFlow:
    number,
): ForecastAnalyticsRow {
  return {
    period:
      `M${month}`,

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

    cashFlow,

    cashBalance:
      10000,

    mrr:
      1000,

    customers:
      100,

    cac:
      100,

    churnRate:
      0.02,
  };
}


const rows =
  Array.from(
    {
      length:
        60,
    },
    (
      _,
      index,
    ) =>
      row(
        index +
          1,
        100 +
          index,
      ),
  );


describe(
  "DCF analytics",
  () => {
    it(
      "produces five annual forecast periods",
      () => {
        const result =
          calculateDcf(
            rows,
            {
              discountRate:
                0.15,

              terminalGrowthRate:
                0.03,
            },
          );


        expect(
          result?.annualCashFlows,
        ).toHaveLength(
          5,
        );


        expect(
          result?.enterpriseValue,
        ).toBeGreaterThan(
          0,
        );
      },
    );


    it(
      "rejects terminal growth equal to or above discount rate",
      () => {
        expect(
          calculateDcf(
            rows,
            {
              discountRate:
                0.03,

              terminalGrowthRate:
                0.03,
            },
          ),
        ).toBeNull();
      },
    );


    it(
      "reduces valuation as the discount rate increases",
      () => {
        const low =
          calculateDcf(
            rows,
            {
              discountRate:
                0.1,

              terminalGrowthRate:
                0.02,
            },
          );


        const high =
          calculateDcf(
            rows,
            {
              discountRate:
                0.2,

              terminalGrowthRate:
                0.02,
            },
          );


        expect(
          low?.enterpriseValue ??
          0,
        ).toBeGreaterThan(
          high?.enterpriseValue ??
          0,
        );
      },
    );


    it(
      "creates a deterministic sensitivity matrix",
      () => {
        const matrix =
          calculateDcfSensitivity(
            rows,
            {
              discountRate:
                0.15,

              terminalGrowthRate:
                0.03,
            },
          );


        expect(
          matrix.discountRates.length,
        ).toBeGreaterThanOrEqual(
          5,
        );


        expect(
          matrix.terminalGrowthRates.length,
        ).toBeGreaterThanOrEqual(
          5,
        );


        expect(
          matrix.cells,
        ).toHaveLength(
          matrix.discountRates.length *
          matrix.terminalGrowthRates.length,
        );
      },
    );
  },
);
