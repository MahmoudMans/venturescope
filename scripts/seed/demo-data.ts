import { addMonths } from "@/lib/finance/dates";
import { calculateVarianceReport } from "@/lib/finance/actuals/variance";
import { generateFinancialForecast } from "@/lib/finance/engine";
import { normalizeForecastCsv } from "@/lib/finance/analytics/csv";
import type { ForecastAnalyticsRow } from "@/lib/finance/analytics/types";
import type { ActualFinancialPeriod } from "@/lib/finance/actuals/types";
import type { FinancialAssumptionsV1 } from "@/lib/finance/assumptions/types";
import {
  buildFinancialModelInput,
  type PersistedProjectFinancialSource,
} from "@/lib/finance/project-input";
import type {
  DecisionActionPriority,
  DecisionActionStatus,
  DecisionSourceCode,
} from "@/lib/finance/decision-center/types";
import type { ApprovalRequestType } from "@/lib/approvals/types";
import type { FinancialForecast, MonthKey } from "@/lib/finance/types";
import type { DemoTimeline } from "@/scripts/seed/demo-config";
import { monthInputToUtcDate } from "@/lib/projects/project-dates";
import { demoModelName } from "@/scripts/seed/demo-config";
import { buildSampleModel, type SampleModel } from "@/lib/projects/sample-model";
import { buildForecastCsv } from "@/lib/reports/csv";
import type { ReadyReportContext } from "@/lib/reports/context";

/**
 * The numbers of the demo story. Everything here is a plain function of the start month, so the
 * same input always gives the same data. The forecast comes from the real forecast engine of the
 * app, and the actual results are the forecast moved up and down by a fixed story.
 */

/** The three saved versions of the plan, oldest first. */
export type DemoStage = "SEED_PLAN" | "PRICING_UPDATE" | "CURRENT";

export const DEMO_STAGES: DemoStage[] = ["SEED_PLAN", "PRICING_UPDATE", "CURRENT"];

export const DEMO_REVISIONS: Record<DemoStage, { label: string; reason: string }> = {
  SEED_PLAN: {
    label: "Seed plan",
    reason: "The first plan, the one we showed to investors for the seed round.",
  },

  PRICING_UPDATE: {
    label: "Pricing update",
    reason: "Raised the price per customer to 149 after the pilot customers accepted it.",
  },

  CURRENT: {
    label: "Retention programme",
    reason: "More marketing, less churn and more organic sign-ups after the success team started.",
  },
};

/** Changes to the customer and marketing numbers of the sample company, per saved version. */
const STAGE_CHANGES: Record<
  DemoStage,
  { arpu: string; cac: string; churn: string; organic: string; marketing: string }
> = {
  SEED_PLAN: { arpu: "139", cac: "240", churn: "2.8", organic: "20", marketing: "24000" },

  PRICING_UPDATE: { arpu: "149", cac: "220", churn: "2.5", organic: "22", marketing: "24000" },

  CURRENT: { arpu: "149", cac: "220", churn: "2.2", organic: "24", marketing: "28000" },
};

export type DemoModel = SampleModel & { stage: DemoStage };

/**
 * The model of one saved version. It starts from the Orbit Analytics sample of the app, with two
 * changes: the three numbers per version above, and no fixed revenue in the launch month (a fixed
 * number inside a growing company makes a dip in every chart).
 */
export function buildDemoModel(startMonth: MonthKey, stage: DemoStage): DemoModel {
  const sample = buildSampleModel(startMonth);

  const assumptions: FinancialAssumptionsV1 = structuredClone(sample.assumptions);

  const change = STAGE_CHANGES[stage];

  assumptions.customerRevenue.arpu = change.arpu;

  assumptions.customerRevenue.cac = change.cac;

  assumptions.customerRevenue.monthlyChurnRate = change.churn;

  assumptions.customerRevenue.organicNewCustomers = change.organic;

  assumptions.expenses.marketing.monthlyAmount = change.marketing;

  return {
    ...sample,

    stage,

    name: demoModelName(startMonth),

    assumptions,

    overrides: sample.overrides.map((override) => {
      if (override.scenario !== "ALL" || override.values.revenue === undefined) {
        return override;
      }

      const values = { ...override.values };

      delete values.revenue;

      return { ...override, values };
    }),
  };
}

