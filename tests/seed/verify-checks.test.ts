import { describe, expect, it } from "vitest";

import { validateDataImportCsv } from "@/lib/data-import/validation";
import { parseProjectRiskPolicy } from "@/lib/finance/risk-center/policy";
import type { KpiTargetView } from "@/lib/finance/scorecard/types";
import {
  DEMO_PEOPLE,
  DEMO_PERSON_KEYS,
  demoModelName,
  demoTimeline,
} from "@/scripts/seed/demo-config";
import {
  buildDemoActuals,
  buildDemoModel,
  buildDemoTargets,
  DEMO_APPROVALS,
  DEMO_COMMENTARIES,
  DEMO_DECISIONS,
  DEMO_REOPEN,
  DEMO_RISK_POLICY_INPUT,
  demoActualPeriods,
  demoDueDate,
  demoForecast,
  demoForecastRows,
  demoTargetsCsv,
} from "@/scripts/seed/demo-data";
import { DEMO_CHECKS, type DemoFacts } from "@/scripts/seed/verify-checks";

const DAY = 24 * 60 * 60 * 1000;

/** The facts of a complete, correct demo company, made without a database. */
function goodFacts(iso = "2026-10-23T10:00:00Z"): DemoFacts {
  const now = new Date(iso);

  const timeline = demoTimeline(now);

  const model = buildDemoModel(timeline.startMonth, "CURRENT");

  const forecast = demoForecast(model);

  const rows = demoForecastRows(forecast);

  const actuals = demoActualPeriods(
    buildDemoActuals(forecast, timeline.actualMonths, model.assumptions),
  );

  const imported = validateDataImportCsv({
    importType: "KPI_TARGETS",
    csv: demoTargetsCsv(buildDemoTargets(rows, timeline)),
  });

  const targets: KpiTargetView[] = [];

  for (const row of imported.rows) {
    if (row.kind === "KPI_TARGETS") {
      targets.push({
        id: `${row.periodKey}-${row.metricCode}`,
        periodKey: row.periodKey,
        metricCode: row.metricCode,
        targetValue: row.targetValue,
        ownerName: null,
        note: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        createdBy: null,
      });
    }
  }

  const reopened = timeline.actualMonths[DEMO_REOPEN.monthIndex];

  const status = { APPROVE: "APPROVED", REJECT: "REJECTED", PENDING: "PENDING" } as const;

  return {
    today: now,
    people: DEMO_PERSON_KEYS.map((key) => ({ key, found: true, passwordOk: true })),
    workspace: { ownerEmail: DEMO_PEOPLE.owner.email },
    members: [
      { email: DEMO_PEOPLE.finance.email, role: "EDITOR" },
      { email: DEMO_PEOPLE.investor.email, role: "VIEWER" },
    ],
    model: {
      name: demoModelName(timeline.startMonth),
      ownerEmail: DEMO_PEOPLE.owner.email,
      inWorkspace: true,
      startMonth: timeline.startMonth,
      horizonMonths: 36,
      revisionSequence: 3,
      scenarioTypes: ["BASE", "BULL", "BEAR"],
      financingCount: 3,
      overrideCount: 5,
      completeSections: 3,
      forecastMonths: 36,
      forecastFirstMonth: timeline.startMonth,
      forecastError: null,
      endingCash: Number(forecast.metrics.endingCash),
    },
    versions: [1, 2, 3].map((version) => ({
      version,
      label: `v${version}`,
      assumptionsKey: `k${version}`,
    })),
    baselines: [
      { name: "Budget", kind: "BUDGET" },
      { name: "Forecast", kind: "FORECAST" },
    ],
    actuals,
    forecastRows: rows,
    imports: [
      ...actuals.map((actual) => ({
        fileName: actual.period,
        status: "SUCCEEDED",
        rejectedCount: 0,
      })),
      { fileName: "draft", status: "FAILED", rejectedCount: 2 },
    ],
    riskPolicy: parseProjectRiskPolicy(DEMO_RISK_POLICY_INPUT),
    targets,
    commentaries: DEMO_COMMENTARIES.map((item) => ({
      periodKey: timeline.actualMonths[item.monthIndex],
      status: item.status,
    })),
    closedMonths: timeline.closedMonths,
    periodEvents: [
      ...timeline.closedMonths.map((period) => ({ period, action: "CLOSED" })),
      { period: reopened, action: "REOPENED" },
      { period: reopened, action: "CLOSED" },
    ],
    decisions: DEMO_DECISIONS.map((item) => ({
      status: item.finalStatus,
      dueDate: demoDueDate(now, item.dueInDays),
    })),
    approvals: [
      ...DEMO_APPROVALS.map((item) => ({
        status: status[item.decision],
        requestType: item.requestType,
        requestedBy: "finance",
        decidedBy: item.decision === "PENDING" ? null : "owner",
      })),
      {
        status: "APPROVED",
        requestType: "FINANCIAL_PERIOD_REOPEN",
        requestedBy: "finance",
        decidedBy: "owner",
      },
    ],
    reviews: [{ periodKey: timeline.latestActualMonth, snapshotOk: true }],
    audit: {
      count: 48,
      categories: ["BOARD_ROOM", "DECISION_CENTER", "FINANCIAL_CLOSE", "PROJECT"],
      oldest: new Date(now.getTime() - 260 * DAY),
      newest: new Date(now.getTime() - 60 * 1000),
    },
  };
}

