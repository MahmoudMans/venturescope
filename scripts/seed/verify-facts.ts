import { compare } from "bcryptjs";

import { prisma } from "@/lib/db/prisma";
import type { ActualFinancialPeriod } from "@/lib/finance/actuals/types";
import type { ForecastAnalyticsRow } from "@/lib/finance/analytics/types";
import {
  countCompletedAssumptionSections,
  parseStoredFinancialAssumptions,
} from "@/lib/finance/assumptions/storage";
import { parseExecutiveReviewSnapshot } from "@/lib/finance/board-room/validation";
import { generateFinancialForecast } from "@/lib/finance/engine";
import { buildFinancialModelInput } from "@/lib/finance/project-input";
import type { KpiMetricCode } from "@/lib/finance/scorecard/types";
import { dateToMonthInput } from "@/lib/projects/project-dates";
import {
  DEMO_MODEL_NAME_PREFIX,
  DEMO_PASSWORD,
  DEMO_PEOPLE,
  DEMO_PERSON_KEYS,
  DEMO_WORKSPACE_NAME,
} from "@/scripts/seed/demo-config";
import { demoForecastRows } from "@/scripts/seed/demo-data";
import type { DemoFacts } from "@/scripts/seed/verify-checks";

/**
 * Reads the demo company from the database into the plain facts that the checks test. It only
 * reads. Nothing is written.
 */

function toNumber(value: { toString(): string } | null): number | null {
  return value === null ? null : Number(value.toString());
}

function monthOf(date: Date): string {
  return dateToMonthInput(date);
}

