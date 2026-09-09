import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildBoardPackExecutiveSummary,
} from "@/lib/finance/board-pack/insights";

import type {
  ExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/types";

import type {
  ManagementScorecard,
} from "@/lib/finance/scorecard/types";

import type {
  VarianceReview,
} from "@/lib/finance/variance-review/types";

import type {
  FinancialPeriodRegister,
} from "@/lib/finance/period-close/types";


function snapshot({
  risk =
    "LOW",
  riskScore =
    10,
  capitalNeed =
    0,
  accuracy =
    0.95,
  exhaustion =
    null,
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

  accuracy?:
    number |
    null;

  exhaustion?:
    string |
    null;
} = {}): ExecutiveReviewSnapshot {
  return {
    schemaVersion:
      1,

    capturedAt:
      "2027-03-01T00:00:00.000Z",

    kpis: {
      actualPeriods:
        3,

      matchedPeriods:
        3,

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
        1000,

      minimumDownsideCash:
        500,

      downsideCashExhaustionPeriod:
        exhaustion,

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


function scorecard(
  offTrack =
    0,
): ManagementScorecard {
  return {
    rows:
      [],

    summary: {
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


function variance(
  unexplained =
    0,
): VarianceReview {
  return {
    rows:
      [],

    summary: {
      totalRows:
        unexplained,

      material:
        unexplained,

      materialUnexplained:
        unexplained,

      unfavorable:
        unexplained,

      openCommentaries:
        0,

      monitoringCommentaries:
        0,

      resolvedCommentaries:
        0,

      acceptedCommentaries:
        0,

      reviewedPeriods:
        0,
    },
  };
}


function register(
  status:
    "OPEN" |
    "CLOSED" =
      "CLOSED",
): FinancialPeriodRegister {
  return {
    rows: [
      {
        periodKey:
          "2027-02",

        status,

        closeSequence:
          status ===
            "CLOSED"
            ?
              1
            :
              0,

        closedAt:
          null,

        closedByUserId:
          null,

        reopenedAt:
          null,

        reopenedByUserId:
          null,

        revenue:
          100,

        ebitda:
          20,

        cashBalance:
          500,
      },
    ],

    summary: {
      totalPeriods:
        1,

      openPeriods:
        status ===
          "OPEN"
          ?
            1
          :
            0,

      closedPeriods:
        status ===
          "CLOSED"
          ?
            1
          :
            0,

      closeCycles:
        status ===
          "CLOSED"
          ?
            1
          :
            0,
    },
  };
}


describe(
  "Board Pack executive insights",
  () => {
    it(
      "flags critical liquidity",
      () => {
        const result =
          buildBoardPackExecutiveSummary({
            reportPeriod:
              "2027-02",

            liveSnapshot:
              snapshot({
                risk:
                  "CRITICAL",

                riskScore:
                  90,
              }),

            scorecard:
              scorecard(),

            varianceReview:
              variance(),

            periodRegister:
              register(),

            actions:
              [],
          });


        expect(
          result.insights.some(
            (
              insight,
            ) =>
              insight.code ===
              "LIQUIDITY" &&
              insight.severity ===
              "CRITICAL",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "flags positive capital requirement",
      () => {
        const result =
          buildBoardPackExecutiveSummary({
            reportPeriod:
              "2027-02",

            liveSnapshot:
              snapshot({
                capitalNeed:
                  500000,
              }),

            scorecard:
              scorecard(),

            varianceReview:
              variance(),

            periodRegister:
              register(),

            actions:
              [],
          });


        expect(
          result.insights.some(
            (
              insight,
            ) =>
              insight.code ===
              "CAPITAL_NEED",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "flags unexplained material variances",
      () => {
        const result =
          buildBoardPackExecutiveSummary({
            reportPeriod:
              "2027-02",

            liveSnapshot:
              snapshot(),

            scorecard:
              scorecard(),

            varianceReview:
              variance(
                2,
              ),

            periodRegister:
              register(),

            actions:
              [],
          });


        expect(
          result.insights.some(
            (
              insight,
            ) =>
              insight.code ===
              "UNEXPLAINED_VARIANCE",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "flags open reporting periods",
      () => {
        const result =
          buildBoardPackExecutiveSummary({
            reportPeriod:
              "2027-02",

            liveSnapshot:
              snapshot(),

            scorecard:
              scorecard(),

            varianceReview:
              variance(),

            periodRegister:
              register(
                "OPEN",
              ),

            actions:
              [],
          });


        expect(
          result.insights.some(
            (
              insight,
            ) =>
              insight.code ===
              "OPEN_FINANCIAL_PERIOD",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "flags unresolved critical management actions",
      () => {
        const result =
          buildBoardPackExecutiveSummary({
            reportPeriod:
              "2027-02",

            liveSnapshot:
              snapshot(),

            scorecard:
              scorecard(),

            varianceReview:
              variance(),

            periodRegister:
              register(),

            actions: [
              {
                id:
                  "action-1",

                title:
                  "Secure funding",

                priority:
                  "CRITICAL",

                status:
                  "OPEN",

                ownerName:
                  null,

                dueDate:
                  null,

                sourceCode:
                  "CAPITAL_GAP",
              },
            ],
          });


        expect(
          result.insights.some(
            (
              insight,
            ) =>
              insight.code ===
              "CRITICAL_ACTIONS" &&
              insight.severity ===
              "CRITICAL",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "returns informational state when no exception exists",
      () => {
        const result =
          buildBoardPackExecutiveSummary({
            reportPeriod:
              "2027-02",

            liveSnapshot:
              snapshot(),

            scorecard:
              scorecard(),

            varianceReview:
              variance(),

            periodRegister:
              register(),

            actions:
              [],
          });


        expect(
          result.insights,
        ).toHaveLength(
          1,
        );


        expect(
          result.insights[
            0
          ].code,
        ).toBe(
          "NO_MAJOR_EXCEPTION",
        );
      },
    );
  },
);
