import {
  describe,
  expect,
  it,
} from "vitest";

import {
  applyMonthlyExpenseOverrides,
  parseMonthlyOverrideValues,
  resolveMonthlyOverride,
} from "@/lib/finance/override-engine";
import {
  calculateMonthlyExpenseProfile,
} from "@/lib/finance/expense-engine";
import {
  toFinancialString,
} from "@/lib/finance/math";
import {
  createCustomerAssumptions,
} from "@/tests/fixtures/financial-model";

describe(
  "monthly override engine",
  () => {
    it(
      "applies global values before scenario-specific values",
      () => {
        const resolved =
          resolveMonthlyOverride(
            [
              {
                id:
                  "global",

                month:
                  "2027-01",

                scenarioId:
                  null,

                values: {
                  marketing:
                    "2000",

                  revenue:
                    "3000",
                },
              },

              {
                id:
                  "bull",

                month:
                  "2027-01",

                scenarioId:
                  "bull-scenario",

                values: {
                  marketing:
                    "3500",
                },
              },
            ],
            "bull-scenario",
            "2027-01",
          );

        expect(
          resolved.values
            .marketing,
        ).toBe(
          "3500",
        );

        expect(
          resolved.values
            .revenue,
        ).toBe(
          "3000",
        );
      },
    );

    it(
      "does not apply another scenario's override",
      () => {
        const resolved =
          resolveMonthlyOverride(
            [
              {
                month:
                  "2027-01",

                scenarioId:
                  "bull",

                values: {
                  revenue:
                    "5000",
                },
              },
            ],
            "bear",
            "2027-01",
          );

        expect(
          resolved.applied,
        ).toBe(
          false,
        );

        expect(
          resolved.values,
        ).toEqual(
          {},
        );
      },
    );

    it(
      "recalculates operating-expense total after overrides",
      () => {
        const assumptions =
          createCustomerAssumptions();

        const profile =
          calculateMonthlyExpenseProfile(
            assumptions.expenses,
            0,
          );

        const overridden =
          applyMonthlyExpenseOverrides(
            profile,
            {
              marketing:
                "2000",

              salaries:
                "500",
            },
          );

        expect(
          toFinancialString(
            overridden.marketing,
          ),
        ).toBe(
          "2000",
        );

        expect(
          toFinancialString(
            overridden.salaries,
          ),
        ).toBe(
          "500",
        );

        expect(
          toFinancialString(
            overridden.totalOperatingExpensesBeforeCogs,
          ),
        ).toBe(
          "2500",
        );
      },
    );

    it(
      "ignores corrupt persisted values",
      () => {
        expect(
          parseMonthlyOverrideValues({
            revenue:
              "not-a-number",

            marketing:
              "1500",
          }),
        ).toEqual({
          marketing:
            "1500",
        });
      },
    );
  },
);
