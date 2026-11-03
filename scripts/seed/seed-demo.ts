import { hash } from "bcryptjs";

import { applyGovernedDataImport } from "@/lib/data-import/service";
import type { DataImportType } from "@/lib/data-import/types";
import { prisma } from "@/lib/db/prisma";
import { createApprovalRequest, decideApprovalRequest } from "@/lib/approvals/service";
import { financialAssumptionsToJson } from "@/lib/finance/assumptions/storage";
import { createExecutiveReview } from "@/lib/finance/board-room/service";
import { buildExecutiveReviewSnapshot } from "@/lib/finance/board-room/snapshot";
import {
  createDecisionAction,
  updateDecisionActionStatus,
} from "@/lib/finance/decision-center/service";
import { closeFinancialPeriod, reopenFinancialPeriod } from "@/lib/finance/period-close/service";
import { financialPeriodDate } from "@/lib/finance/period-close/validation";
import { createForecastBaseline } from "@/lib/finance/planning-cycle/service";
import { parseProjectRiskPolicy } from "@/lib/finance/risk-center/policy";
import { saveProjectRiskPolicy } from "@/lib/finance/risk-center/service";
import { monthlyOverrideValuesToJson } from "@/lib/overrides/storage";
import { monthInputToUtcDate } from "@/lib/projects/project-dates";
import { DEFAULT_PROJECT_SCENARIOS } from "@/lib/projects/scenario-defaults";
import { createProjectRevision } from "@/lib/projects/versioning/service";
import { registerSchema } from "@/lib/validation/auth";
import {
  DEMO_PASSWORD,
  DEMO_PEOPLE,
  DEMO_PERSON_KEYS,
  DEMO_WORKSPACE_NAME,
  demoTimeline,
  type DemoPersonKey,
  type DemoTimeline,
} from "@/scripts/seed/demo-config";
import {
  buildDemoActuals,
  buildDemoModel,
  buildDemoReview,
  buildDemoSchedule,
  buildDemoTargets,
  demoActualPeriods,
  demoActualsCsv,
  demoBrokenActualsCsv,
  demoCommentaryCsv,
  demoDueDate,
  demoForecast,
  demoForecastRows,
  demoTargetsCsv,
  fillMonths,
  DEMO_APPROVALS,
  DEMO_BASELINES,
  DEMO_DECISIONS,
  DEMO_FILE_NAMES,
  DEMO_REOPEN,
  DEMO_REVISIONS,
  DEMO_RISK_POLICY_INPUT,
  DEMO_STAGES,
  type DemoActual,
  type DemoSchedule,
  type DemoStage,
} from "@/scripts/seed/demo-data";

/**
 * The seed writes the demo company into the database. It calls the same services as the pages of
 * the app (imports, saved versions, approvals, closing a month and so on), so the audit trail and
 * every rule are the real ones. Only a few rows are written directly: the accounts, the workspace
 * and the model itself.
 *
 * The database does not allow a change to the activity ledger, and not to the numbers of a closed
 * month. So the history is not moved to its days afterwards. Instead, before every step, the clock
 * that the app reads (see setClock) is set to the day the step happened in the story, and each row
 * and each event is written with that day from the start.
 */

export type SeedContext = {
  now: Date;

  timeline: DemoTimeline;

  schedule: DemoSchedule;

  log: (line: string) => void;

  /** Sets the clock that the app and the database client read. See seed.run.ts. */
  setClock: (date: Date) => void;

  /** True when setClock really changes the clock. Only then the seed can check that it works. */
  clockControlled: boolean;

  /** Things that did not work but do not stop the seed. */
  warnings: string[];

  userIds: Partial<Record<DemoPersonKey, string>>;

  workspaceId: string | null;

  projectId: string | null;

  revisionVersions: Partial<Record<DemoStage, number>>;

  revisionIds: Partial<Record<DemoStage, string>>;

  decisionIds: string[];

  approvalIds: string[];

  reopenApprovalId: string | null;

  reviewId: string | null;

  /** Rows made by the seed, for the printed summary. */
  made: Record<string, number>;
};

export function createSeedContext(
  now: Date = new Date(),
  log: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
  setClock?: (date: Date) => void,
): SeedContext {
  const timeline = demoTimeline(now);

  return {
    now,
    timeline,
    schedule: buildDemoSchedule(now, timeline),
    log,
    setClock: setClock ?? (() => undefined),
    clockControlled: setClock !== undefined,
    warnings: [],
    userIds: {},
    workspaceId: null,
    projectId: null,
    revisionVersions: {},
    revisionIds: {},
    decisionIds: [],
    approvalIds: [],
    reopenApprovalId: null,
    reviewId: null,
    made: {},
  };
}

