import {
  describe,
  expect,
  it,
} from "vitest";

import {
  portfolioAttentionScore,
} from "@/lib/finance/portfolio-dashboard/calculations";

import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";

import type {
  PortfolioProjectAnalytics,
} from "@/lib/finance/portfolio-dashboard/types";


function snapshot({
  risk =
    "LOW",
  riskScore =
    10,
  capitalNeed =
    0,
  criticalOpen =
    0,
  accuracy =
    0.95,
}: {
  risk?:
    "LOW" |
    "MODERATE" |
    "HIGH" |
    "CRITICAL";

  riskScore?:
    number;

  capitalNeed?:
    number;

  criticalOpen?:
    number;

  accuracy?:
    number |
    null;
} = {}): ExecutiveReviewSnapshot {
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
        0,

      ebitdaVarianceRate:
        0,

      forecastAccuracyScore:
        accuracy,

      forecastWape:
        accuracy ===
          null
          ?
            null
          :
            1 -
            accuracy,

      liquidityRiskLevel:
        risk,

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
        criticalOpen,

      criticalOpen,

      overdue:
        0,

      done:
        0,
    },

    signals:
      [],
  };
}


function analytics({
  snapshotValue =
    snapshot(),
  forecastAvailable =
    true,
  closeStatus =
    "CLOSED",
  offTrack =
    0,
}: {
  snapshotValue?:
    ExecutiveReviewSnapshot |
    null;

  forecastAvailable?:
    boolean;

  closeStatus?:
    "OPEN" |
    "CLOSED" |
    "NO_ACTUALS";

  offTrack?:
    number;
} = {}): PortfolioProjectAnalytics {
  return {
    project: {
      id:
        "project-1",

      name:
        "Project",

      industry:
        "Software",

      currency:
        "EUR",

      role:
        "OWNER",

      isCurrentProject:
        true,

      actuals:
        [],

      riskPolicy: {
        minimumCash:
          100,

        minimumRunwayMonths:
          6,

        minimumEbitdaMargin:
          null,

        maximumMonthlyBurn:
          null,

        downsideRevenueShock:
          0.20,

        downsideCostInflation:
          0.10,
      },

      latestActualPeriod:
        "2027-01",

      latestActualCash:
        1000,

      latestPeriodCloseStatus:
        closeStatus,

      targets:
        [],

      actions:
        [],
    },

    forecastAvailable,

    liveSnapshot:
      snapshotValue,

    scorecardSummary: {
      total:
        offTrack,

      onTrack:
        0,

      atRisk:
        0,

      offTrack,

      unavailable:
        0,

      trackedPeriods:
        offTrack >
          0
          ?
            1
          :
            0,
    },
  };
}


describe(
  "portfolio attention score",
  () => {
    it(
      "keeps stable low-risk projects low",
      () => {
        expect(
          portfolioAttentionScore(
            analytics(),
          ),
        ).toBe(
          0,
        );
      },
    );


    it(
      "raises attention for critical liquidity",
      () => {
        expect(
          portfolioAttentionScore(
            analytics({
              snapshotValue:
                snapshot({
                  risk:
                    "CRITICAL",

                  riskScore:
                    95,
                }),
            }),
          ),
        ).toBeGreaterThanOrEqual(
          45,
        );
      },
    );


    it(
      "adds capital need and critical-action attention",
      () => {
        const score =
          portfolioAttentionScore(
            analytics({
              snapshotValue:
                snapshot({
                  capitalNeed:
                    500000,

                  criticalOpen:
                    2,
                }),
            }),
          );


        expect(
          score,
        ).toBeGreaterThanOrEqual(
          40,
        );
      },
    );


    it(
      "adds attention when reporting period remains open",
      () => {
        expect(
          portfolioAttentionScore(
            analytics({
              closeStatus:
                "OPEN",
            }),
          ),
        ).toBe(
          5,
        );
      },
    );


    it(
      "adds data-readiness attention when forecast is unavailable",
      () => {
        const result =
          analytics({
            snapshotValue:
              null,

            forecastAvailable:
              false,
          });


        expect(
          portfolioAttentionScore(
            result,
          ),
        ).toBeGreaterThanOrEqual(
          10,
        );
      },
    );


    it(
      "caps attention score at 100",
      () => {
        expect(
          portfolioAttentionScore(
            analytics({
              snapshotValue:
                snapshot({
                  risk:
                    "CRITICAL",

                  capitalNeed:
                    1_000_000,

                  criticalOpen:
                    10,

                  accuracy:
                    0.40,
                }),

              closeStatus:
                "OPEN",

              offTrack:
                10,
            }),
          ),
        ).toBe(
          100,
        );
      },
    );
  },
);
