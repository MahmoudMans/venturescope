import { calculateVarianceReport } from "@/lib/finance/actuals/variance";
import type { ActualFinancialPeriod } from "@/lib/finance/actuals/types";
import type { ForecastAnalyticsRow } from "@/lib/finance/analytics/types";
import { addMonths } from "@/lib/finance/dates";
import { calculateForecastAccuracyReport } from "@/lib/finance/forecast-accuracy/calculations";
import type { ProjectRiskPolicy } from "@/lib/finance/risk-center/types";
import { calculateManagementScorecard } from "@/lib/finance/scorecard/calculations";
import type { KpiTargetView } from "@/lib/finance/scorecard/types";
import { DEMO_PEOPLE, DEMO_PERSON_KEYS, type DemoPersonKey } from "@/scripts/seed/demo-config";
import {
  DEMO_APPROVALS,
  DEMO_COMMENTARIES,
  DEMO_DECISIONS,
  DEMO_REOPEN,
  monthName,
} from "@/scripts/seed/demo-data";

/**
 * The checks of the demo data. They do not read the database: they get a plain object of facts
 * (see loadDemoFacts in verify-facts.ts) and test it. Most of them use the same calculations as the
 * pages (the forecast, the accuracy, the scorecard), so a green check means the pages have what
 * they need. Because they need no database, tests/seed/verify-checks.test.ts can feed them
 * good data and bad data.
 */

export type DemoFacts = {
  today: Date;

  people: { key: DemoPersonKey; found: boolean; passwordOk: boolean }[];

  workspace: { ownerEmail: string | null } | null;

  members: { email: string; role: string }[];

  model: null | {
    name: string;

    ownerEmail: string | null;

    inWorkspace: boolean;

    startMonth: string;

    horizonMonths: number;

    revisionSequence: number;

    scenarioTypes: string[];

    financingCount: number;

    overrideCount: number;

    completeSections: number;

    forecastMonths: number;

    forecastFirstMonth: string | null;

    forecastError: string | null;

    endingCash: number | null;
  };

  versions: { version: number; label: string | null; assumptionsKey: string }[];

  baselines: { name: string; kind: string }[];

  actuals: ActualFinancialPeriod[];

  forecastRows: ForecastAnalyticsRow[];

  imports: { fileName: string; status: string; rejectedCount: number }[];

  riskPolicy: ProjectRiskPolicy | null;

  targets: KpiTargetView[];

  commentaries: { periodKey: string; status: string }[];

  closedMonths: string[];

  periodEvents: { period: string; action: string }[];

  decisions: { status: string; dueDate: Date | null }[];

  approvals: {
    status: string;
    requestType: string;
    requestedBy: string | null;
    decidedBy: string | null;
  }[];

  reviews: { periodKey: string; snapshotOk: boolean }[];

  audit: { count: number; categories: string[]; oldest: Date | null; newest: Date | null };
};

export type DemoCheck = {
  name: string;

  /** Returns a short note when the check passes. Throws an Error with the reason when it fails. */
  run: (facts: DemoFacts) => string;
};

function fail(message: string): never {
  throw new Error(message);
}

function modelOf(facts: DemoFacts): NonNullable<DemoFacts["model"]> {
  return facts.model ?? fail("The demo model was not found. Run pnpm db:seed first.");
}

