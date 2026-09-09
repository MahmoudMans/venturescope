import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildPortfolioExecutiveDashboard,
} from "@/lib/finance/portfolio-dashboard/calculations";

import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";

import type {
  PortfolioProjectAnalytics,
} from "@/lib/finance/portfolio-dashboard/types";


function snapshot({
  risk,
  riskScore,
  capitalNeed,
  accuracy,
  criticalOpen =
    0,
}: {
  risk:
    "LOW" |
    "MODERATE" |
    "HIGH" |
    "CRITICAL";

  riskScore:
    number;

  capitalNeed:
    number;

  accuracy:
    number;

  criticalOpen?:
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
        0,

      ebitdaVarianceRate:
        0,

      forecastAccuracyScore:
        accuracy,

      forecastWape:
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


function project({
  id,
  currency,
  cash,
  snapshotValue,
  offTrack =
    0,
}: {
  id:
    string;

  currency:
    string;

  cash:
    number;

  snapshotValue:
    ExecutiveReviewSnapshot;

  offTrack?:
    number;
}): PortfolioProjectAnalytics {
  return {
    project: {
      id,

      name:
        id,

      industry:
        "Test",

      currency,

      role:
        "OWNER",

      isCurrentProject:
        false,

      actuals:
        [],

      riskPolicy: {
        minimumCash:
          0,

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
        cash,

      latestPeriodCloseStatus:
        "CLOSED",

      targets:
        [],

      actions:
        [],
    },

    forecastAvailable:
      true,

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
  "portfolio executive aggregation",
  () => {
    it(
      "aggregates management exceptions",
      () => {
        const dashboard =
          buildPortfolioExecutiveDashboard([
            project({
              id:
                "a",

              currency:
                "EUR",

              cash:
                1000,

              snapshotValue:
                snapshot({
                  risk:
                    "HIGH",

                  riskScore:
                    70,

                  capitalNeed:
                    500,

                  accuracy:
                    0.90,

                  criticalOpen:
                    1,
                }),

              offTrack:
                2,
            }),

            project({
              id:
                "b",

              currency:
                "EUR",

              cash:
                2000,

              snapshotValue:
                snapshot({
                  risk:
                    "LOW",

                  riskScore:
                    10,

                  capitalNeed:
                    0,

                  accuracy:
                    0.80,
                }),
            }),
          ]);


        expect(
          dashboard.summary
            .loadedProjects,
        ).toBe(
          2,
        );


        expect(
          dashboard.summary
            .criticalHighRisk,
        ).toBe(
          1,
        );


        expect(
          dashboard.summary
            .openCriticalActions,
        ).toBe(
          1,
        );


        expect(
          dashboard.summary
            .offTrackTargets,
        ).toBe(
          2,
        );
      },
    );


    it(
      "sorts higher-attention projects first",
      () => {
        const dashboard =
          buildPortfolioExecutiveDashboard([
            project({
              id:
                "stable",

              currency:
                "EUR",

              cash:
                100,

              snapshotValue:
                snapshot({
                  risk:
                    "LOW",

                  riskScore:
                    5,

                  capitalNeed:
                    0,

                  accuracy:
                    0.95,
                }),
            }),

            project({
              id:
                "critical",

              currency:
                "EUR",

              cash:
                100,

              snapshotValue:
                snapshot({
                  risk:
                    "CRITICAL",

                  riskScore:
                    95,

                  capitalNeed:
                    1000,

                  accuracy:
                    0.60,

                  criticalOpen:
                    2,
                }),
            }),
          ]);


        expect(
          dashboard.rows[
            0
          ].id,
        ).toBe(
          "critical",
        );
      },
    );


    it(
      "calculates average forecast accuracy",
      () => {
        const dashboard =
          buildPortfolioExecutiveDashboard([
            project({
              id:
                "a",

              currency:
                "EUR",

              cash:
                100,

              snapshotValue:
                snapshot({
                  risk:
                    "LOW",

                  riskScore:
                    5,

                  capitalNeed:
                    0,

                  accuracy:
                    0.90,
                }),
            }),

            project({
              id:
                "b",

              currency:
                "EUR",

              cash:
                100,

              snapshotValue:
                snapshot({
                  risk:
                    "LOW",

                  riskScore:
                    5,

                  capitalNeed:
                    0,

                  accuracy:
                    0.70,
                }),
            }),
          ]);


        expect(
          dashboard.summary
            .averageForecastAccuracy,
        ).toBeCloseTo(
          0.80,
        );
      },
    );
  },
);
