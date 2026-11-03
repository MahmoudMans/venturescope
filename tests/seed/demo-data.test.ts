import { describe, expect, it } from "vitest";

import { APPROVAL_REQUEST_TYPES } from "@/lib/approvals/types";
import { validateDataImportCsv } from "@/lib/data-import/validation";
import { calculateVarianceReport } from "@/lib/finance/actuals/variance";
import { countCompletedAssumptionSections } from "@/lib/finance/assumptions/storage";
import { buildExecutiveReviewSnapshot } from "@/lib/finance/board-room/snapshot";
import { parseExecutiveReviewSnapshot } from "@/lib/finance/board-room/validation";
import { parseProjectRiskPolicy } from "@/lib/finance/risk-center/policy";
import { calculateManagementScorecard } from "@/lib/finance/scorecard/calculations";
import type { KpiTargetView } from "@/lib/finance/scorecard/types";
import { demoTimeline } from "@/scripts/seed/demo-config";
import {
  buildDemoActuals,
  buildDemoModel,
  buildDemoReview,
  buildDemoSchedule,
  buildDemoTargets,
  DEMO_APPROVALS,
  DEMO_COMMENTARIES,
  DEMO_DECISIONS,
  DEMO_FILE_NAMES,
  DEMO_REOPEN,
  DEMO_REVISIONS,
  DEMO_RISK_POLICY_INPUT,
  DEMO_STAGES,
  demoActualPeriods,
  demoActualsCsv,
  demoBrokenActualsCsv,
  demoCommentaryCsv,
  demoDueDate,
  demoForecast,
  demoForecastRows,
  demoTargetsCsv,
  fillMonths,
  monthName,
} from "@/scripts/seed/demo-data";

const DAYS = [
  "2026-10-23T10:00:00Z",
  "2026-11-01T00:05:00Z",
  "2027-03-15T12:00:00Z",
  "2028-02-29T12:00:00Z",
];

function makeStory(day: string) {
  const now = new Date(day);

  const timeline = demoTimeline(now);

  const model = buildDemoModel(timeline.startMonth, "CURRENT");

  const forecast = demoForecast(model);

  const demoActuals = buildDemoActuals(forecast, timeline.actualMonths, model.assumptions);

  return {
    now,
    timeline,
    model,
    forecast,
    rows: demoForecastRows(forecast),
    demoActuals,
    actuals: demoActualPeriods(demoActuals),
  };
}

const known = new Map<string, ReturnType<typeof makeStory>>();

function storyOf(day: string) {
  const story = known.get(day) ?? makeStory(day);

  known.set(day, story);

  return story;
}

/** The goals the way the database keeps them: read from the file by the import. */
function importedTargets(day: string): KpiTargetView[] {
  const { rows, timeline } = storyOf(day);

  const imported = validateDataImportCsv({
    importType: "KPI_TARGETS",
    csv: demoTargetsCsv(buildDemoTargets(rows, timeline)),
  });

  const views: KpiTargetView[] = [];

  for (const row of imported.rows) {
    if (row.kind === "KPI_TARGETS") {
      views.push({
        id: `${row.periodKey}-${row.metricCode}`,
        periodKey: row.periodKey,
        metricCode: row.metricCode,
        targetValue: row.targetValue,
        ownerName: null,
        note: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        createdBy: null,
      });
    }
  }

  return views;
}

/** Every text of the story, as written in the source (before the month names are filled in). */
function rawTexts(): string[] {
  return [
    ...DEMO_COMMENTARIES.flatMap((item) => [item.explanation, item.correctiveAction]),
    ...DEMO_DECISIONS.flatMap((item) => [item.title, item.details]),
    ...DEMO_APPROVALS.flatMap((item) => [item.title, item.description, item.decisionNote]),
    ...Object.values(DEMO_REVISIONS).flatMap((item) => [item.label, item.reason]),
    ...Object.values(DEMO_REOPEN).filter((value): value is string => typeof value === "string"),
  ];
}