function distinct(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function scorecardStatuses(facts: DemoFacts): string[] {
  const last = facts.actuals[facts.actuals.length - 1];

  if (last === undefined || facts.riskPolicy === null) {
    return [];
  }

  const scorecard = calculateManagementScorecard({
    targets: facts.targets,
    actuals: facts.actuals,
    forecasts: facts.forecastRows,
    riskPolicy: facts.riskPolicy,
    latestActualPeriod: last.period,
    latestActualCash: last.cashBalance,
  });

  return distinct(scorecard.rows.map((row) => row.status));
}

export const DEMO_CHECKS: DemoCheck[] = [
  {
    name: "the 3 demo accounts exist",
    run: (facts) => {
      const missing = facts.people
        .filter((entry) => entry.found === false)
        .map((entry) => entry.key);

      if (missing.length > 0) {
        fail(`Missing accounts: ${missing.join(", ")}.`);
      }

      return DEMO_PERSON_KEYS.map((key) => DEMO_PEOPLE[key].email).join(", ");
    },
  },
  {
    name: "every demo account signs in with the demo password",
    run: (facts) => {
      const wrong = facts.people
        .filter((entry) => entry.passwordOk === false)
        .map((entry) => entry.key);

      if (wrong.length > 0) {
        fail(`The password does not match for: ${wrong.join(", ")}.`);
      }

      return "3 of 3";
    },
  },
  {
    name: "the workspace is owned by the founder and has an editor and a viewer",
    run: (facts) => {
      if (facts.workspace === null) {
        fail("The workspace was not found.");
      }

      if (facts.workspace.ownerEmail !== DEMO_PEOPLE.owner.email) {
        fail(`The owner is ${facts.workspace.ownerEmail}.`);
      }

      const roleOf = (key: DemoPersonKey) =>
        facts.members.find((member) => member.email === DEMO_PEOPLE[key].email)?.role ?? "none";

      if (roleOf("finance") !== "EDITOR" || roleOf("investor") !== "VIEWER") {
        fail(`The roles are ${roleOf("finance")} and ${roleOf("investor")}.`);
      }

      return "owner, 1 editor, 1 viewer";
    },
  },
  {
    name: "the model belongs to the founder and sits in the workspace",
    run: (facts) => {
      const model = modelOf(facts);

      if (model.ownerEmail !== DEMO_PEOPLE.owner.email) {
        fail(`The model belongs to ${model.ownerEmail}.`);
      }

      if (model.inWorkspace === false) {
        fail("The model is not in the demo workspace.");
      }

      return model.name;
    },
  },
  {
    name: "the model has 3 scenarios, 3 financing events and 5 month changes",
    run: (facts) => {
      const model = modelOf(facts);

      const scenarios = distinct(model.scenarioTypes).join(",");

      if (
        scenarios !== "BASE,BEAR,BULL" ||
        model.financingCount !== 3 ||
        model.overrideCount !== 5
      ) {
        fail(
          `Found ${scenarios}, ${model.financingCount} financing events, ${model.overrideCount} month changes.`,
        );
      }

      return "3 / 3 / 5";
    },
  },
  {
    name: "all 3 parts of the assumptions are complete",
    run: (facts) => {
      const model = modelOf(facts);

      if (model.completeSections !== 3) {
        fail(`Only ${model.completeSections} of 3 parts are complete.`);
      }

      return "3 of 3";
    },
  },
  {
    name: "the forecast runs for the whole horizon",
    run: (facts) => {
      const model = modelOf(facts);

      if (model.forecastError !== null) {
        fail(`The forecast failed: ${model.forecastError}`);
      }

      if (
        model.forecastMonths !== model.horizonMonths ||
        model.forecastFirstMonth !== model.startMonth
      ) {
        fail(`Got ${model.forecastMonths} months from ${model.forecastFirstMonth}.`);
      }

      if (model.endingCash === null || Number.isFinite(model.endingCash) === false) {
        fail("The ending cash is not a number.");
      }

      return `${model.forecastMonths} months from ${model.startMonth}`;
    },
  },
  {
    name: "there are 3 saved versions and they are different",
    run: (facts) => {
      const model = modelOf(facts);

      if (facts.versions.length !== 3 || model.revisionSequence !== 3) {
        fail(`Found ${facts.versions.length} versions (counter ${model.revisionSequence}).`);
      }

      const keys = facts.versions.map((version) => version.assumptionsKey);

      if (new Set(keys).size !== 3) {
        fail("Two saved versions have the same numbers.");
      }

      return facts.versions.map((version) => version.label ?? "no label").join(" > ");
    },
  },
  {
    name: "the 2 baselines are saved",
    run: (facts) => {
      if (facts.baselines.length !== 2) {
        fail(`Found ${facts.baselines.length} baselines.`);
      }

      return facts.baselines.map((baseline) => `${baseline.name} (${baseline.kind})`).join(", ");
    },
  },
  {
    name: "the monthly results start with the first month and have no gaps",
    run: (facts) => {
      const model = modelOf(facts);

      if (facts.actuals.length < 6) {
        fail(`Only ${facts.actuals.length} months of results.`);
      }

      if (facts.actuals[0].period !== model.startMonth) {
        fail(
          `The first result is for ${facts.actuals[0].period}, the model starts ${model.startMonth}.`,
        );
      }

      const periods = facts.actuals.map((actual) => actual.period);

      const expected = facts.forecastRows.slice(0, periods.length).map((row) => row.period);

      if (periods.join() !== expected.join()) {
        fail(`The months are ${periods.join(" ")}.`);
      }

      return `${periods.length} months, ${periods[0]} to ${periods[periods.length - 1]}`;
    },
  },
  {
    name: "profit and cash add up in every month",
    run: (facts) => {
      let previousCash: number | null = null;

      for (const actual of facts.actuals) {
        const { revenue, cogs, operatingExpenses, ebitda, cashFlow, cashBalance } = actual;

        if (
          [revenue, cogs, operatingExpenses, ebitda, cashFlow, cashBalance].some(
            (value) => value === null,
          )
        ) {
          fail(`${actual.period} has an empty number.`);
        }

        if (Math.abs((revenue ?? 0) - (cogs ?? 0) - (operatingExpenses ?? 0) - (ebitda ?? 0)) > 1) {
          fail(`${actual.period}: revenue minus costs is not the EBITDA.`);
        }

        if (
          previousCash !== null &&
          Math.abs((cashBalance ?? 0) - previousCash - (cashFlow ?? 0)) > 1
        ) {
          fail(`${actual.period}: the cash balance does not follow the cash flow.`);
        }

        previousCash = cashBalance;
      }

      return `${facts.actuals.length} months checked`;
    },
  },
  {
    name: "the results match the plan within 10 percent over the year",
    run: (facts) => {
      const report = calculateVarianceReport(facts.actuals, facts.forecastRows);

      const rate = report.summary.revenueVarianceRate;

      if (report.summary.matchedPeriods !== facts.actuals.length) {
        fail(
          `Only ${report.summary.matchedPeriods} of ${facts.actuals.length} months match a plan month.`,
        );
      }

      if (rate === null || Math.abs(rate) > 0.1) {
        fail(
          `The revenue is ${rate === null ? "unknown" : `${(rate * 100).toFixed(1)}%`} from the plan.`,
        );
      }

      return `revenue ${(rate * 100).toFixed(1)}% from the plan`;
    },
  },
  {
    name: "the forecast accuracy is between 85 and 99 percent",
    run: (facts) => {
      const report = calculateForecastAccuracyReport(facts.actuals, facts.forecastRows);

      const score = report.overallAccuracyScore;

      if (score === null || score < 0.85 || score > 0.99) {
        fail(`The accuracy is ${score === null ? "unknown" : `${(score * 100).toFixed(1)}%`}.`);
      }

      return `${(score * 100).toFixed(1)}%`;
    },
  },
  {
    name: "the import history has loaded files and one refused file",
    run: (facts) => {
      const refused = facts.imports.filter((item) => item.status === "FAILED");

      const loaded = facts.imports.filter((item) => item.status === "SUCCEEDED");

      if (refused.length !== 1 || refused[0].rejectedCount < 1) {
        fail(`Found ${refused.length} refused files.`);
      }

      if (loaded.length < facts.actuals.length) {
        fail(`Only ${loaded.length} files were loaded.`);
      }

      return `${loaded.length} loaded, 1 refused (${refused[0].rejectedCount} bad rows)`;
    },
  },
  {
    name: "the risk rules are saved",
    run: (facts) => {
      if (facts.riskPolicy === null) {
        fail("There are no risk rules.");
      }

      if (facts.riskPolicy.minimumRunwayMonths !== 9 || facts.riskPolicy.minimumCash !== 250000) {
        fail(
          `The rules are ${facts.riskPolicy.minimumRunwayMonths} months and ${facts.riskPolicy.minimumCash} cash.`,
        );
      }

      return "9 months of runway, 250000 minimum cash";
    },
  },
  {
    name: "the scorecard shows goals that are on track, at risk and off track",
    run: (facts) => {
      if (facts.targets.length < 15) {
        fail(`Only ${facts.targets.length} goals.`);
      }

      const statuses = scorecardStatuses(facts).join(",");

      if (statuses !== "AT_RISK,OFF_TRACK,ON_TRACK") {
        fail(`The statuses are ${statuses || "none"}.`);
      }

      return `${facts.targets.length} goals`;
    },
  },
  {
    name: "the variance explanations are saved with different statuses",
    run: (facts) => {
      if (facts.commentaries.length !== DEMO_COMMENTARIES.length) {
        fail(`Found ${facts.commentaries.length} of ${DEMO_COMMENTARIES.length}.`);
      }

      const statuses = distinct(facts.commentaries.map((item) => item.status));

      if (statuses.length < 3) {
        fail(`Only these statuses: ${statuses.join(",")}.`);
      }

      return statuses.join(", ");
    },
  },
  {
    name: "6 months are closed and one of them was reopened and closed again",
    run: (facts) => {
      if (facts.closedMonths.length !== 6) {
        fail(`${facts.closedMonths.length} months are closed.`);
      }

      const month = addMonths(modelOf(facts).startMonth, DEMO_REOPEN.monthIndex);

      const actions = facts.periodEvents
        .filter((event) => event.period === month)
        .map((event) => event.action);

      if (actions.join() !== "CLOSED,REOPENED,CLOSED") {
        fail(`The history of ${monthName(month)} is ${actions.join(" ") || "empty"}.`);
      }

      return `${facts.closedMonths.join(", ")} (${monthName(month)} was reopened)`;
    },
  },
  {
    name: "the decisions use every status and one is overdue",
    run: (facts) => {
      if (facts.decisions.length !== DEMO_DECISIONS.length) {
        fail(`Found ${facts.decisions.length} decisions.`);
      }

      const statuses = distinct(facts.decisions.map((item) => item.status)).join(",");

      if (statuses !== "BLOCKED,DISMISSED,DONE,IN_PROGRESS,OPEN") {
        fail(`The statuses are ${statuses}.`);
      }

      const overdue = facts.decisions.filter(
        (item) =>
          item.dueDate !== null &&
          item.dueDate.getTime() < facts.today.getTime() &&
          item.status !== "DONE" &&
          item.status !== "DISMISSED",
      );

      if (overdue.length === 0) {
        fail("No open decision is overdue.");
      }

      return `${facts.decisions.length} decisions, ${overdue.length} overdue`;
    },
  },
  {
    name: "the approvals are pending, approved and rejected, and nobody approved their own",
    run: (facts) => {
      const expected = DEMO_APPROVALS.length + 1;

      if (facts.approvals.length !== expected) {
        fail(`Found ${facts.approvals.length} of ${expected}.`);
      }

      const count = (status: string) =>
        facts.approvals.filter((item) => item.status === status).length;

      if (count("PENDING") !== 2 || count("APPROVED") !== 3 || count("REJECTED") !== 1) {
        fail(
          `${count("PENDING")} pending, ${count("APPROVED")} approved, ${count("REJECTED")} rejected.`,
        );
      }

      if (
        facts.approvals.some(
          (item) => item.requestedBy !== null && item.requestedBy === item.decidedBy,
        )
      ) {
        fail("A request was approved by the person who asked for it.");
      }

      return "2 pending, 3 approved, 1 rejected";
    },
  },
  {
    name: "the board review can be read",
    run: (facts) => {
      if (facts.reviews.length !== 1 || facts.reviews[0].snapshotOk === false) {
        fail(
          `Found ${facts.reviews.length} reviews, readable: ${facts.reviews.map((r) => r.snapshotOk).join(",")}.`,
        );
      }

      return `review of ${facts.reviews[0].periodKey}`;
    },
  },
  {
    name: "the activity feed has events of at least 4 kinds",
    run: (facts) => {
      if (facts.audit.count < 40 || facts.audit.categories.length < 4) {
        fail(`${facts.audit.count} events of ${facts.audit.categories.length} kinds.`);
      }

      return `${facts.audit.count} events: ${facts.audit.categories.join(", ")}`;
    },
  },
  {
    name: "no event is in the future",
    run: (facts) => {
      if (
        facts.audit.newest !== null &&
        facts.audit.newest.getTime() > facts.today.getTime() + 60 * 1000
      ) {
        fail(`The newest event is ${facts.audit.newest.toISOString()}.`);
      }

      return "ok";
    },
  },
  {
    name: "the history covers at least 6 months",
    run: (facts) => {
      if (facts.audit.oldest === null || facts.audit.newest === null) {
        fail("There are no events.");
      }

      const days =
        (facts.audit.newest.getTime() - facts.audit.oldest.getTime()) / (24 * 60 * 60 * 1000);

      if (days < 180) {
        fail(`The events cover only ${Math.round(days)} days. Run pnpm db:seed again.`);
      }

      return `${Math.round(days)} days`;
    },
  },
];
