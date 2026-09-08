import {
  describe,
  expect,
  it,
} from "vitest";

import {
  generateFinancialForecast,
} from "@/lib/finance/engine";
import {
  createCustomerModelInput,
} from "@/tests/fixtures/financial-model";

describe(
  "complete customer-driven forecast",
  () => {
    it(
      "propagates the customer population month to month",
      () => {
        const forecast =
          generateFinancialForecast(
            createCustomerModelInput(),
          );

        expect(
          forecast.months[0]
            .openingCustomers,
        ).toBe(
          "100",
        );

        expect(
          forecast.months[0]
            .endingCustomers,
        ).toBe(
          "105",
        );

        expect(
          forecast.months[1]
            .openingCustomers,
        ).toBe(
          "105",
        );

        expect(
          forecast.months[1]
            .endingCustomers,
        ).toBe(
          "109.5",
        );

        expect(
          forecast.months[1]
            .mrr,
        ).toBe(
          "2190",
        );
      },
    );

    it(
      "allows CAC and marketing overrides to affect later customer months",
      () => {
        const input =
          createCustomerModelInput();

        input.monthlyOverrides = [
          {
            id:
              "jan-override",

            scenarioId:
              null,

            month:
              "2027-01",

            values: {
              marketing:
                "2000",

              cac:
                "50",
            },
          },
        ];

        const forecast =
          generateFinancialForecast(
            input,
          );

        expect(
          forecast.months[0]
            .paidNewCustomers,
        ).toBe(
          "40",
        );

        expect(
          forecast.months[0]
            .endingCustomers,
        ).toBe(
          "135",
        );

        expect(
          forecast.months[1]
            .openingCustomers,
        ).toBe(
          "135",
        );
      },
    );

    it(
      "keeps customer values internally fractional",
      () => {
        const forecast =
          generateFinancialForecast(
            createCustomerModelInput(),
          );

        expect(
          forecast.months[1]
            .endingCustomers,
        ).toContain(
          ".",
        );
      },
    );
  },
);
