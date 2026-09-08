import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateCogs,
  calculateMonthlyExpenseProfile,
} from "@/lib/finance/expense-engine";
import {
  decimal,
  toFinancialString,
} from "@/lib/finance/math";
import type {
  ExpenseAssumptions,
} from "@/lib/finance/assumptions/types";

describe(
  "expense engine",
  () => {
    const assumptions: ExpenseAssumptions =
      {
        salaries: {
          monthlyAmount:
            "1200",

          annualGrowthRate:
            "0",
        },

        rent: {
          monthlyAmount:
            "500",

          annualGrowthRate:
            "0",
        },

        marketing: {
          monthlyAmount:
            "300",

          growthRate:
            "0",

          growthPeriod:
            "MONTHLY",
        },

        cogs: {
          method:
            "PERCENTAGE",

          percentage:
            "20",

          fixedMonthlyAmount:
            "0",
        },

        operatingExpenses: {
          software:
            "100",

          professionalServices:
            "0",

          insurance:
            "0",

          utilities:
            "0",

          travel:
            "0",

          other:
            "0",

          custom: [
            {
              id:
                "custom",

              name:
                "Custom",

              monthlyAmount:
                "50",
            },
          ],
        },
      };

    it(
      "aggregates operating expenses",
      () => {
        const profile =
          calculateMonthlyExpenseProfile(
            assumptions,
            0,
          );

        expect(
          toFinancialString(
            profile.otherOperatingExpenses,
          ),
        ).toBe(
          "150",
        );

        expect(
          toFinancialString(
            profile.totalOperatingExpensesBeforeCogs,
          ),
        ).toBe(
          "2150",
        );
      },
    );

    it(
      "calculates percentage-based COGS",
      () => {
        const profile =
          calculateMonthlyExpenseProfile(
            assumptions,
            0,
          );

        expect(
          toFinancialString(
            calculateCogs(
              profile,
              decimal(
                10000,
              ),
            ),
          ),
        ).toBe(
          "2000",
        );
      },
    );

    it(
      "supports fixed monthly COGS",
      () => {
        const profile =
          calculateMonthlyExpenseProfile(
            {
              ...assumptions,

              cogs: {
                method:
                  "FIXED_MONTHLY",

                percentage:
                  "0",

                fixedMonthlyAmount:
                  "750",
              },
            },
            0,
          );

        expect(
          toFinancialString(
            calculateCogs(
              profile,
              decimal(
                10000,
              ),
            ),
          ),
        ).toBe(
          "750",
        );
      },
    );
  },
);