/** The model as the app reads it from the database, without a database. */
export function demoProjectSource(
  model: DemoModel,
  projectId: string,
): PersistedProjectFinancialSource {
  return {
    id: projectId,

    name: model.name,

    currency: model.currency,

    startMonth: monthInputToUtcDate(model.startMonth),

    horizonMonths: model.horizonMonths,

    revenueMode: model.revenueMode,

    modelVersion: "1.0",

    baseAssumptions: model.assumptions,

    financingEvents: model.financingEvents.map((event) => ({
      name: event.name,
      type: event.type,
      month: monthInputToUtcDate(event.month),
      amount: event.amount,
      apr: event.apr,
      termMonths: event.termMonths,
      repaymentStartMonth: event.repaymentStartMonth
        ? monthInputToUtcDate(event.repaymentStartMonth)
        : null,
    })),

    // The Base Case uses the overrides for every scenario, and not the Bull or Bear ones.
    monthlyOverrides: model.overrides
      .filter((override) => override.scenario === "ALL")
      .map((override) => ({
        scenarioId: null,
        month: monthInputToUtcDate(override.month),
        values: override.values,
        note: override.note,
      })),
  };
}

/** The Base Case forecast of a saved version, from the same engine as every page. */
export function demoForecast(model: DemoModel): FinancialForecast {
  const input = buildFinancialModelInput(demoProjectSource(model, "demo-preview"), {
    name: "Base Case",
    type: "BASE",
    modifiers: {},
  });

  return generateFinancialForecast(input);
}

/**
 * The forecast rows in the shape the pages and the saved baselines use. They are made the same way
 * as in the app: the forecast becomes the CSV of the export, and the CSV is read back.
 */
export function demoForecastRows(forecast: FinancialForecast): ForecastAnalyticsRow[] {
  const context = { forecast } as unknown as ReadyReportContext;

  return normalizeForecastCsv(buildForecastCsv(context));
}

export type DemoActual = {
  period: string;

  revenue: number;

  cogs: number;

  operatingExpenses: number;

  ebitda: number;

  netIncome: number;

  cashFlow: number;

  cashBalance: number;

  mrr: number;

  customers: number;
};

/**
 * What happened, month by month, against the plan. A number below 1 means less than planned.
 * The third month was hard (a pilot signed late and two accounts left), the months after the
 * sixth were strong and the eighth was the best one. Costs ran a little over most of the year
 * because hiring came early. The texts of the story say "the third month" with {m2} (see below).
 */
const ACTUAL_STORY: {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  customers: number;
  mrr: number;
}[] = [
  { revenue: 0.94, cogs: 1.0, operatingExpenses: 1.02, customers: 0.97, mrr: 0.95 },
  { revenue: 0.96, cogs: 1.02, operatingExpenses: 1.03, customers: 0.98, mrr: 0.96 },
  { revenue: 0.89, cogs: 1.06, operatingExpenses: 1.05, customers: 0.93, mrr: 0.92 },
  { revenue: 0.985, cogs: 1.03, operatingExpenses: 1.02, customers: 0.97, mrr: 0.97 },
  { revenue: 1.03, cogs: 1.0, operatingExpenses: 1.02, customers: 1.01, mrr: 1.02 },
  { revenue: 1.05, cogs: 0.99, operatingExpenses: 1.01, customers: 1.03, mrr: 1.04 },
  { revenue: 1.02, cogs: 1.0, operatingExpenses: 1.0, customers: 1.02, mrr: 1.02 },
  { revenue: 1.12, cogs: 1.01, operatingExpenses: 1.07, customers: 1.08, mrr: 1.09 },
  { revenue: 1.04, cogs: 1.0, operatingExpenses: 1.03, customers: 1.03, mrr: 1.04 },
];

function amount(value: string | null): number {
  return value === null ? 0 : Number(value);
}

/**
 * The actual results of the months that have passed. They are the plan multiplied by the story
 * above, and the profit and cash follow from the moved numbers in the same way as in the forecast
 * (tax only on a profit, and the money from financing in the month it arrives).
 */
export function buildDemoActuals(
  forecast: FinancialForecast,
  months: MonthKey[],
  assumptions: FinancialAssumptionsV1,
): DemoActual[] {
  const taxRate = Number(assumptions.general.corporateTaxRate) / 100;

  let cash = Number(assumptions.general.startingCash);

  return months.map((month, index) => {
    const plan = forecast.months.find((candidate) => candidate.month === month);

    if (plan === undefined) {
      throw new Error(`The forecast has no month ${month}.`);
    }

    const story = ACTUAL_STORY[Math.min(index, ACTUAL_STORY.length - 1)];

    const revenue = Math.round(amount(plan.revenue) * story.revenue);

    const cogs = Math.round(amount(plan.cogs) * story.revenue * story.cogs);

    const operatingExpenses = Math.round(
      amount(plan.totalOperatingExpenses) * story.operatingExpenses,
    );

    const ebitda = revenue - cogs - operatingExpenses;

    const netIncome = ebitda > 0 ? Math.round(ebitda * (1 - taxRate)) : ebitda;

    const financing = Math.round(
      amount(plan.financingInflows.total) - amount(plan.debtPrincipalRepayment),
    );

    const cashFlow = netIncome + financing;

    cash += cashFlow;

    return {
      period: month,
      revenue,
      cogs,
      operatingExpenses,
      ebitda,
      netIncome,
      cashFlow,
      cashBalance: Math.round(cash),
      mrr: Math.round(amount(plan.mrr) * story.mrr),
      customers: Math.round(amount(plan.endingCustomers) * story.customers),
    };
  });
}

