import {
  describe,
  expect,
  it,
} from "vitest";

import {
  deriveProjectAlerts,
} from "@/lib/notifications/calculations";

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


function scorecard():
  ManagementScorecard {
  return {
    rows: [
      {
        target: {
          id:
            "target-1",

          periodKey:
            "2027-02",

          metricCode:
            "REVENUE",

          targetValue:
            1000,

          ownerName:
            null,

          note:
            null,

          createdAt:
            "2027-01-01T00:00:00.000Z",

          updatedAt:
            "2027-01-01T00:00:00.000Z",

          createdBy:
            null,
        },

        currentValue:
          700,

        source:
          "ACTUAL",

        status:
          "OFF_TRACK",

        gap:
          -300,

        atRiskThreshold:
          900,
      },
    ],

    summary: {
      total:
        1,

      onTrack:
        0,

      atRisk:
        0,

      offTrack:
        1,

      unavailable:
        0,

      trackedPeriods:
        1,
    },
  };
}


function variance():
  VarianceReview {
  return {
    rows: [
      {
        key:
          "2027-02:REVENUE",

        periodKey:
          "2027-02",

        metricCode:
          "REVENUE",

        actual:
          700,

        forecast:
          1000,

        variance:
          -300,

        varianceRate:
          -0.30,

        favorability:
          "UNFAVORABLE",

        materiality:
          "MATERIAL",

        commentary:
          null,
      },
    ],

    summary: {
      totalRows:
        1,

      material:
        1,

      materialUnexplained:
        1,

      unfavorable:
        1,

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


function register():
  FinancialPeriodRegister {
  return {
    rows: [
      {
        periodKey:
          "2027-02",

        status:
          "OPEN",

        closeSequence:
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
          700,

        ebitda:
          50,

        cashBalance:
          500,
      },
    ],

    summary: {
      totalPeriods:
        1,

      openPeriods:
        1,

      closedPeriods:
        0,

      closeCycles:
        0,
    },
  };
}


describe(
  "current-state alert derivation",
  () => {
    it(
      "creates liquidity capital and cash-exhaustion alerts",
      () => {
        const alerts =
          deriveProjectAlerts({
            projectId:
              "project-1",

            latestActualPeriod:
              "2027-02",

            liveSnapshot:
              snapshot({
                risk:
                  "CRITICAL",

                riskScore:
                  95,

                capitalNeed:
                  500000,

                exhaustion:
                  "2027-05",
              }),

            scorecard:
              {
                rows:
                  [],

                summary: {
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
              },

            varianceReview: {
              rows:
                [],

              summary: {
                totalRows:
                  0,

                material:
                  0,

                materialUnexplained:
                  0,

                unfavorable:
                  0,

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
            },

            periodRegister:
              register(),

            actions:
              [],

            auditEvents:
              [],
          });


        const keys =
          alerts.map(
            (
              item,
            ) =>
              item.key,
          );


        expect(
          keys,
        ).toContain(
          "LIQUIDITY_RISK",
        );


        expect(
          keys,
        ).toContain(
          "CAPITAL_NEED",
        );


        expect(
          keys,
        ).toContain(
          "DOWNSIDE_CASH_EXHAUSTION",
        );
      },
    );


    it(
      "creates critical management-action alerts",
      () => {
        const alerts =
          deriveProjectAlerts({
            projectId:
              "project-1",

            latestActualPeriod:
              null,

            liveSnapshot:
              snapshot(),

            scorecard:
              {
                rows:
                  [],

                summary: {
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
              },

            varianceReview: {
              rows:
                [],

              summary: {
                totalRows:
                  0,

                material:
                  0,

                materialUnexplained:
                  0,

                unfavorable:
                  0,

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
            },

            periodRegister: {
              rows:
                [],

              summary: {
                totalPeriods:
                  0,

                openPeriods:
                  0,

                closedPeriods:
                  0,

                closeCycles:
                  0,
              },
            },

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
                  "Finance",

                dueDate:
                  null,
              },
            ],

            auditEvents:
              [],
          });


        expect(
          alerts.find(
            (
              item,
            ) =>
              item.key ===
              "ACTION:action-1",
          )?.severity,
        ).toBe(
          "CRITICAL",
        );
      },
    );


    it(
      "creates KPI variance and close alerts",
      () => {
        const alerts =
          deriveProjectAlerts({
            projectId:
              "project-1",

            latestActualPeriod:
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

            auditEvents:
              [],
          });


        const keys =
          alerts.map(
            (
              item,
            ) =>
              item.key,
          );


        expect(
          keys,
        ).toContain(
          "KPI:target-1",
        );


        expect(
          keys,
        ).toContain(
          "VARIANCE:2027-02:REVENUE",
        );


        expect(
          keys,
        ).toContain(
          "FINANCIAL_CLOSE:2027-02",
        );
      },
    );


    it(
      "creates forecast reliability alerts below 80 percent",
      () => {
        const alerts =
          deriveProjectAlerts({
            projectId:
              "project-1",

            latestActualPeriod:
              null,

            liveSnapshot:
              snapshot({
                accuracy:
                  0.70,
              }),

            scorecard: {
              rows:
                [],

              summary: {
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
            },

            varianceReview: {
              rows:
                [],

              summary: {
                totalRows:
                  0,

                material:
                  0,

                materialUnexplained:
                  0,

                unfavorable:
                  0,

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
            },

            periodRegister: {
              rows:
                [],

              summary: {
                totalPeriods:
                  0,

                openPeriods:
                  0,

                closedPeriods:
                  0,

                closeCycles:
                  0,
              },
            },

            actions:
              [],

            auditEvents:
              [],
          });


        expect(
          alerts.some(
            (
              item,
            ) =>
              item.key ===
              "FORECAST_ACCURACY",
          ),
        ).toBe(
          true,
        );
      },
    );


    it(
      "creates significant immutable governance alerts",
      () => {
        const alerts =
          deriveProjectAlerts({
            projectId:
              "project-1",

            latestActualPeriod:
              null,

            liveSnapshot:
              snapshot(),

            scorecard: {
              rows:
                [],

              summary: {
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
            },

            varianceReview: {
              rows:
                [],

              summary: {
                totalRows:
                  0,

                material:
                  0,

                materialUnexplained:
                  0,

                unfavorable:
                  0,

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
            },

            periodRegister: {
              rows:
                [],

              summary: {
                totalPeriods:
                  0,

                openPeriods:
                  0,

                closedPeriods:
                  0,

                closeCycles:
                  0,
              },
            },

            actions:
              [],

            auditEvents: [
              {
                id:
                  "audit-1",

                action:
                  "FINANCIAL_PERIOD_REOPENED",

                severity:
                  "WARNING",

                summary:
                  "Period reopened",

                createdAt:
                  "2027-03-01T00:00:00.000Z",
              },
            ],
          });


        expect(
          alerts.some(
            (
              item,
            ) =>
              item.key ===
              "AUDIT:audit-1",
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
