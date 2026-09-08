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
  "complete direct financial forecast",
  () => {
    it(
      "generates exactly the configured horizon",
      () => {
        const forecast =
          generateFinancialForecast(
            createDirectModelInput(),
          );

        expect(
          forecast.months,
        ).toHaveLength(
          12,
        );

        expect(
          forecast.months[0]
            .month,
        ).toBe(
          "2027-01",
        );

        expect(
          forecast.months[11]
            .month,
        ).toBe(
          "2027-12",
        );
      },
    );

    it(
      "produces a deterministic first-month P&L and cash flow",
      () => {
        const forecast =
          generateFinancialForecast(
            createDirectModelInput(),
          );

        const month =
          forecast.months[0];

        expect(
          month.revenue,
        ).toBe(
          "11000",
        );

        expect(
          month.mrr,
        ).toBe(
          "8000",
        );

        expect(
          month.cogs,
        ).toBe(
          "1100",
        );

        expect(
          month.grossProfit,
        ).toBe(
          "9900",
        );

        expect(
          month.totalOperatingExpenses,
        ).toBe(
          "2000",
        );

        expect(
          month.ebitda,
        ).toBe(
          "7900",
        );

        expect(
          month.tax,
        ).toBe(
          "1580",
        );

        expect(
          month.netIncome,
        ).toBe(
          "6320",
        );

        expect(
          month.endingCash,
        ).toBe(
          "106320",
        );
      },
    );

    it(
      "does not treat equity financing as revenue",
      () => {
        const input =
          createDirectModelInput();

        input.financingEvents = [
          {
            name:
              "Equity",

            type:
              "EQUITY",

            month:
              "2027-01",

            amount:
              "50000",
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
          "11000",
        );

        expect(
          forecast.months[0]
            .financingInflows
            .equity,
        ).toBe(
          "50000",
        );

        expect(
          forecast.months[0]
            .endingCash,
        ).toBe(
          "156320",
        );
      },
    );

    it(
      "produces identical output for identical input",
      () => {
        const first =
          generateFinancialForecast(
            createDirectModelInput(),
          );

        const second =
          generateFinancialForecast(
            createDirectModelInput(),
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );
  },
);
