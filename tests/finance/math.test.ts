import {
  describe,
  expect,
  it,
} from "vitest";

import {
  annualPercentageToMonthlyRate,
  averageDecimals,
  compoundValue,
  decimal,
  percentageRatio,
  toFinancialString,
} from "@/lib/finance/math";

describe(
  "financial decimal math",
  () => {
    it(
      "avoids binary floating-point accumulation",
      () => {
        expect(
          toFinancialString(
            decimal(
              "0.1",
            ).plus(
              "0.2",
            ),
          ),
        ).toBe(
          "0.3",
        );
      },
    );

    it(
      "converts percentage ratios correctly",
      () => {
        expect(
          toFinancialString(
            percentageRatio(
              decimal(
                25,
              ),
              decimal(
                100,
              ),
            )!,
          ),
        ).toBe(
          "25",
        );
      },
    );

    it(
      "returns null for division by zero margins",
      () => {
        expect(
          percentageRatio(
            decimal(
              10,
            ),
            decimal(
              0,
            ),
          ),
        ).toBeNull();
      },
    );

    it(
      "compounds an annual rate through its monthly equivalent",
      () => {
        const monthlyRate =
          annualPercentageToMonthlyRate(
            "12",
          );

        const result =
          compoundValue(
            "100",
            monthlyRate,
            12,
          );

        expect(
          result.toNumber(),
        ).toBeCloseTo(
          112,
          8,
        );
      },
    );

    it(
      "averages decimal values",
      () => {
        const average =
          averageDecimals([
            decimal(
              "10",
            ),
            decimal(
              "20",
            ),
            decimal(
              "30",
            ),
          ]);

        expect(
          toFinancialString(
            average,
          ),
        ).toBe(
          "20",
        );
      },
    );
  },
);
