import {
  describe,
  expect,
  it,
} from "vitest";

import {
  generateFinancialForecast,
} from "@/lib/finance/engine";
import {
  createDirectModelInput,
} from "@/tests/fixtures/financial-model";

describe(
  "financial-engine edge cases",
  () => {
    it(
      "allows cash to become negative instead of clamping it",
      () => {
        const input =
          createDirectModelInput();

        input.assumptions.general.startingCash =
          "100";

        input.assumptions.directRevenue.startingMonthlyRevenue =
          "0";

        input.assumptions.directRevenue.monthlyGrowthRate =
          "0";

        input.assumptions.directRevenue.monthlyOneTimeRevenue =
          "0";

        input.assumptions.expenses.salaries.monthlyAmount =
          "1000";

        input.assumptions.expenses.rent.monthlyAmount =
          "0";

        input.assumptions.expenses.marketing.monthlyAmount =
          "0";

        const forecast =
          generateFinancialForecast(
            input,
          );

        expect(
          Number(
            forecast.months[0]
              .endingCash,
          ),
        ).toBeLessThan(
          0,
        );

        expect(
          forecast.metrics
            .runway.status,
        ).toBe(
          "EXHAUSTED",
        );
      },
    );

    it(
      "returns null break-even revenue when percentage COGS reaches 100%",
      () => {
        const input =
          createDirectModelInput();

        input.assumptions.expenses.cogs.percentage =
          "100";

        const forecast =
          generateFinancialForecast(
            input,
          );

        expect(
          forecast.months[0]
            .breakEvenRevenue,
        ).toBeNull();
      },
    );

    it(
      "does not tax a loss-making month",
      () => {
        const input =
          createDirectModelInput();

        input.assumptions.directRevenue.startingMonthlyRevenue =
          "0";

        input.assumptions.directRevenue.monthlyOneTimeRevenue =
          "0";

        input.assumptions.expenses.salaries.monthlyAmount =
          "10000";

        const forecast =
          generateFinancialForecast(
            input,
          );

        expect(
          Number(
            forecast.months[0]
              .profitBeforeTax,
          ),
        ).toBeLessThan(
          0,
        );

        expect(
          forecast.months[0]
            .tax,
        ).toBe(
          "0",
        );
      },
    );

    it(
      "supports an exact zero revenue override",
      () => {
        const input =
          createDirectModelInput();

        input.monthlyOverrides = [
          {
            month:
              "2027-01",

            scenarioId:
              null,

            values: {
              revenue:
                "0",
            },
          },
        ];

        const forecast =
          generateFinancialForecast(
            input,
          );

        expect(
          forecast.months[0]
            .revenue,
        ).toBe(
          "0",
        );

        expect(
          forecast.months[0]
            .mrr,
        ).toBe(
          "0",
        );
      },
    );
  },
);