/** The same numbers in the shape the pages and the calculations read. */
export function demoActualPeriods(actuals: DemoActual[]): ActualFinancialPeriod[] {
  return actuals.map((actual) => ({ ...actual }));
}

export const ACTUALS_CSV_HEADER =
  "period,revenue,cogs,operatingExpenses,ebitda,netIncome,cashFlow,cashBalance,mrr,customers";

/** The file a finance lead would export from the accounting tool. */
export function demoActualsCsv(actuals: DemoActual[]): string {
  return [
    ACTUALS_CSV_HEADER,
    ...actuals.map((actual) =>
      [
        actual.period,
        actual.revenue,
        actual.cogs,
        actual.operatingExpenses,
        actual.ebitda,
        actual.netIncome,
        actual.cashFlow,
        actual.cashBalance,
        actual.mrr,
        actual.customers,
      ].join(","),
    ),
  ].join("\n");
}

/**
 * A first export that is wrong on purpose: the month does not exist, a number is text and the
 * customers are negative. The import must refuse it, and the import history shows the problems.
 */
export function demoBrokenActualsCsv(months: MonthKey[]): string {
  return [
    ACTUALS_CSV_HEADER,
    `${months[0]},82000,13500,139000,-70500,-70500,-70500,279500,79000,541`,
    `${addMonths(months[0], 1)},not a number,17000,140000,-50000,-50000,-50000,229500,100000,680`,
    "2026-13,120000,19000,141000,-40000,-40000,-40000,189500,115000,-3",
  ].join("\n");
}

