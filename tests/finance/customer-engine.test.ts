import Decimal from "decimal.js";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateCustomerRevenueMonth,
} from "@/lib/finance/customer-engine";
import {
  toFinancialString,
} from "@/lib/finance/math";

describe(
  "customer-driven revenue engine",
  () => {
    const assumptions = {
      startingCustomers:
        "100",

      arpu:
        "20",

      monthlyChurnRate:
        "10",

      cac:
        "100",

      organicNewCustomers:
        "5",

      customerAcquisitionGrowthRate:
        "0",

      arpuGrowthRate:
        "0",

      monthlyOneTimeRevenue:
        "0",
    };

    it(
      "calculates paid acquisition, churn and ending customers",
      () => {
        const result =
          calculateCustomerRevenueMonth(
            assumptions,
            0,
            new Decimal(
              100,
            ),
            new Decimal(
              1000,
            ),
          );

        expect(
          toFinancialString(
            result.paidNewCustomers,
          ),
        ).toBe(
          "10",
        );

        expect(
          toFinancialString(
            result.organicNewCustomers,
          ),
        ).toBe(
          "5",
        );

        expect(
          toFinancialString(
            result.churnedCustomers,
          ),
        ).toBe(
          "10",
        );

        expect(
          toFinancialString(
            result.endingCustomers,
          ),
        ).toBe(
          "105",
        );

        expect(
          toFinancialString(
            result.mrr,
          ),
        ).toBe(
          "2100",
        );
      },
    );

    it(
      "supports month-specific CAC, churn and ARPU overrides",
      () => {
        const result =
          calculateCustomerRevenueMonth(
            assumptions,
            0,
            new Decimal(
              100,
            ),
            new Decimal(
              1000,
            ),
            {
              cac:
                "50",

              monthlyChurnRate:
                "5",

              arpu:
                "30",
            },
          );

        expect(
          toFinancialString(
            result.paidNewCustomers,
          ),
        ).toBe(
          "20",
        );

        expect(
          toFinancialString(
            result.churnedCustomers,
          ),
        ).toBe(
          "5",
        );

        expect(
          toFinancialString(
            result.endingCustomers,
          ),
        ).toBe(
          "120",
        );

        expect(
          toFinancialString(
            result.arpu,
          ),
        ).toBe(
          "30",
        );

        expect(
          toFinancialString(
            result.mrr,
          ),
        ).toBe(
          "3600",
        );
      },
    );
  },
);
