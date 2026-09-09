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


function snapshot(
  capitalNeed:
    number,
): ExecutiveReviewSnapshot {
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
        0.90,

      forecastWape:
        0.10,

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

      capitalNeed,
    },

    actions: {
      open:
        0,

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


function input({
  id,
  currency,
  cash,
  capitalNeed,
}: {
  id:
    string;

  currency:
    string;

  cash:
    number;

  capitalNeed:
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
          0,

        downsideCostInflation:
          0,
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
      snapshot(
        capitalNeed,
      ),

    scorecardSummary: {
      total:
        0,

      onTrack:
        0,

      atRisk:
        0,

      offTrack:
        0,

      unavailable:
        0,

      trackedPeriods:
        0,
    },
  };
}


describe(
  "portfolio currency isolation",
  () => {
    it(
      "keeps EUR and USD financial amounts separate",
      () => {
        const dashboard =
          buildPortfolioExecutiveDashboard([
            input({
              id:
                "eur",

              currency:
                "EUR",

              cash:
                1000,

              capitalNeed:
                500,
            }),

            input({
              id:
                "usd",

              currency:
                "USD",

              cash:
                2000,

              capitalNeed:
                700,
            }),
          ]);


        expect(
          dashboard.currencies,
        ).toHaveLength(
          2,
        );


        expect(
          dashboard.currencies.find(
            (
              item,
            ) =>
              item.currency ===
              "EUR",
          ),
        ).toMatchObject({
          latestActualCash:
            1000,

          capitalNeed:
            500,
        });


        expect(
          dashboard.currencies.find(
            (
              item,
            ) =>
              item.currency ===
              "USD",
          ),
        ).toMatchObject({
          latestActualCash:
            2000,

          capitalNeed:
            700,
        });
      },
    );


    it(
      "does not create a portfolio-wide money total",
      () => {
        const dashboard =
          buildPortfolioExecutiveDashboard([
            input({
              id:
                "eur",

              currency:
                "EUR",

              cash:
                1000,

              capitalNeed:
                500,
            }),

            input({
              id:
                "usd",

              currency:
                "USD",

              cash:
                2000,

              capitalNeed:
                700,
            }),
          ]);


        expect(
          dashboard.summary,
        ).not.toHaveProperty(
          "totalCash",
        );


        expect(
          dashboard.summary,
        ).not.toHaveProperty(
          "totalCapitalNeed",
        );
      },
    );
  },
);