function need<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`The seed needs ${what}, but that step did not run.`);
  }

  return value;
}

function person(ctx: SeedContext, key: DemoPersonKey): string {
  return need(ctx.userIds[key], `the demo account ${DEMO_PEOPLE[key].email}`);
}

function project(ctx: SeedContext): string {
  return need(ctx.projectId, "the demo model");
}

function count(ctx: SeedContext, name: string, amount = 1): void {
  ctx.made[name] = (ctx.made[name] ?? 0) + amount;
}

/** Sets the clock to the day and time that the next rows happened in the story. */
function clockTo(ctx: SeedContext, date: Date): void {
  ctx.setClock(date);
}

/**
 * Step 1. The demo accounts and everything they own are removed, so the seed can run again.
 *
 * Two rules of the database are respected here:
 * - The activity ledger (ProjectAuditEvent) can never be changed or deleted. The old events of the
 *   demo models stay in the table. They point to models that do not exist any more, so no page
 *   shows them.
 * - The numbers of a closed month cannot be deleted. The closed state of the months is removed
 *   first, and then the model and its numbers can go.
 */
export async function removeOldDemoData(ctx: SeedContext): Promise<number> {
  const emails = DEMO_PERSON_KEYS.map((key) => DEMO_PEOPLE[key].email);

  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });

  if (users.length === 0) {
    ctx.log("No old demo data found.");

    return 0;
  }

  const userIds = users.map((user) => user.id);

  const projects = await prisma.project.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });

  const projectIds = projects.map((item) => item.id);

  const keptEvents = await prisma.projectAuditEvent.count({
    where: { projectId: { in: projectIds } },
  });

  try {
    await prisma.$transaction([
      prisma.financialPeriodState.deleteMany({ where: { projectId: { in: projectIds } } }),
      prisma.workspace.deleteMany({ where: { ownerId: { in: userIds } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);
  } catch (error) {
    throw new Error(
      `The old demo data could not be removed: ${error instanceof Error ? error.message : String(error)}\n` +
        "To start again from an empty local database, run  docker compose down -v  and then  pnpm demo.",
    );
  }

  ctx.log(`Removed the old demo data (${userIds.length} accounts, ${projectIds.length} models).`);

  if (keptEvents > 0) {
    ctx.log(
      `Kept ${keptEvents} old activity events: the activity ledger cannot be changed. No page shows them.`,
    );
  }

  return userIds.length;
}

/**
 * Checks that a row written now carries the day of the story. This is the one thing the whole
 * approach stands on, so it is tested on the first account, before anything that cannot be
 * undone (an activity event) is written.
 */
async function checkClockWorks(ctx: SeedContext, userId: string): Promise<void> {
  if (ctx.clockControlled === false) {
    return;
  }

  const stored = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  const wanted = ctx.schedule.usersCreatedAt.getTime();

  if (stored === null || Math.abs(stored.createdAt.getTime() - wanted) > 5000) {
    throw new Error(
      "The database client does not use the clock of the seed for the dates of new rows. " +
        "Without it the activity events cannot be put on their days. " +
        "Nothing that cannot be removed was written yet, so you can run the seed again after a fix.",
    );
  }
}

/** Step 2. Three accounts with the same password. They are checked with the rules of Register. */
export async function createDemoPeople(ctx: SeedContext): Promise<void> {
  clockTo(ctx, ctx.schedule.usersCreatedAt);

  for (const key of DEMO_PERSON_KEYS) {
    const demo = DEMO_PEOPLE[key];

    const parsed = registerSchema.safeParse({
      name: demo.name,
      email: demo.email,
      password: DEMO_PASSWORD,
      confirmPassword: DEMO_PASSWORD,
    });

    if (parsed.success === false) {
      throw new Error(`The demo account ${demo.email} is not valid: ${parsed.error.message}`);
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
      select: { id: true },
    });

    ctx.userIds[key] = created.id;

    count(ctx, "accounts");

    if (key === DEMO_PERSON_KEYS[0]) {
      await checkClockWorks(ctx, created.id);
    }
  }

  ctx.log(`Created ${DEMO_PERSON_KEYS.length} accounts.`);
}

/** Step 3. One workspace. The founder owns it and the other two are members. */
export async function createDemoWorkspace(ctx: SeedContext): Promise<void> {
  clockTo(ctx, ctx.schedule.workspaceCreatedAt);

  const workspace = await prisma.workspace.create({
    data: {
      name: DEMO_WORKSPACE_NAME,
      ownerId: person(ctx, "owner"),
    },
    select: { id: true },
  });

  ctx.workspaceId = workspace.id;

  clockTo(ctx, ctx.schedule.membersAddedAt);

  for (const key of ["finance", "investor"] as const) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: person(ctx, key),
        role: DEMO_PEOPLE[key].role,
      },
    });

    count(ctx, "workspace members");
  }

  ctx.log(`Created the workspace "${DEMO_WORKSPACE_NAME}" with 2 members.`);
}