describe("the three saved versions", () => {
  it("run through the real engine for 36 months, each earning more than the one before", () => {
    const { timeline } = storyOf(DAYS[0]);

    const forecasts = DEMO_STAGES.map((stage) =>
      demoForecast(buildDemoModel(timeline.startMonth, stage)),
    );

    for (const forecast of forecasts) {
      expect(forecast.months).toHaveLength(36);

      expect(forecast.months[0].month).toBe(timeline.startMonth);
    }

    const revenues = forecasts.map((forecast) => Number(forecast.metrics.totalRevenue));

    expect(revenues[1]).toBeGreaterThan(revenues[0]);

    expect(revenues[2]).toBeGreaterThan(revenues[1]);
  });

  it("are complete, different from each other, and say the price they really use", () => {
    const { timeline } = storyOf(DAYS[0]);

    const models = DEMO_STAGES.map((stage) => buildDemoModel(timeline.startMonth, stage));

    for (const model of models) {
      expect(countCompletedAssumptionSections(model.assumptions)).toBe(3);
    }

    expect(new Set(models.map((model) => JSON.stringify(model.assumptions))).size).toBe(3);

    expect(models[1].assumptions.customerRevenue.arpu).toBe("149");

    expect(DEMO_REVISIONS.PRICING_UPDATE.reason).toContain("149");

    expect(DEMO_APPROVALS[0].title).toContain("149");
  });
});

describe("the monthly results", () => {
  it("cover the 9 months, add up, and are the same numbers whatever the start month", () => {
    const first = storyOf(DAYS[0]).actuals.map((actual) => ({ ...actual, period: "" }));

    for (const day of DAYS) {
      const { timeline, demoActuals, actuals } = storyOf(day);

      expect(actuals.map((actual) => actual.period)).toEqual(timeline.actualMonths);

      expect(actuals.map((actual) => ({ ...actual, period: "" }))).toEqual(first);

      demoActuals.forEach((actual, index) => {
        const profit = actual.revenue - actual.cogs - actual.operatingExpenses;

        expect(Math.abs(profit - actual.ebitda), actual.period).toBeLessThan(1.01);

        if (index > 0) {
          const step = actual.cashBalance - demoActuals[index - 1].cashBalance;

          expect(Math.abs(step - actual.cashFlow), actual.period).toBeLessThan(1.01);
        }

        expect(Number.isInteger(actual.customers) && actual.customers > 0).toBe(true);
      });
    }
  });

  it("are accepted by the import, one file for each month", () => {
    for (const actual of storyOf(DAYS[0]).demoActuals) {
      const result = validateDataImportCsv({
        importType: "ACTUALS",
        csv: demoActualsCsv([actual]),
      });

      expect(result.issues, actual.period).toEqual([]);

      expect(result.rowCount).toBe(1);
    }
  });

  it("have one wrong file, and the import finds the problems in it", () => {
    const { timeline } = storyOf(DAYS[0]);

    const result = validateDataImportCsv({
      importType: "ACTUALS",
      csv: demoBrokenActualsCsv(timeline.actualMonths),
    });

    expect(result.issues.length).toBeGreaterThan(0);

    expect(result.rowCount).toBe(3);
  });
});

describe("the story is true to the numbers", () => {
  const { timeline, rows, actuals } = storyOf(DAYS[0]);

  const report = calculateVarianceReport(actuals, rows);

  it("has revenue a little above the plan and EBITDA clearly below it", () => {
    const revenue = report.summary.revenueVarianceRate ?? 0;

    expect(report.summary.matchedPeriods).toBe(9);

    expect(revenue).toBeGreaterThan(0.01);

    expect(revenue).toBeLessThan(0.04);

    expect(report.summary.ebitdaVarianceRate ?? 0).toBeLessThan(-0.05);
  });

  it("has cash below the plan every month, and revenue above it from the fifth month", () => {
    for (const period of report.periods) {
      expect(period.metrics.cashBalance?.variance ?? 0, period.period).toBeLessThan(0);
    }

    for (const period of report.periods.slice(4)) {
      expect(period.metrics.revenue?.variance ?? 0, period.period).toBeGreaterThan(0);
    }
  });

  it("explains only variances of at least 10 percent", () => {
    const keys = {
      REVENUE: "revenue",
      COGS: "cogs",
      EBITDA: "ebitda",
      CASH_BALANCE: "cashBalance",
    } as const;

    for (const item of DEMO_COMMENTARIES) {
      const metric = report.periods[item.monthIndex].metrics[keys[item.metricCode]];

      expect(
        Math.abs(metric?.varianceRate ?? 0),
        `${item.monthIndex} ${item.metricCode}`,
      ).toBeGreaterThanOrEqual(0.1);
    }
  });

  it("writes a board review that repeats the real numbers and follows the date of the run", () => {
    const review = buildDemoReview(actuals, rows, timeline);

    const revenue = ((report.summary.revenueVarianceRate ?? 0) * 100).toFixed(1);

    const ebitda = (Math.abs(report.summary.ebitdaVarianceRate ?? 0) * 100).toFixed(1);

    expect(review.title).toBe("Board review for September");

    expect(review.commentary).toContain(`Revenue is ${revenue} percent above plan`);

    expect(review.commentary).toContain(`EBITDA is ${ebitda} percent below plan`);

    expect(review.commentary).toContain("Cash is 1.05 million");

    const later = storyOf(DAYS[2]);

    expect(buildDemoReview(later.actuals, later.rows, later.timeline).title).toBe(
      "Board review for February",
    );
  });
});