export async function loadDemoFacts(today: Date = new Date()): Promise<DemoFacts> {
  const emails = DEMO_PERSON_KEYS.map((key) => DEMO_PEOPLE[key].email);

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, passwordHash: true },
  });

  const people: DemoFacts["people"] = [];

  for (const key of DEMO_PERSON_KEYS) {
    const user = users.find((candidate) => candidate.email === DEMO_PEOPLE[key].email);

    people.push({
      key,
      found: user !== undefined,
      passwordOk: user === undefined ? false : await compare(DEMO_PASSWORD, user.passwordHash),
    });
  }

  const owner = users.find((candidate) => candidate.email === DEMO_PEOPLE.owner.email);

  const emailOf = (id: string | null): string | null =>
    users.find((candidate) => candidate.id === id)?.email ?? null;

  const workspace =
    owner === undefined
      ? null
      : await prisma.workspace.findFirst({
          where: { name: DEMO_WORKSPACE_NAME, ownerId: owner.id },
          include: { members: { select: { userId: true, role: true } } },
        });

  const found =
    owner === undefined
      ? null
      : await prisma.project.findFirst({
          where: { userId: owner.id, name: { startsWith: DEMO_MODEL_NAME_PREFIX } },
          include: {
            financingEvents: { orderBy: { month: "asc" } },
            monthlyOverrides: { orderBy: [{ month: "asc" }, { createdAt: "asc" }] },
            scenarios: { orderBy: { createdAt: "asc" } },
          },
        });

  const empty: DemoFacts = {
    today,
    people,
    workspace: workspace === null ? null : { ownerEmail: emailOf(workspace.ownerId) },
    members: (workspace?.members ?? []).map((member) => ({
      email: emailOf(member.userId) ?? "unknown",
      role: member.role,
    })),
    model: null,
    versions: [],
    baselines: [],
    actuals: [],
    forecastRows: [],
    imports: [],
    riskPolicy: null,
    targets: [],
    commentaries: [],
    closedMonths: [],
    periodEvents: [],
    decisions: [],
    approvals: [],
    reviews: [],
    audit: { count: 0, categories: [], oldest: null, newest: null },
  };

  if (found === null) {
    return empty;
  }

  const projectId = found.id;

  const assumptions = parseStoredFinancialAssumptions(found.baseAssumptions);

  const baseScenario = found.scenarios.find((scenario) => scenario.type === "BASE");

  let forecastMonths = 0;

  let forecastFirstMonth: string | null = null;

  let forecastError: string | null = null;

  let endingCash: number | null = null;

  let forecastRows: ForecastAnalyticsRow[] = [];

  try {
    const forecast = generateFinancialForecast(buildFinancialModelInput(found, baseScenario));

    forecastMonths = forecast.months.length;

    forecastFirstMonth = forecast.months[0]?.month ?? null;

    endingCash = Number(forecast.metrics.endingCash);

    forecastRows = demoForecastRows(forecast);
  } catch (error) {
    forecastError = error instanceof Error ? error.message : String(error);
  }

  const [revisions, baselines, actualRows, batches, policy, targetRows, noteRows, states, events] =
    await Promise.all([
      prisma.projectRevision.findMany({
        where: { projectId },
        orderBy: { version: "asc" },
        select: { version: true, label: true, snapshot: true },
      }),
      prisma.forecastBaseline.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
        select: { name: true, kind: true },
      }),
      prisma.actualPeriod.findMany({ where: { projectId }, orderBy: { period: "asc" } }),
      prisma.dataImportBatch.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
        select: { fileName: true, status: true, rejectedCount: true },
      }),
      prisma.projectRiskPolicy.findUnique({ where: { projectId } }),
      prisma.projectKpiTarget.findMany({ where: { projectId }, orderBy: [{ periodKey: "asc" }] }),
      prisma.varianceCommentary.findMany({
        where: { projectId },
        select: { periodKey: true, status: true },
      }),
      prisma.financialPeriodState.findMany({ where: { projectId }, orderBy: { period: "asc" } }),
      prisma.financialPeriodEvent.findMany({
        where: { projectId },
        orderBy: [{ createdAt: "asc" }, { sequence: "asc" }],
        select: { period: true, action: true },
      }),
    ]);

  const [decisionRows, approvalRows, reviewRows, auditRows] = await Promise.all([
    prisma.decisionAction.findMany({
      where: { projectId },
      select: { status: true, dueDate: true },
    }),
    prisma.approvalRequest.findMany({
      where: { projectId },
      select: {
        status: true,
        requestType: true,
        requestedByUserId: true,
        decidedByUserId: true,
      },
    }),
    prisma.executiveReview.findMany({
      where: { projectId },
      select: { periodKey: true, snapshot: true },
    }),
    prisma.projectAuditEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: { category: true, createdAt: true },
    }),
  ]);

  const actuals: ActualFinancialPeriod[] = actualRows.map((row) => ({
    period: monthOf(row.period),
    revenue: toNumber(row.revenue),
    cogs: toNumber(row.cogs),
    operatingExpenses: toNumber(row.operatingExpenses),
    ebitda: toNumber(row.ebitda),
    netIncome: toNumber(row.netIncome),
    cashFlow: toNumber(row.cashFlow),
    cashBalance: toNumber(row.cashBalance),
    mrr: toNumber(row.mrr),
    customers: row.customers,
  }));

  const categories = [...new Set<string>(auditRows.map((row) => row.category))].sort();

  return {
    ...empty,

    model: {
      name: found.name,
      ownerEmail: emailOf(found.userId),
      inWorkspace: workspace !== null && found.workspaceId === workspace.id,
      startMonth: monthOf(found.startMonth),
      horizonMonths: found.horizonMonths,
      revisionSequence: found.revisionSequence,
      scenarioTypes: found.scenarios.map((scenario) => scenario.type),
      financingCount: found.financingEvents.length,
      overrideCount: found.monthlyOverrides.length,
      completeSections: countCompletedAssumptionSections(assumptions),
      forecastMonths,
      forecastFirstMonth,
      forecastError,
      endingCash,
    },

    versions: revisions.map((revision) => ({
      version: revision.version,
      label: revision.label,
      assumptionsKey: JSON.stringify(
        (revision.snapshot as { project?: { baseAssumptions?: unknown } } | null)?.project
          ?.baseAssumptions ?? null,
      ),
    })),

    baselines,

    actuals,

    forecastRows,

    imports: batches,

    riskPolicy:
      policy === null
        ? null
        : {
            minimumCash: toNumber(policy.minimumCash),
            minimumRunwayMonths: policy.minimumRunwayMonths,
            minimumEbitdaMargin: toNumber(policy.minimumEbitdaMargin),
            maximumMonthlyBurn: toNumber(policy.maximumMonthlyBurn),
            downsideRevenueShock: Number(policy.downsideRevenueShock.toString()),
            downsideCostInflation: Number(policy.downsideCostInflation.toString()),
          },

    targets: targetRows.map((row) => ({
      id: row.id,
      periodKey: row.periodKey,
      metricCode: row.metricCode as KpiMetricCode,
      targetValue: Number(row.targetValue.toString()),
      ownerName: row.ownerName,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      createdBy: null,
    })),

    commentaries: noteRows,

    closedMonths: states
      .filter((state) => state.status === "CLOSED")
      .map((state) => monthOf(state.period)),

    periodEvents: events.map((event) => ({ period: monthOf(event.period), action: event.action })),

    decisions: decisionRows,

    approvals: approvalRows.map((row) => ({
      status: row.status,
      requestType: row.requestType,
      requestedBy: row.requestedByUserId,
      decidedBy: row.decidedByUserId,
    })),

    reviews: reviewRows.map((row) => {
      let snapshotOk = true;

      try {
        parseExecutiveReviewSnapshot(row.snapshot);
      } catch {
        snapshotOk = false;
      }

      return { periodKey: row.periodKey, snapshotOk };
    }),

    audit: {
      count: auditRows.length,
      categories,
      oldest: auditRows[0]?.createdAt ?? null,
      newest: auditRows[auditRows.length - 1]?.createdAt ?? null,
    },
  };
}