/** Step 4. The model, the way the sample button of the dashboard makes it, inside the workspace. */
export async function createDemoModel(ctx: SeedContext): Promise<void> {
  const model = buildDemoModel(ctx.timeline.startMonth, "SEED_PLAN");

  clockTo(ctx, ctx.schedule.modelCreatedAt);

  ctx.projectId = await prisma.$transaction(async (transaction) => {
    const created = await transaction.project.create({
      data: {
        userId: person(ctx, "owner"),

        workspaceId: need(ctx.workspaceId, "the demo workspace"),

        name: model.name,

        industry: model.industry,

        currency: model.currency,

        startMonth: monthInputToUtcDate(model.startMonth),

        horizonMonths: model.horizonMonths,

        revenueMode: model.revenueMode,

        baseAssumptions: financialAssumptionsToJson(model.assumptions),

        modelVersion: "1.0",

        scenarios: {
          create: DEFAULT_PROJECT_SCENARIOS.map((scenario) => ({
            name: scenario.name,

            type: scenario.type,

            modifiers: scenario.modifiers,
          })),
        },

        financingEvents: {
          create: model.financingEvents.map((event) => ({
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
        },
      },

      select: {
        id: true,

        scenarios: {
          select: {
            id: true,

            type: true,
          },
        },
      },
    });

    const scenarioIds = new Map(
      created.scenarios.map((scenario): [string, string] => [scenario.type, scenario.id]),
    );

    await transaction.monthlyOverride.createMany({
      data: model.overrides.map((override) => ({
        projectId: created.id,

        scenarioId:
          override.scenario === "ALL" ? null : (scenarioIds.get(override.scenario) ?? null),

        month: monthInputToUtcDate(override.month),

        values: monthlyOverrideValuesToJson(override.values),

        note: override.note === "" ? null : override.note,
      })),
    });

    return created.id;
  });

  count(ctx, "models");

  ctx.log(`Created the model "${model.name}" (starts ${model.startMonth}).`);
}

/** Saves the model as a version and remembers the number and the id. */
async function saveVersion(ctx: SeedContext, stage: DemoStage): Promise<void> {
  const saved = await createProjectRevision({
    projectId: project(ctx),

    actorUserId: person(ctx, "owner"),

    label: DEMO_REVISIONS[stage].label,

    reason: DEMO_REVISIONS[stage].reason,
  });

  ctx.revisionVersions[stage] = saved.version;

  ctx.revisionIds[stage] = saved.id;

  count(ctx, "saved versions");
}

/** Saves the plan of one stage as a baseline, if the story has a baseline for it. */
async function saveBaselines(ctx: SeedContext, stage: DemoStage): Promise<void> {
  for (const baseline of DEMO_BASELINES.filter((item) => item.stage === stage)) {
    const model = buildDemoModel(ctx.timeline.startMonth, stage);

    clockTo(ctx, ctx.schedule.baselineAt[baseline.id]);

    await createForecastBaseline({
      projectId: project(ctx),

      actorUserId: person(ctx, "owner"),

      name: baseline.name(ctx.timeline.startMonth),

      kind: baseline.kind,

      modelVersion: "1.0",

      rows: demoForecastRows(demoForecast(model)),
    });

    count(ctx, "baselines");
  }
}

/**
 * Step 5. The plan changes twice. Each stage is saved as a version, and two of them as a baseline,
 * so the version list, the comparison of versions and the planning cycle all have something to show.
 */
export async function saveDemoVersions(ctx: SeedContext): Promise<void> {
  for (const stage of DEMO_STAGES) {
    clockTo(ctx, ctx.schedule.revisionAt[stage]);

    if (stage !== "SEED_PLAN") {
      const model = buildDemoModel(ctx.timeline.startMonth, stage);

      await prisma.project.update({
        where: { id: project(ctx) },
        data: { baseAssumptions: financialAssumptionsToJson(model.assumptions) },
      });
    }

    await saveVersion(ctx, stage);

    await saveBaselines(ctx, stage);
  }

  ctx.log("Saved 3 versions of the plan and 2 baselines.");
}

/** Step 6. The rules of the company for cash, runway and margin. */
export async function saveDemoRiskRules(ctx: SeedContext): Promise<void> {
  clockTo(ctx, ctx.schedule.riskPolicyAt);

  await saveProjectRiskPolicy({
    projectId: project(ctx),

    actorUserId: person(ctx, "owner"),

    policy: parseProjectRiskPolicy(DEMO_RISK_POLICY_INPUT),
  });

  ctx.log("Saved the risk rules.");
}

/** Runs one import on the given day. A refused file is an error of the caller. */
async function runImport({
  ctx,
  at,
  actor,
  importType,
  fileName,
  csv,
}: {
  ctx: SeedContext;

  at: Date;

  actor: DemoPersonKey;

  importType: DataImportType;

  fileName: string;

  csv: string;
}): Promise<void> {
  clockTo(ctx, at);

  await applyGovernedDataImport({
    projectId: project(ctx),

    actorUserId: person(ctx, actor),

    importType,

    fileName,

    csv,
  });

  count(ctx, "imports");
}

/** Computes the story of the actual results once, so every step uses the same numbers. */
export function demoActualsFor(ctx: SeedContext): DemoActual[] {
  const model = buildDemoModel(ctx.timeline.startMonth, "CURRENT");

  return buildDemoActuals(demoForecast(model), ctx.timeline.actualMonths, model.assumptions);
}

/**
 * Step 7. One import for each month, like a finance lead who loads the numbers every month. The
 * very first file is wrong and is refused, then the right one is loaded. After a month with notes
 * (explanations of the variances) the notes are loaded, and the older months are closed.
 */
export async function importDemoMonths(ctx: SeedContext): Promise<void> {
  const actuals = demoActualsFor(ctx);

  const days = ctx.schedule.months;

  let refused = false;

  try {
    await runImport({
      ctx,
      at: days[0].failedImportAt ?? days[0].actualsImportAt,
      actor: "finance",
      importType: "ACTUALS",
      fileName: DEMO_FILE_NAMES.brokenActuals,
      csv: demoBrokenActualsCsv(ctx.timeline.actualMonths),
    });
  } catch (error) {
    refused = error instanceof Error && error.message.includes("validation issue");

    if (refused === false) {
      throw error;
    }
  }

  if (refused === false) {
    throw new Error("The wrong demo file was accepted by the import, which should never happen.");
  }

  count(ctx, "refused imports");

  for (const [index, actual] of actuals.entries()) {
    const day = days[index];

    await runImport({
      ctx,
      at: day.actualsImportAt,
      actor: "finance",
      importType: "ACTUALS",
      fileName: DEMO_FILE_NAMES.actuals(actual.period),
      csv: demoActualsCsv([actual]),
    });

    const notes = demoCommentaryCsv(ctx.timeline, index);

    if (notes !== null) {
      await runImport({
        ctx,
        at: day.commentaryImportAt,
        actor: "finance",
        importType: "VARIANCE_COMMENTARY",
        fileName: DEMO_FILE_NAMES.commentary(actual.period),
        csv: notes,
      });
    }

    if (index < ctx.timeline.closedMonths.length) {
      clockTo(ctx, day.closeAt ?? day.commentaryImportAt);

      await closeFinancialPeriod({
        projectId: project(ctx),

        actorUserId: person(ctx, "owner"),

        period: financialPeriodDate(actual.period),

        periodKey: actual.period,

        reason: DEMO_REOPEN.closeReason,
      });

      count(ctx, "closed months");
    }
  }

  ctx.log(
    `Imported ${actuals.length} months (and one refused file), loaded the variance notes and closed ${ctx.timeline.closedMonths.length} months.`,
  );
}

/** Step 8. The goals for the last three months and for the month that is running now. */
export async function importDemoGoals(ctx: SeedContext): Promise<void> {
  const model = buildDemoModel(ctx.timeline.startMonth, "CURRENT");

  const rows = demoForecastRows(demoForecast(model));

  const targets = buildDemoTargets(rows, ctx.timeline);

  const current = targets.filter((target) => target.periodKey === ctx.timeline.currentMonth);

  const recent = targets.filter((target) => target.periodKey !== ctx.timeline.currentMonth);

  await runImport({
    ctx,
    at: ctx.schedule.targetsRecentAt,
    actor: "owner",
    importType: "KPI_TARGETS",
    fileName: DEMO_FILE_NAMES.targetsRecent,
    csv: demoTargetsCsv(recent),
  });

  await runImport({
    ctx,
    at: ctx.schedule.targetsCurrentAt,
    actor: "owner",
    importType: "KPI_TARGETS",
    fileName: DEMO_FILE_NAMES.targetsCurrent,
    csv: demoTargetsCsv(current),
  });

  count(ctx, "goals", targets.length);

  ctx.log(`Loaded ${targets.length} goals.`);
}

/** Step 9. The third month is opened again for a late invoice, with an approval, and closed again. */
export async function reopenDemoMonth(ctx: SeedContext): Promise<void> {
  const month = ctx.timeline.actualMonths[DEMO_REOPEN.monthIndex];

  const reopen = ctx.schedule.reopen;

  clockTo(ctx, reopen.requestedAt);

  const request = await createApprovalRequest({
    projectId: project(ctx),

    actorUserId: person(ctx, "finance"),

    requestType: "FINANCIAL_PERIOD_REOPEN",

    subjectType: "FinancialPeriod",

    subjectId: month,

    title: fillMonths(DEMO_REOPEN.requestTitle, ctx.timeline),

    description: fillMonths(DEMO_REOPEN.requestDescription, ctx.timeline),
  });

  ctx.reopenApprovalId = request.id;

  clockTo(ctx, reopen.decidedAt);

  await decideApprovalRequest({
    projectId: project(ctx),

    requestId: request.id,

    actorUserId: person(ctx, "owner"),

    decision: "APPROVE",

    decisionNote: DEMO_REOPEN.decisionNote,
  });

  clockTo(ctx, reopen.reopenedAt);

  await reopenFinancialPeriod({
    projectId: project(ctx),

    actorUserId: person(ctx, "owner"),

    period: financialPeriodDate(month),

    periodKey: month,

    reason: fillMonths(DEMO_REOPEN.reopenReason, ctx.timeline),
  });

  clockTo(ctx, reopen.closedAgainAt);

  await closeFinancialPeriod({
    projectId: project(ctx),

    actorUserId: person(ctx, "owner"),

    period: financialPeriodDate(month),

    periodKey: month,

    reason: fillMonths(DEMO_REOPEN.closeAgainReason, ctx.timeline),
  });

  count(ctx, "approvals");

  ctx.log(`Reopened and closed ${month} again with an approval.`);
}

/** Step 10. The list of decisions, with every status the page knows. */
export async function createDemoDecisions(ctx: SeedContext): Promise<void> {
  for (const [index, decision] of DEMO_DECISIONS.entries()) {
    const actor = decision.createdBy;

    const day = ctx.schedule.decisions[index];

    clockTo(ctx, day.createdAt);

    const created = await createDecisionAction({
      projectId: project(ctx),

      actorUserId: person(ctx, actor),

      title: fillMonths(decision.title, ctx.timeline),

      details: fillMonths(decision.details, ctx.timeline),

      sourceCode: decision.sourceCode,

      priority: decision.priority,

      ownerName: decision.ownerName,

      dueDate: demoDueDate(ctx.now, decision.dueInDays),
    });

    ctx.decisionIds.push(created.id);

    if (decision.finalStatus !== "OPEN") {
      clockTo(ctx, day.changedAt ?? day.createdAt);

      await updateDecisionActionStatus({
        projectId: project(ctx),

        actionId: created.id,

        actorUserId: person(ctx, actor),

        status: decision.finalStatus,
      });
    }

    count(ctx, "decisions");
  }

  ctx.log(`Created ${DEMO_DECISIONS.length} decisions.`);
}

/** Step 11. The board review of the latest month, frozen with the numbers of that day. */
export async function freezeDemoReview(ctx: SeedContext): Promise<void> {
  const model = buildDemoModel(ctx.timeline.startMonth, "CURRENT");

  const rows = demoForecastRows(demoForecast(model));

  const actuals = demoActualPeriods(demoActualsFor(ctx));

  const latest = actuals[actuals.length - 1];

  const snapshot = buildExecutiveReviewSnapshot({
    capturedAt: ctx.schedule.reviewAt.toISOString(),

    actuals,

    forecasts: rows,

    riskPolicy: parseProjectRiskPolicy(DEMO_RISK_POLICY_INPUT),

    latestActualPeriod: latest.period,

    latestActualCash: latest.cashBalance,

    actions: DEMO_DECISIONS.map((decision) => ({
      status: decision.finalStatus,

      priority: decision.priority,

      dueDate: demoDueDate(ctx.now, decision.dueInDays).toISOString(),
    })),
  });

  const text = buildDemoReview(actuals, rows, ctx.timeline);

  clockTo(ctx, ctx.schedule.reviewAt);

  const review = await createExecutiveReview({
    projectId: project(ctx),

    actorUserId: person(ctx, "owner"),

    periodKey: latest.period,

    title: text.title,

    commentary: text.commentary,

    modelVersion: "1.0",

    snapshot,
  });

  ctx.reviewId = review.id;

  count(ctx, "board reviews");

  ctx.log(`Froze the board review "${text.title}".`);
}

/** Step 12. Requests from the finance lead. The founder decides three of them. */
export async function createDemoApprovals(ctx: SeedContext): Promise<void> {
  for (const [index, approval] of DEMO_APPROVALS.entries()) {
    const day = ctx.schedule.approvals[index];

    let subjectType: string | null = null;

    let subjectId: string | null = null;

    if (approval.subject === "REVISION_PRICING") {
      subjectType = "ProjectRevision";

      subjectId = need(ctx.revisionIds.PRICING_UPDATE, "the saved version Pricing update");
    }

    if (approval.subject === "REVIEW") {
      subjectType = "ExecutiveReview";

      subjectId = need(ctx.reviewId, "the board review");
    }

    clockTo(ctx, day.requestedAt);

    const request = await createApprovalRequest({
      projectId: project(ctx),

      actorUserId: person(ctx, "finance"),

      requestType: approval.requestType,

      subjectType,

      subjectId,

      title: fillMonths(approval.title, ctx.timeline),

      description: fillMonths(approval.description, ctx.timeline),
    });

    ctx.approvalIds.push(request.id);

    if (approval.decision !== "PENDING") {
      clockTo(ctx, day.decidedAt ?? day.requestedAt);

      await decideApprovalRequest({
        projectId: project(ctx),

        requestId: request.id,

        actorUserId: person(ctx, "owner"),

        decision: approval.decision,

        decisionNote: approval.decisionNote,
      });
    }

    count(ctx, "approvals");
  }

  ctx.log(`Created ${DEMO_APPROVALS.length} approval requests.`);
}

/**
 * Step 13. The model was edited two days ago, so the dashboard shows it as recently active. The
 * date of the last edit is the only thing this step changes.
 */
export async function touchDemoModel(ctx: SeedContext): Promise<void> {
  clockTo(ctx, ctx.schedule.modelUpdatedAt);

  await prisma.project.update({
    where: { id: project(ctx) },
    data: { industry: buildDemoModel(ctx.timeline.startMonth, "CURRENT").industry },
  });

  ctx.log("Set the date of the last edit of the model.");
}

/** Runs every step in order. The run files call the steps one by one to print the progress. */
export async function seedDemoData(ctx: SeedContext = createSeedContext()): Promise<SeedContext> {
  await removeOldDemoData(ctx);

  await createDemoPeople(ctx);

  await createDemoWorkspace(ctx);

  await createDemoModel(ctx);

  await saveDemoVersions(ctx);

  await saveDemoRiskRules(ctx);

  await importDemoMonths(ctx);

  await importDemoGoals(ctx);

  await reopenDemoMonth(ctx);

  await createDemoDecisions(ctx);

  await freezeDemoReview(ctx);

  await createDemoApprovals(ctx);

  await touchDemoModel(ctx);

  clockTo(ctx, ctx.now);

  return ctx;
}

/** The lines printed at the end of the seed: what was written, and what did not go as planned. */
export function summarizeSeed(ctx: SeedContext): string[] {
  const lines = ["What was written:"];

  for (const [name, amount] of Object.entries(ctx.made)) {
    lines.push(`  ${String(amount).padStart(4)}  ${name}`);
  }

  for (const warning of ctx.warnings) {
    lines.push(`  Warning: ${warning}`);
  }

  return lines;
}