describe("the goals", () => {
  it("are 19, accepted by the import, and on the scorecard they are on track, at risk and off track", () => {
    for (const day of DAYS) {
      const { rows, timeline, actuals } = storyOf(day);

      const targets = buildDemoTargets(rows, timeline);

      const current = targets.filter((target) => target.periodKey === timeline.currentMonth);

      expect(targets).toHaveLength(19);

      expect(
        validateDataImportCsv({ importType: "KPI_TARGETS", csv: demoTargetsCsv(current) }).issues,
      ).toEqual([]);

      const last = actuals[actuals.length - 1];

      const scorecard = calculateManagementScorecard({
        targets: importedTargets(day),
        actuals,
        forecasts: rows,
        riskPolicy: parseProjectRiskPolicy(DEMO_RISK_POLICY_INPUT),
        latestActualPeriod: last.period,
        latestActualCash: last.cashBalance,
      });

      expect(scorecard.summary.total, day).toBe(19);

      expect(scorecard.summary.atRisk, day).toBeGreaterThan(0);

      expect(scorecard.summary.offTrack, day).toBeGreaterThan(0);

      expect(scorecard.summary.onTrack, day).toBeGreaterThan(scorecard.summary.offTrack);
    }
  });
});

describe("the variance notes", () => {
  it("are 8 in 4 statuses, accepted by the import, and safe inside a CSV file", () => {
    expect(DEMO_COMMENTARIES).toHaveLength(8);

    expect(new Set(DEMO_COMMENTARIES.map((item) => item.status)).size).toBe(4);

    for (const day of DAYS) {
      const { timeline } = storyOf(day);

      let total = 0;

      timeline.actualMonths.forEach((_month, index) => {
        const csv = demoCommentaryCsv(timeline, index);

        if (csv !== null) {
          const result = validateDataImportCsv({ importType: "VARIANCE_COMMENTARY", csv });

          expect(result.issues, `${day} ${index}`).toEqual([]);

          total += result.rowCount;
        }
      });

      expect(total).toBe(8);

      for (const item of DEMO_COMMENTARIES) {
        for (const text of [item.explanation, item.correctiveAction, item.ownerName]) {
          expect(/[,"\n\r]/.test(fillMonths(text, timeline)), text).toBe(false);
        }
      }
    }
  });
});

describe("the names of the months in the texts", () => {
  it("are never written in the source, only as {m0} to {m9}", () => {
    const words =
      /January|February|March|April|June|July|August|September|October|November|December|\bMay\b/;

    for (const text of rawTexts()) {
      expect(words.test(text) || /\b(19|20)\d\d\b/.test(text), text).toBe(false);
    }
  });

  it("are filled in from the date of the run, and no curly bracket is left", () => {
    const spec = "{m0} to {m8}, now {m9}";

    expect(fillMonths(spec, demoTimeline(new Date(DAYS[0])))).toBe(
      "January to September, now October",
    );

    expect(fillMonths(spec, demoTimeline(new Date(DAYS[2])))).toBe("June to February, now March");

    for (const day of DAYS) {
      for (const text of rawTexts()) {
        expect(fillMonths(text, storyOf(day).timeline).includes("{"), text).toBe(false);
      }
    }

    expect(() => monthName("2026-13")).toThrow();
  });
});

describe("the decisions and the approvals", () => {
  it("use every status, and one decision that is not finished is overdue", () => {
    const statuses = [...new Set(DEMO_DECISIONS.map((item) => item.finalStatus))].sort();

    expect(statuses).toEqual(["BLOCKED", "DISMISSED", "DONE", "IN_PROGRESS", "OPEN"]);

    const open = (item: (typeof DEMO_DECISIONS)[number]) =>
      item.finalStatus !== "DONE" && item.finalStatus !== "DISMISSED";

    expect(
      DEMO_DECISIONS.filter((item) => item.dueInDays < 0 && open(item)).length,
    ).toBeGreaterThan(0);

    expect(demoDueDate(new Date("2026-10-23T15:42:10Z"), 5).toISOString()).toBe(
      "2026-10-28T00:00:00.000Z",
    );
  });

  it("are 5 requests: 2 approved, 1 rejected, 2 waiting, with a note for each decision", () => {
    const count = (decision: string) =>
      DEMO_APPROVALS.filter((item) => item.decision === decision).length;

    expect([count("APPROVE"), count("REJECT"), count("PENDING")]).toEqual([2, 1, 2]);

    for (const item of DEMO_APPROVALS) {
      expect(APPROVAL_REQUEST_TYPES.includes(item.requestType), item.requestType).toBe(true);

      expect(item.decisionNote.length > 0, item.title).toBe(item.decision !== "PENDING");
    }
  });
});

describe("the days of the history", () => {
  function datesIn(value: unknown, found: Date[] = []): Date[] {
    if (value instanceof Date) {
      found.push(value);
    } else if (value !== null && typeof value === "object") {
      Object.values(value).forEach((item) => datesIn(item, found));
    }

    return found;
  }

  it("are never after the moment of the run, and follow the order of the story", () => {
    for (const day of DAYS) {
      const { now, timeline } = storyOf(day);

      const s = buildDemoSchedule(now, timeline);

      const t = (date: Date) => date.getTime();

      for (const date of datesIn(s)) {
        expect(t(date), `${day} ${date.toISOString()}`).toBeLessThanOrEqual(t(now));
      }

      expect(t(s.membersAddedAt), day).toBeLessThanOrEqual(t(s.modelCreatedAt));

      expect(t(s.modelCreatedAt), day).toBeLessThanOrEqual(t(s.revisionAt.SEED_PLAN));

      expect(t(s.revisionAt.SEED_PLAN), day).toBeLessThan(t(s.revisionAt.PRICING_UPDATE));

      expect(t(s.revisionAt.PRICING_UPDATE), day).toBeLessThan(t(s.revisionAt.CURRENT));

      expect(t(s.approvals[0].decidedAt as Date), day).toBeLessThan(t(s.revisionAt.PRICING_UPDATE));

      expect(t(s.months[0].failedImportAt as Date), day).toBeLessThan(
        t(s.months[0].actualsImportAt),
      );

      s.months.forEach((month, index) => {
        expect(t(month.actualsImportAt), `${day} ${index}`).toBeLessThanOrEqual(
          t(month.commentaryImportAt),
        );

        if (month.closeAt !== null) {
          expect(t(month.commentaryImportAt), `${day} ${index}`).toBeLessThan(t(month.closeAt));
        }

        if (index > 0) {
          expect(t(s.months[index - 1].actualsImportAt), `${day} ${index}`).toBeLessThan(
            t(month.actualsImportAt),
          );
        }
      });

      const steps = [
        s.reopen.requestedAt,
        s.reopen.decidedAt,
        s.reopen.reopenedAt,
        s.reopen.closedAgainAt,
      ];

      steps.slice(1).forEach((step, index) => expect(t(steps[index]), day).toBeLessThan(t(step)));

      for (const decision of s.decisions) {
        expect(t(decision.createdAt), day).toBeLessThanOrEqual(
          t(decision.changedAt ?? decision.createdAt),
        );
      }
    }
  });

  it("belong to files that all have a different name, so each batch can be found", () => {
    const { timeline } = storyOf(DAYS[0]);

    const names = [
      DEMO_FILE_NAMES.brokenActuals,
      DEMO_FILE_NAMES.targetsRecent,
      DEMO_FILE_NAMES.targetsCurrent,
      ...timeline.actualMonths.map((month) => DEMO_FILE_NAMES.actuals(month)),
      ...timeline.actualMonths.map((month) => DEMO_FILE_NAMES.commentary(month)),
    ];

    expect(new Set(names).size).toBe(names.length);
  });
});

describe("the frozen board review", () => {
  it("is a snapshot that the board room can read back", () => {
    const { rows, actuals, now } = storyOf(DAYS[0]);

    const last = actuals[actuals.length - 1];

    const snapshot = buildExecutiveReviewSnapshot({
      capturedAt: now.toISOString(),
      actuals,
      forecasts: rows,
      riskPolicy: parseProjectRiskPolicy(DEMO_RISK_POLICY_INPUT),
      latestActualPeriod: last.period,
      latestActualCash: last.cashBalance,
      actions: DEMO_DECISIONS.map((item) => ({
        status: item.finalStatus,
        priority: item.priority,
        dueDate: demoDueDate(now, item.dueInDays).toISOString(),
      })),
    });

    expect(parseExecutiveReviewSnapshot(JSON.parse(JSON.stringify(snapshot))).schemaVersion).toBe(
      1,
    );
  });
});
