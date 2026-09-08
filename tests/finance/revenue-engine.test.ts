import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateDirectRevenueMonth,
} from "@/lib/finance/revenue-engine";
import {
  toFinancialString,
} from "@/lib/finance/math";

describe(
  "direct revenue engine",
  () => {
    const assumptions = {
      startingMonthlyRevenue:
        "10000",

      monthlyGrowthRate:
        "10",

      recurringRevenuePercentage:
        "80",

      monthlyOneTimeRevenue:
        "1000",
    };

    it(
      "calculates first-month revenue and MRR",
      () => {
        const result =
          calculateDirectRevenueMonth(
            assumptions,
            0,
          );

        expect(
          toFinancialString(
            result.totalRevenue,
          ),
        ).toBe(
          "11000",
        );

        expect(
          toFinancialString(
            result.mrr,
          ),
        ).toBe(
          "8000",
        );

        expect(
          toFinancialString(
            result.nonRecurringRevenue,
          ),
        ).toBe(
          "3000",
        );
      },
    );

    it(
      "applies compounded growth to core revenue only",
      () => {
        const result =
          calculateDirectRevenueMonth(
            assumptions,
            1,
          );

        expect(
          toFinancialString(
            result.coreRevenue,
          ),
        ).toBe(
          "11000",
        );

        expect(
          toFinancialString(
            result.totalRevenue,
          ),
        ).toBe(
          "12000",
        );

        expect(
          toFinancialString(
            result.mrr,
          ),
        ).toBe(
          "8800",
        );
      },
    );
  },
);