function failures(facts: DemoFacts): string[] {
  const names: string[] = [];

  for (const check of DEMO_CHECKS) {
    try {
      check.run(facts);
    } catch {
      names.push(check.name);
    }
  }

  return names;
}

/** One way to break the data, and a piece of the name of the check that has to notice it. */
const BREAKS: { part: string; apply: (facts: DemoFacts) => void }[] = [
  {
    part: "demo accounts exist",
    apply: (f) => {
      f.people[0].found = false;
    },
  },
  {
    part: "signs in",
    apply: (f) => {
      f.people[1].passwordOk = false;
    },
  },
  {
    part: "workspace is owned",
    apply: (f) => {
      f.members[0].role = "VIEWER";
    },
  },
  {
    part: "belongs to the founder",
    apply: (f) => {
      if (f.model) f.model.inWorkspace = false;
    },
  },
  {
    part: "3 scenarios",
    apply: (f) => {
      if (f.model) f.model.overrideCount = 4;
    },
  },
  {
    part: "3 parts",
    apply: (f) => {
      if (f.model) f.model.completeSections = 2;
    },
  },
  {
    part: "whole horizon",
    apply: (f) => {
      if (f.model) f.model.forecastError = "boom";
    },
  },
  {
    part: "saved versions",
    apply: (f) => {
      f.versions[1].assumptionsKey = f.versions[0].assumptionsKey;
    },
  },
  {
    part: "baselines",
    apply: (f) => {
      f.baselines.pop();
    },
  },
  {
    part: "no gaps",
    apply: (f) => {
      f.actuals.splice(3, 1);
    },
  },
  {
    part: "add up",
    apply: (f) => {
      f.actuals[4].cashBalance = 1;
    },
  },
  {
    part: "within 10 percent",
    apply: (f) => {
      f.actuals.forEach((a) => {
        a.revenue = (a.revenue ?? 0) * 1.3;
      });
    },
  },
  {
    part: "accuracy",
    apply: (f) => {
      f.forecastRows.forEach((r) => {
        r.revenue = (r.revenue ?? 0) * 3;
      });
    },
  },
  {
    part: "import history",
    apply: (f) => {
      f.imports[f.imports.length - 1].status = "SUCCEEDED";
    },
  },
  {
    part: "risk rules",
    apply: (f) => {
      f.riskPolicy = null;
    },
  },
  {
    part: "scorecard",
    apply: (f) => {
      f.targets = f.targets.slice(0, 5);
    },
  },
  {
    part: "explanations",
    apply: (f) => {
      f.commentaries.forEach((c) => {
        c.status = "OPEN";
      });
    },
  },
  {
    part: "closed and one",
    apply: (f) => {
      f.periodEvents.pop();
    },
  },
  {
    part: "overdue",
    apply: (f) => {
      f.decisions.forEach((d) => {
        d.dueDate = new Date(f.today.getTime() + 30 * DAY);
      });
    },
  },
  {
    part: "approvals are",
    apply: (f) => {
      f.approvals[0].decidedBy = f.approvals[0].requestedBy;
    },
  },
  {
    part: "board review",
    apply: (f) => {
      f.reviews[0].snapshotOk = false;
    },
  },
  {
    part: "activity feed",
    apply: (f) => {
      f.audit.categories = ["PROJECT"];
    },
  },
  {
    part: "future",
    apply: (f) => {
      f.audit.newest = new Date(f.today.getTime() + 5 * DAY);
    },
  },
  {
    part: "covers at least",
    apply: (f) => {
      f.audit.oldest = new Date(f.today.getTime() - 2 * DAY);
    },
  },
];

describe("the checks of the demo data", () => {
  it("pass on a complete demo company, whatever the day of the run", () => {
    for (const day of ["2026-10-23T10:00:00Z", "2027-03-15T12:00:00Z", "2028-02-29T12:00:00Z"]) {
      expect(failures(goodFacts(day)), day).toEqual([]);
    }
  });

  it("have a different name each, and tell what they found", () => {
    const names = DEMO_CHECKS.map((check) => check.name);

    expect(new Set(names).size).toBe(names.length);

    expect(names.length).toBeGreaterThanOrEqual(24);

    for (const check of DEMO_CHECKS) {
      expect(check.run(goodFacts()).length, check.name).toBeGreaterThan(1);
    }
  });

  it("each have a way to break the data that only they, or a check next to them, can see", () => {
    for (const check of DEMO_CHECKS) {
      const matches = BREAKS.filter((item) => check.name.includes(item.part));

      expect(matches.length, check.name).toBeGreaterThan(0);
    }

    for (const item of BREAKS) {
      expect(DEMO_CHECKS.filter((check) => check.name.includes(item.part)).length, item.part).toBe(
        1,
      );
    }
  });

  it("fail on bad data, and name the right check", () => {
    for (const item of BREAKS) {
      const facts = goodFacts();

      item.apply(facts);

      const named = DEMO_CHECKS.filter((check) => check.name.includes(item.part)).map(
        (check) => check.name,
      );

      expect(failures(facts), item.part).toContain(named[0]);
    }
  });

  it("say to run the seed first when there is no model at all", () => {
    const facts = goodFacts();

    facts.model = null;

    const messages: string[] = [];

    for (const check of DEMO_CHECKS) {
      try {
        check.run(facts);
      } catch (error) {
        messages.push(error instanceof Error ? error.message : "");
      }
    }

    expect(messages.some((message) => message.includes("pnpm db:seed"))).toBe(true);
  });
});