export type DemoTarget = {
  periodKey: string;

  metricCode:
    | "REVENUE"
    | "EBITDA_MARGIN"
    | "CASH_BALANCE"
    | "MRR"
    | "CUSTOMERS"
    | "RUNWAY_MONTHS"
    | "FORECAST_ACCURACY";

  /** The number as written in the import file: EBITDA_MARGIN and FORECAST_ACCURACY are percents. */
  value: number;

  ownerName: string;

  note: string;
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * The goals the team promised for the last three months, and for the month that is running now.
 * Most are close to the plan. Three are set a little too high on purpose, so the scorecard shows
 * goals that are on track, at risk and off track.
 */
export function buildDemoTargets(
  rows: ForecastAnalyticsRow[],
  timeline: DemoTimeline,
): DemoTarget[] {
  const byPeriod = new Map(rows.map((row) => [row.period, row]));

  const plan = (period: string): ForecastAnalyticsRow => {
    const row = byPeriod.get(period);

    if (row === undefined) {
      throw new Error(`The forecast has no month ${period}.`);
    }

    return row;
  };

  const targets: DemoTarget[] = [];

  timeline.actualMonths.slice(-3).forEach((period, index) => {
    const row = plan(period);

    const margin = ((row.ebitda ?? 0) / (row.revenue ?? 1)) * 100;

    targets.push(
      {
        periodKey: period,
        metricCode: "REVENUE",
        value: roundTo((row.revenue ?? 0) * 1.03, 1000),
        ownerName: "Alex Morgan",
        note: "Board commitment for the month",
      },
      {
        periodKey: period,
        metricCode: "EBITDA_MARGIN",
        value: index === 2 ? 28 : roundTo(margin, 1),
        ownerName: "Sam Rivera",
        note: index === 2 ? "Stretch goal after the pricing update" : "Margin goal from the plan",
      },
      {
        periodKey: period,
        metricCode: "CASH_BALANCE",
        value: index === 1 ? 1100000 : roundTo((row.cashBalance ?? 0) * 0.98, 10000),
        ownerName: "Sam Rivera",
        note: "Cash we want in the bank at month end",
      },
      {
        periodKey: period,
        metricCode: "MRR",
        value: roundTo((row.mrr ?? 0) * 1.02, 1000),
        ownerName: "Alex Morgan",
        note: "Monthly recurring revenue goal",
      },
      {
        periodKey: period,
        metricCode: "CUSTOMERS",
        value: index === 2 ? 2100 : roundTo(row.customers ?? 0, 10),
        ownerName: "Alex Morgan",
        note: "Paying customers at month end",
      },
    );
  });

  targets.push(
    {
      periodKey: timeline.latestActualMonth,
      metricCode: "RUNWAY_MONTHS",
      value: 24,
      ownerName: "Sam Rivera",
      note: "Keep two years of runway before the next raise",
    },
    {
      periodKey: timeline.latestActualMonth,
      metricCode: "FORECAST_ACCURACY",
      value: 90,
      ownerName: "Sam Rivera",
      note: "A forecast the board can trust",
    },
    {
      periodKey: timeline.currentMonth,
      metricCode: "REVENUE",
      value: roundTo(plan(timeline.currentMonth).revenue ?? 0, 1000),
      ownerName: "Alex Morgan",
      note: "Goal for the month that is running now",
    },
    {
      periodKey: timeline.currentMonth,
      metricCode: "CUSTOMERS",
      value: roundTo(plan(timeline.currentMonth).customers ?? 0, 10),
      ownerName: "Alex Morgan",
      note: "Goal for the month that is running now",
    },
  );

  return targets;
}

export const TARGETS_CSV_HEADER = "periodKey,metricCode,targetValue,ownerName,note";

export function demoTargetsCsv(targets: DemoTarget[]): string {
  return [
    TARGETS_CSV_HEADER,
    ...targets.map((target) =>
      [target.periodKey, target.metricCode, target.value, target.ownerName, target.note].join(","),
    ),
  ].join("\n");
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The English name of a month, "2026-03" gives "March". */
export function monthName(month: MonthKey): string {
  const name = MONTH_NAMES[Number(month.slice(5, 7)) - 1];

  if (name === undefined) {
    throw new Error(`"${month}" is not a month.`);
  }

  return name;
}

/**
 * The texts of the story never write a month by name, because the seed starts from the day it is
 * run. {m0} is the first month with numbers, {m8} the last one and {m9} the month that is running.
 */
export function fillMonths(text: string, timeline: DemoTimeline): string {
  return text.replace(/\{m(\d)\}/g, (_match, index: string) => {
    const month = index === "9" ? timeline.currentMonth : timeline.actualMonths[Number(index)];

    if (month === undefined) {
      throw new Error(`The text "${text}" uses {m${index}}, which is not a month of the story.`);
    }

    return monthName(month);
  });
}

export type DemoCommentary = {
  /** The place of the month in the list of months with numbers, 0 is the first. */
  monthIndex: number;

  metricCode: "REVENUE" | "COGS" | "EBITDA" | "CASH_BALANCE";

  causeCode: string;

  varianceNature: "ONE_OFF" | "RECURRING" | "STRUCTURAL" | "UNKNOWN";

  explanation: string;

  correctiveAction: string;

  ownerName: string;

  /** How many months after the month of the variance the team expects to be back on plan. */
  recoveryAfter: number | null;

  status: "OPEN" | "MONITORING" | "RESOLVED" | "ACCEPTED";
};

/** The explanations of eight of the material variances. The other ones stay open for the demo. */
export const DEMO_COMMENTARIES: DemoCommentary[] = [
  {
    monthIndex: 2,
    metricCode: "REVENUE",
    causeCode: "TIMING",
    varianceNature: "ONE_OFF",
    explanation: "A large pilot customer moved its signature from {m2} to {m3}.",
    correctiveAction: "Weekly check of the deal pipeline with the sales lead.",
    ownerName: "Sam Rivera",
    recoveryAfter: 1,
    status: "RESOLVED",
  },
  {
    monthIndex: 2,
    metricCode: "EBITDA",
    causeCode: "CHURN_RETENTION",
    varianceNature: "RECURRING",
    explanation: "Two mid-size accounts left after the price review and cloud costs also rose.",
    correctiveAction: "Start the customer success programme and review the cloud contract.",
    ownerName: "Alex Morgan",
    recoveryAfter: 3,
    status: "MONITORING",
  },
  {
    monthIndex: 3,
    metricCode: "EBITDA",
    causeCode: "HEADCOUNT",
    varianceNature: "STRUCTURAL",
    explanation: "Two engineers started in {m3} and not in {m5} as planned.",
    correctiveAction: "Move the hiring dates in the next forecast.",
    ownerName: "Sam Rivera",
    recoveryAfter: null,
    status: "ACCEPTED",
  },
  {
    monthIndex: 4,
    metricCode: "CASH_BALANCE",
    causeCode: "WORKING_CAPITAL",
    varianceNature: "ONE_OFF",
    explanation: "Customer payments that were due in {m4} arrived in {m5}.",
    correctiveAction: "Send payment reminders five days before the due date.",
    ownerName: "Sam Rivera",
    recoveryAfter: 1,
    status: "RESOLVED",
  },
  {
    monthIndex: 5,
    metricCode: "EBITDA",
    causeCode: "ACCOUNTING_CLASSIFICATION",
    varianceNature: "ONE_OFF",
    explanation: "Some tooling costs were booked in {m6} and not in {m5}.",
    correctiveAction: "Check the cut-off of invoices at every month end.",
    ownerName: "Sam Rivera",
    recoveryAfter: 1,
    status: "ACCEPTED",
  },
  {
    monthIndex: 7,
    metricCode: "REVENUE",
    causeCode: "TIMING",
    varianceNature: "ONE_OFF",
    explanation: "Three annual contracts were paid in advance in {m7}.",
    correctiveAction: "Show prepaid contracts as a separate line in the board pack.",
    ownerName: "Alex Morgan",
    recoveryAfter: null,
    status: "ACCEPTED",
  },
  {
    monthIndex: 7,
    metricCode: "COGS",
    causeCode: "INPUT_COST",
    varianceNature: "RECURRING",
    explanation: "The cloud provider raised the price of storage in {m7}.",
    correctiveAction: "Ask for a committed-use discount.",
    ownerName: "Sam Rivera",
    recoveryAfter: 3,
    status: "OPEN",
  },
  {
    monthIndex: 7,
    metricCode: "EBITDA",
    causeCode: "VOLUME",
    varianceNature: "RECURRING",
    explanation: "Strong sales more than paid for the higher cloud cost.",
    correctiveAction: "Keep the campaign budget and watch the margin each month.",
    ownerName: "Alex Morgan",
    recoveryAfter: null,
    status: "MONITORING",
  },
];

export const COMMENTARY_CSV_HEADER =
  "periodKey,metricCode,causeCode,varianceNature,explanation,correctiveAction,ownerName,recoveryPeriodKey,status";

/** The explanations written after one month, as an import file. It is null when there are none. */
export function demoCommentaryCsv(timeline: DemoTimeline, monthIndex: number): string | null {
  const items = DEMO_COMMENTARIES.filter((item) => item.monthIndex === monthIndex);

  if (items.length === 0) {
    return null;
  }

  return [
    COMMENTARY_CSV_HEADER,
    ...items.map((item) =>
      [
        timeline.actualMonths[item.monthIndex],
        item.metricCode,
        item.causeCode,
        item.varianceNature,
        fillMonths(item.explanation, timeline),
        fillMonths(item.correctiveAction, timeline),
        item.ownerName,
        item.recoveryAfter === null
          ? ""
          : addMonths(timeline.actualMonths[item.monthIndex], item.recoveryAfter),
        item.status,
      ].join(","),
    ),
  ].join("\n");
}

/** The risk rules of the company, as the form of the Risk Center takes them (percent as text). */
export const DEMO_RISK_POLICY_INPUT = {
  minimumCash: "250000",
  minimumRunwayMonths: "9",
  minimumEbitdaMarginPercent: "40",
  maximumMonthlyBurn: "",
  downsideRevenueShockPercent: "20",
  downsideCostInflationPercent: "10",
};

export type DemoDecision = {
  title: string;

  details: string;

  sourceCode: DecisionSourceCode;

  priority: DecisionActionPriority;

  ownerName: string;

  /** Days from today. A negative number is a date that has already passed. */
  dueInDays: number;

  /** The status after the action was created. A new action is always OPEN. */
  finalStatus: DecisionActionStatus;

  /** When the action was written down, in days before today. */
  createdDaysAgo: number;

  /** When the status changed, in days before today. It is null for an action that is still OPEN. */
  changedDaysAgo: number | null;

  createdBy: "owner" | "finance";
};

export const DEMO_DECISIONS: DemoDecision[] = [
  {
    title: "Decide the price of the enterprise tier",
    details:
      "Three pilot customers asked for single sign-on and a service level. We need a price before the board meeting.",
    sourceCode: "REVENUE_VARIANCE",
    priority: "CRITICAL",
    ownerName: "Alex Morgan",
    dueInDays: 5,
    finalStatus: "BLOCKED",
    createdDaysAgo: 12,
    changedDaysAgo: 8,
    createdBy: "owner",
  },
  {
    title: "Move the hiring dates in the next forecast",
    details:
      "Two engineers started two months early. The plan still has the old dates, so the planned costs are too low.",
    sourceCode: "EBITDA_VARIANCE",
    priority: "HIGH",
    ownerName: "Sam Rivera",
    dueInDays: 10,
    finalStatus: "OPEN",
    createdDaysAgo: 4,
    changedDaysAgo: null,
    createdBy: "finance",
  },
  {
    title: "Prepare the data room for the Series A",
    details:
      "Model, monthly numbers, goals, board packs and the list of open questions in one place.",
    sourceCode: "CAPITAL_GAP",
    priority: "HIGH",
    ownerName: "Alex Morgan",
    dueInDays: 45,
    finalStatus: "OPEN",
    createdDaysAgo: 18,
    changedDaysAgo: null,
    createdBy: "owner",
  },
  {
    title: "Ask the cloud provider for a committed-use discount",
    details:
      "Storage prices went up in {m7}. A one-year commitment should bring the cost back to plan.",
    sourceCode: "MANUAL",
    priority: "MEDIUM",
    ownerName: "Sam Rivera",
    dueInDays: -12,
    finalStatus: "IN_PROGRESS",
    createdDaysAgo: 30,
    changedDaysAgo: 25,
    createdBy: "finance",
  },
  {
    title: "Check the bias of the forecast",
    details:
      "Revenue was above the forecast in every month since {m4}, while cash stayed below it. Check if the sign-up curve and the payment terms need a new shape.",
    sourceCode: "FORECAST_BIAS",
    priority: "MEDIUM",
    ownerName: "Sam Rivera",
    dueInDays: 14,
    finalStatus: "OPEN",
    createdDaysAgo: 9,
    changedDaysAgo: null,
    createdBy: "finance",
  },
  {
    title: "Add a churn view to the monthly board pack",
    details: "Investors asked to see churn by sign-up month.",
    sourceCode: "MANUAL",
    priority: "LOW",
    ownerName: "Sam Rivera",
    dueInDays: 30,
    finalStatus: "OPEN",
    createdDaysAgo: 21,
    changedDaysAgo: null,
    createdBy: "finance",
  },
  {
    title: "Publish the board pack for {m3} to {m5}",
    details: "Put the three closed months in one board pack and send it to the investor.",
    sourceCode: "MANUAL",
    priority: "MEDIUM",
    ownerName: "Sam Rivera",
    dueInDays: -60,
    finalStatus: "DONE",
    createdDaysAgo: 100,
    changedDaysAgo: 62,
    createdBy: "owner",
  },
  {
    title: "Renegotiate the office lease",
    details: "Not needed any more: the team works from home three days a week.",
    sourceCode: "MANUAL",
    priority: "LOW",
    ownerName: "Alex Morgan",
    dueInDays: -20,
    finalStatus: "DISMISSED",
    createdDaysAgo: 40,
    changedDaysAgo: 20,
    createdBy: "owner",
  },
];

export type DemoApproval = {
  requestType: ApprovalRequestType;

  title: string;

  description: string;

  /** What the request is about, from the saved versions or the board review. */
  subject: "REVISION_PRICING" | "REVIEW" | "NONE";

  decision: "APPROVE" | "REJECT" | "PENDING";

  decisionNote: string;
};

/** Sam Rivera asks and Alex Morgan decides. The same person can never do both. */
export const DEMO_APPROVALS: DemoApproval[] = [
  {
    requestType: "MODEL_CHANGE",
    title: "Raise the price per customer to 149",
    description:
      "The three pilot customers accepted the new price. The saved version Pricing update has the change.",
    subject: "REVISION_PRICING",
    decision: "APPROVE",
    decisionNote: "The pilot customers agreed, so go ahead.",
  },
  {
    requestType: "RISK_POLICY_CHANGE",
    title: "Lower the minimum runway from 9 to 6 months",
    description: "A shorter rule would stop the runway warnings while the launch campaign runs.",
    subject: "NONE",
    decision: "REJECT",
    decisionNote: "Keep 9 months until the venture debt is signed.",
  },
  {
    requestType: "DATA_IMPORT",
    title: "Import the numbers of {m8} from the accounting export",
    description: "Revenue, costs, cash and customers for {m8}, checked against the bank.",
    subject: "NONE",
    decision: "APPROVE",
    decisionNote: "Numbers match the bank statement.",
  },
  {
    requestType: "CAPITAL_PLAN",
    title: "Start talks for the Series A next quarter",
    description:
      "Cash is healthy, but the launch campaign and the hiring plan need more money next year.",
    subject: "NONE",
    decision: "PENDING",
    decisionNote: "",
  },
  {
    requestType: "EXECUTIVE_REVIEW",
    title: "Share the board review of {m8} with the investor",
    description: "The frozen review shows the numbers, the risks and the open actions.",
    subject: "REVIEW",
    decision: "PENDING",
    decisionNote: "",
  },
];

/** The names of the files the story "uploads". One file for each month, like a real finance team. */
export const DEMO_FILE_NAMES = {
  brokenActuals: "actuals-draft-export.csv",
  targetsRecent: "goals-last-three-months.csv",
  targetsCurrent: "goals-current-month.csv",
  actuals: (month: string): string => `actuals-${month}.csv`,
  commentary: (month: string): string => `variance-notes-${month}.csv`,
};

/** The saved baselines, with the saved version they come from. */
export const DEMO_BASELINES: {
  id: "BUDGET" | "AFTER_PRICE_CHANGE";
  kind: "BUDGET" | "FORECAST" | "BOARD" | "CUSTOM";
  stage: DemoStage;
  name: (startMonth: MonthKey) => string;
}[] = [
  {
    id: "BUDGET",
    kind: "BUDGET",
    stage: "SEED_PLAN",
    name: (startMonth) => `${startMonth.slice(0, 4)} budget`,
  },
  {
    id: "AFTER_PRICE_CHANGE",
    kind: "FORECAST",
    stage: "PRICING_UPDATE",
    name: () => "Forecast after the price change",
  },
];

function versusPlan(rate: number | null): string {
  if (rate === null || Math.abs(rate) < 0.0005) {
    return "on plan";
  }

  return `${(Math.abs(rate) * 100).toFixed(1)} percent ${rate > 0 ? "above" : "below"} plan`;
}

/**
 * The title and the text of the frozen board review. Every number in the text is calculated from
 * the results and the plan, so the review always says what the pages of the app show.
 */
export function buildDemoReview(
  actuals: ActualFinancialPeriod[],
  rows: ForecastAnalyticsRow[],
  timeline: DemoTimeline,
): { title: string; commentary: string } {
  const summary = calculateVarianceReport(actuals, rows).summary;

  let best = actuals[0];

  for (const actual of actuals) {
    if ((actual.revenue ?? 0) > (best.revenue ?? 0)) {
      best = actual;
    }
  }

  const cash =
    summary.latestCashActual === null
      ? "unknown"
      : `${(summary.latestCashActual / 1000000).toFixed(2)} million`;

  const cashRate =
    summary.latestCashForecast === null ||
    summary.latestCashForecast === 0 ||
    summary.latestCashVariance === null
      ? null
      : summary.latestCashVariance / summary.latestCashForecast;

  return {
    title: `Board review for ${monthName(timeline.latestActualMonth)}`,

    commentary:
      `Revenue is ${versusPlan(summary.revenueVarianceRate)} over the last ${summary.matchedPeriods} months, ` +
      `and ${monthName(best.period)} was the best month so far. ` +
      `EBITDA is ${versusPlan(summary.ebitdaVarianceRate)} because hiring came early. ` +
      `Cash is ${cash}, which is ${versusPlan(cashRate)}. ` +
      "The enterprise price and the data room for the Series A are the two open decisions.",
  };
}

export type DemoMonthSchedule = {
  month: string;

  /** The first export of the first month is wrong, so it is refused. */
  failedImportAt: Date | null;

  actualsImportAt: Date;

  commentaryImportAt: Date;

  closeAt: Date | null;
};

export type DemoSchedule = {
  usersCreatedAt: Date;

  workspaceCreatedAt: Date;

  membersAddedAt: Date;

  modelCreatedAt: Date;

  riskPolicyAt: Date;

  revisionAt: Record<DemoStage, Date>;

  baselineAt: Record<string, Date>;

  months: DemoMonthSchedule[];

  reopen: { requestedAt: Date; decidedAt: Date; reopenedAt: Date; closedAgainAt: Date };

  targetsRecentAt: Date;

  targetsCurrentAt: Date;

  reviewAt: Date;

  /** One entry for each decision of DEMO_DECISIONS, in the same order. */
  decisions: { createdAt: Date; changedAt: Date | null }[];

  /** One entry for each approval of DEMO_APPROVALS, in the same order. */
  approvals: { requestedAt: Date; decidedAt: Date | null }[];

  modelUpdatedAt: Date;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * When everything in the story happened. The services of the app write the time of the moment the
 * seed runs, so the seed moves each row back to its day afterwards. A time is never after "now".
 */
export function buildDemoSchedule(now: Date, timeline: DemoTimeline): DemoSchedule {
  const latest = now.getTime() - 30 * 60 * 1000;

  const clamp = (date: Date): Date => new Date(Math.min(date.getTime(), latest));

  const at = (month: string, day: number, hour = 9, minute = 0): Date => {
    const [year, number] = month.split("-").map(Number);

    return clamp(new Date(Date.UTC(year, number - 1, day, hour, minute)));
  };

  const daysAgo = (days: number, hour = 10, minute = 0): Date => {
    const date = new Date(now.getTime() - days * DAY);

    date.setUTCHours(hour, minute, 0, 0);

    return clamp(date);
  };

  const before = (date: Date, days: number): Date => new Date(date.getTime() - days * DAY);

  const after = (date: Date, days: number): Date => new Date(date.getTime() + days * DAY);

  const twoBefore = addMonths(timeline.startMonth, -2);

  const oneBefore = addMonths(timeline.startMonth, -1);

  const revisionAt: Record<DemoStage, Date> = {
    SEED_PLAN: at(oneBefore, 18, 10, 0),
    PRICING_UPDATE: at(timeline.actualMonths[3], 10, 14, 0),
    CURRENT: at(timeline.actualMonths[7], 4, 11, 30),
  };

  const months: DemoMonthSchedule[] = timeline.actualMonths.map((month, index) => {
    const next = addMonths(month, 1);

    return {
      month,
      failedImportAt: index === 0 ? at(next, 3, 8, 50) : null,
      actualsImportAt: at(next, 3, 9, 15),
      commentaryImportAt: at(next, 4, 11, 0),
      closeAt: index < timeline.closedMonths.length ? at(next, 5, 15, 30) : null,
    };
  });

  const marchClose = months[2].closeAt ?? at(timeline.actualMonths[3], 5, 15, 30);

  const hour = 60 * 60 * 1000;

  // Two weeks after the close. The request, the decision, the reopening and the second close all
  // happen on the same working day, as the note of the decision asks.
  const requestedAt = new Date(after(marchClose, 15).setUTCHours(10, 15, 0, 0));

  const decidedAt = new Date(requestedAt.getTime() + 2 * hour);

  const reopenedAt = new Date(decidedAt.getTime() + hour);

  const closedAgainAt = new Date(reopenedAt.getTime() + 3 * hour);

  return {
    usersCreatedAt: at(twoBefore, 10, 9, 0),
    workspaceCreatedAt: at(twoBefore, 10, 9, 30),
    membersAddedAt: at(twoBefore, 14, 10, 0),
    modelCreatedAt: at(oneBefore, 15, 11, 0),
    riskPolicyAt: at(oneBefore, 20, 16, 0),
    revisionAt,
    baselineAt: {
      BUDGET: after(revisionAt.SEED_PLAN, 1),
      AFTER_PRICE_CHANGE: after(revisionAt.PRICING_UPDATE, 1),
    },
    months,
    reopen: { requestedAt, decidedAt, reopenedAt, closedAgainAt },
    targetsRecentAt: at(timeline.actualMonths[6], 2, 10, 0),
    targetsCurrentAt: at(timeline.currentMonth, 2, 10, 30),
    reviewAt: at(timeline.currentMonth, 3, 16, 0),
    decisions: DEMO_DECISIONS.map((decision) => ({
      createdAt: daysAgo(decision.createdDaysAgo, 9, 40),
      changedAt: decision.changedDaysAgo === null ? null : daysAgo(decision.changedDaysAgo, 14, 5),
    })),
    approvals: [
      {
        requestedAt: before(revisionAt.PRICING_UPDATE, 2),
        decidedAt: before(revisionAt.PRICING_UPDATE, 1),
      },
      { requestedAt: daysAgo(40, 9, 10), decidedAt: daysAgo(38, 11, 45) },
      {
        requestedAt: before(months[8].actualsImportAt, 1),
        decidedAt: new Date(months[8].actualsImportAt.getTime() - 60 * 60 * 1000),
      },
      { requestedAt: daysAgo(6, 15, 20), decidedAt: null },
      { requestedAt: daysAgo(2, 10, 5), decidedAt: null },
    ],
    modelUpdatedAt: daysAgo(2, 17, 0),
  };
}

/** The day a decision is due: midnight (UTC) of the day that many days from today. */
export function demoDueDate(now: Date, dueInDays: number): Date {
  const date = new Date(now.getTime() + dueInDays * DAY);

  date.setUTCHours(0, 0, 0, 0);

  return date;
}

/** The one approval that lets a closed month be opened again, and the second close after it. */
export const DEMO_REOPEN = {
  /** The place of the month in the list of months with numbers, 2 is the third month. */
  monthIndex: 2,

  requestTitle: "Reopen {m2} to book a late supplier invoice",

  requestDescription:
    "A cloud invoice for {m2} arrived in {m3}. The cost has to be in the right month.",

  decisionNote: "Fine, but close it again the same day.",

  reopenReason: "A supplier invoice for {m2} arrived late.",

  closeAgainReason: "Late invoice booked, {m2} is final again.",

  closeReason: "Reviewed with the finance lead and signed off.",
};
