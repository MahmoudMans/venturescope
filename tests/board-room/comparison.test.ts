import {
  describe,
  expect,
  it,
} from "vitest";

import {
  compareExecutiveReview,
} from "@/lib/finance/board-room/comparison";

import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";


function snapshot({
  revenueVariance,
  forecastAccuracy,
  riskScore,
  capitalNeed,
  openActions,
}: {
  revenueVariance:
    number;

  forecastAccuracy:
    number;

  riskScore:
    number;

  capitalNeed:
    number;

  openActions:
    number;
}): ExecutiveReviewSnapshot {
  return {
    schemaVersion:
      1,

    capturedAt:
      "2027-01-01T00:00:00.000Z",

    kpis: {
      actualPeriods:
        1,

      matchedPeriods:
        1,

      revenueVarianceRate:
        revenueVariance,

      ebitdaVarianceRate:
        0,

      forecastAccuracyScore:
        forecastAccuracy,

      forecastWape:
        1 -
        forecastAccuracy,

      liquidityRiskLevel:
        "LOW",

      liquidityRiskScore:
        riskScore,

      minimumForecastCash:
        100,

      minimumDownsideCash:
        50,

      downsideCashExhaustionPeriod:
        null,

      capitalNeed,
    },

    actions: {
      open:
        openActions,

      criticalOpen:
        0,

      overdue:
        0,

      done:
        0,
    },

    signals:
      [],
  };
}


describe(
  "executive review comparison",
  () => {
    it(
      "calculates live movement from frozen review",
      () => {
        const frozen =
          snapshot({
            revenueVariance:
              -0.10,

            forecastAccuracy:
              0.80,

            riskScore:
              20,

            capitalNeed:
              100,

            openActions:
              4,
          });


        const live =
          snapshot({
            revenueVariance:
              -0.05,

            forecastAccuracy:
              0.90,

            riskScore:
              35,

            capitalNeed:
              150,

            openActions:
              2,
          });


        const result =
          compareExecutiveReview(
            frozen,
            live,
          );


        expect(
          result.revenueVarianceRate
            .delta,
        ).toBeCloseTo(
          0.05,
        );


        expect(
          result.forecastAccuracyScore
            .delta,
        ).toBeCloseTo(
          0.10,
        );


        expect(
          result.liquidityRiskScore
            .delta,
        ).toBe(
          15,
        );


        expect(
          result.capitalNeed
            .delta,
        ).toBe(
          50,
        );


        expect(
          result.openActions
            .delta,
        ).toBe(
          -2,
        );
      },
    );
  },
);
