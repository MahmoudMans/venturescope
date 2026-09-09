import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseExecutiveReviewPeriod,
  parseExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/validation";


describe(
  "executive review validation",
  () => {
    it(
      "normalizes review month",
      () => {
        expect(
          parseExecutiveReviewPeriod(
            "Jan 2027",
          ),
        ).toBe(
          "2027-01",
        );
      },
    );


    it(
      "rejects invalid review month",
      () => {
        expect(
          () =>
            parseExecutiveReviewPeriod(
              "not-a-month",
            ),
        ).toThrow(
          /period|month/i,
        );
      },
    );


    it(
      "parses schema-v1 snapshots",
      () => {
        const parsed =
          parseExecutiveReviewSnapshot({
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
                0,

              ebitdaVarianceRate:
                0,

              forecastAccuracyScore:
                0.9,

              forecastWape:
                0.1,

              liquidityRiskLevel:
                "LOW",

              liquidityRiskScore:
                10,

              minimumForecastCash:
                100,

              minimumDownsideCash:
                50,

              downsideCashExhaustionPeriod:
                null,

              capitalNeed:
                0,
            },

            actions: {
              open:
                1,

              criticalOpen:
                0,

              overdue:
                0,

              done:
                1,
            },

            signals:
              [],
          });


        expect(
          parsed.schemaVersion,
        ).toBe(
          1,
        );
      },
    );
  },
);
