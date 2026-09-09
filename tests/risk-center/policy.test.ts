import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseProjectRiskPolicy,
} from "@/lib/finance/risk-center/policy";


describe(
  "Project risk policy",
  () => {
    it(
      "normalizes percentage inputs",
      () => {
        const policy =
          parseProjectRiskPolicy({
            minimumCash:
              "50000",

            minimumRunwayMonths:
              "9",

            minimumEbitdaMarginPercent:
              "10",

            maximumMonthlyBurn:
              "25000",

            downsideRevenueShockPercent:
              "20",

            downsideCostInflationPercent:
              "12",
          });


        expect(
          policy.minimumCash,
        ).toBe(
          50000,
        );


        expect(
          policy.minimumRunwayMonths,
        ).toBe(
          9,
        );


        expect(
          policy.minimumEbitdaMargin,
        ).toBe(
          0.10,
        );


        expect(
          policy.downsideRevenueShock,
        ).toBe(
          0.20,
        );
      },
    );


    it(
      "allows optional financial guardrails",
      () => {
        const policy =
          parseProjectRiskPolicy({
            minimumCash:
              "",

            minimumRunwayMonths:
              "6",

            minimumEbitdaMarginPercent:
              "",

            maximumMonthlyBurn:
              "",

            downsideRevenueShockPercent:
              "20",

            downsideCostInflationPercent:
              "10",
          });


        expect(
          policy.minimumCash,
        ).toBeNull();


        expect(
          policy.minimumEbitdaMargin,
        ).toBeNull();


        expect(
          policy.maximumMonthlyBurn,
        ).toBeNull();
      },
    );


    it(
      "rejects invalid runway values",
      () => {
        expect(
          () =>
            parseProjectRiskPolicy({
              minimumCash:
                "0",

              minimumRunwayMonths:
                "0",

              minimumEbitdaMarginPercent:
                "",

              maximumMonthlyBurn:
                "",

              downsideRevenueShockPercent:
                "20",

              downsideCostInflationPercent:
                "10",
            }),
        ).toThrow(
          /runway/i,
        );
      },
    );


    it(
      "rejects excessive downside shocks",
      () => {
        expect(
          () =>
            parseProjectRiskPolicy({
              minimumCash:
                "0",

              minimumRunwayMonths:
                "6",

              minimumEbitdaMarginPercent:
                "",

              maximumMonthlyBurn:
                "",

              downsideRevenueShockPercent:
                "95",

              downsideCostInflationPercent:
                "10",
            }),
        ).toThrow(
          /revenue downside/i,
        );
      },
    );
  },
);
