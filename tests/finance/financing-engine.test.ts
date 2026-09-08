import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateFinancingForMonth,
} from "@/lib/finance/financing-engine";
import {
  toFinancialString,
} from "@/lib/finance/math";
import type {
  FinancingEventInput,
} from "@/lib/finance/types";

describe(
  "financing engine",
  () => {
    const debt: FinancingEventInput =
      {
        id:
          "loan",

        name:
          "Test Loan",

        type:
          "DEBT",

        month:
          "2027-01",

        amount:
          "120000",

        apr:
          "12",

        termMonths:
          12,

        repaymentStartMonth:
          "2027-02",
      };

    it(
      "records debt funding without immediate interest or principal",
      () => {
        const result =
          calculateFinancingForMonth(
            [
              debt,
            ],
            "2027-01",
          );

        expect(
          toFinancialString(
            result.debtInflow,
          ),
        ).toBe(
          "120000",
        );

        expect(
          toFinancialString(
            result.interestExpense,
          ),
        ).toBe(
          "0",
        );

        expect(
          toFinancialString(
            result.principalRepayment,
          ),
        ).toBe(
          "0",
        );
      },
    );

    it(
      "uses equal principal and declining interest",
      () => {
        const february =
          calculateFinancingForMonth(
            [
              debt,
            ],
            "2027-02",
          );

        const march =
          calculateFinancingForMonth(
            [
              debt,
            ],
            "2027-03",
          );

        expect(
          toFinancialString(
            february.principalRepayment,
          ),
        ).toBe(
          "10000",
        );

        expect(
          toFinancialString(
            february.interestExpense,
          ),
        ).toBe(
          "1200",
        );

        expect(
          toFinancialString(
            march.principalRepayment,
          ),
        ).toBe(
          "10000",
        );

        expect(
          toFinancialString(
            march.interestExpense,
          ),
        ).toBe(
          "1100",
        );
      },
    );

    it(
      "separates financing types",
      () => {
        const result =
          calculateFinancingForMonth(
            [
              {
                name:
                  "Equity",

                type:
                  "EQUITY",

                month:
                  "2027-01",

                amount:
                  "100",
              },

              {
                name:
                  "Grant",

                type:
                  "GRANT",

                month:
                  "2027-01",

                amount:
                  "200",
              },

              {
                name:
                  "Other",

                type:
                  "OTHER",

                month:
                  "2027-01",

                amount:
                  "300",
              },
            ],
            "2027-01",
          );

        expect(
          toFinancialString(
            result.totalInflow,
          ),
        ).toBe(
          "600",
        );

        expect(
          toFinancialString(
            result.equityInflow,
          ),
        ).toBe(
          "100",
        );

        expect(
          toFinancialString(
            result.grantInflow,
          ),
        ).toBe(
          "200",
        );

        expect(
          toFinancialString(
            result.otherInflow,
          ),
        ).toBe(
          "300",
        );
      },
    );
  },
);
