import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildExecutiveDecisionSignals,
} from "@/lib/finance/decision-center/signals";


describe(
  "Executive Decision Center signals",
  () => {
    it(
      "prioritizes critical liquidity and capital signals",
      () => {
        const signals =
          buildExecutiveDecisionSignals({
            actualPeriods:
              6,

            revenueVarianceRate:
              -0.12,

            ebitdaVarianceRate:
              -0.05,

            forecastAccuracyScore:
              0.82,

            forecastBiasCount:
              2,

            liquidityRiskLevel:
              "CRITICAL",

            downsideCashExhaustionPeriod:
              "2027-08",

            requiredCapital:
              250000,
          });


        expect(
          signals[
            0
          ].severity,
        ).toBe(
          "CRITICAL",
        );


        expect(
          signals.some(
            (
              signal,
            ) =>
              signal.code ===
              "CAPITAL_GAP",
          ),
        ).toBe(
          true,
        );


        expect(
          signals.some(
            (
              signal,
            ) =>
              signal.code ===
              "DOWNSIDE_EXHAUSTION",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "flags materially weak revenue performance",
      () => {
        const signals =
          buildExecutiveDecisionSignals({
            actualPeriods:
              3,

            revenueVarianceRate:
              -0.15,

            ebitdaVarianceRate:
              null,

            forecastAccuracyScore:
              0.95,

            forecastBiasCount:
              0,

            liquidityRiskLevel:
              "LOW",

            downsideCashExhaustionPeriod:
              null,

            requiredCapital:
              0,
          });


        expect(
          signals.find(
            (
              signal,
            ) =>
              signal.code ===
              "REVENUE_VARIANCE",
          )?.severity,
        ).toBe(
          "CRITICAL",
        );
      },
    );


    it(
      "flags weak forecast reliability",
      () => {
        const signals =
          buildExecutiveDecisionSignals({
            actualPeriods:
              6,

            revenueVarianceRate:
              null,

            ebitdaVarianceRate:
              null,

            forecastAccuracyScore:
              0.70,

            forecastBiasCount:
              0,

            liquidityRiskLevel:
              "LOW",

            downsideCashExhaustionPeriod:
              null,

            requiredCapital:
              0,
          });


        expect(
          signals.find(
            (
              signal,
            ) =>
              signal.code ===
              "FORECAST_ACCURACY",
          )?.severity,
        ).toBe(
          "CRITICAL",
        );
      },
    );


    it(
      "requests Actuals when no observed periods exist",
      () => {
        const signals =
          buildExecutiveDecisionSignals({
            actualPeriods:
              0,

            revenueVarianceRate:
              null,

            ebitdaVarianceRate:
              null,

            forecastAccuracyScore:
              null,

            forecastBiasCount:
              0,

            liquidityRiskLevel:
              "LOW",

            downsideCashExhaustionPeriod:
              null,

            requiredCapital:
              0,
          });


        expect(
          signals.some(
            (
              signal,
            ) =>
              signal.code ===
              "NO_ACTUALS",
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
