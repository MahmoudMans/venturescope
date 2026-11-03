import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  BoardPackWorkspace,
} from "@/components/board-pack/board-pack-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  DEFAULT_PROJECT_RISK_POLICY,
} from "@/lib/finance/risk-center/policy";

import {
  parseKpiMetricCode,
} from "@/lib/finance/scorecard/metrics";

import {
  parseVarianceCauseCode,
  parseVarianceCommentaryStatus,
  parseVarianceMetricCode,
  parseVarianceNature,
} from "@/lib/finance/variance-review/metrics";

import {
  financialPeriodKeyFromDate,
  parseFinancialPeriodStatus,
} from "@/lib/finance/period-close/validation";

import {
  parseExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/validation";

import {
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Board Pack",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


function decimalNumber(
  value:
    {
      toString():
        string;
    } |
    null,
): number |
  null {
  return value ===
    null
    ?
      null
    :
      Number(
        value.toString(),
      );
}


export default async function BoardPackPage({
  params,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;
}) {
  const user =
    await requireCurrentUserIdentity();


  const {
    projectId,
  } =
    await params;


  const project =
    await getOwnedProject(
      user.id,
      projectId,
    );


  if (
    !project
  ) {
    notFound();
  }


  const generatedAt =
    new Date()
      .toISOString();


  const [
    storedActuals,
    storedPolicy,
    storedTargets,
    storedCommentaries,
    storedStates,
    storedActions,
    latestReview,
    auditTotal,
    auditWarning,
    auditCritical,
  ] =
    await Promise.all([
      prisma.actualPeriod.findMany({
        where: {
          projectId,
        },

        orderBy: {
          period:
            "asc",
        },
      }),

      prisma.projectRiskPolicy.findUnique({
        where: {
          projectId,
        },
      }),

      prisma.projectKpiTarget.findMany({
        where: {
          projectId,
        },

        include: {
          createdBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },
        },

        orderBy: [
          {
            periodKey:
              "desc",
          },

          {
            metricCode:
              "asc",
          },
        ],

        take:
          120,
      }),

      prisma.varianceCommentary.findMany({
        where: {
          projectId,
        },

        include: {
          createdBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },
        },

        orderBy: [
          {
            periodKey:
              "desc",
          },

          {
            metricCode:
              "asc",
          },
        ],

        take:
          1000,
      }),

      prisma.financialPeriodState.findMany({
        where: {
          projectId,
        },

        orderBy: {
          period:
            "desc",
        },
      }),

      prisma.decisionAction.findMany({
        where: {
          projectId,
        },

        orderBy: [
          {
            createdAt:
              "desc",
          },
        ],

        take:
          100,
      }),

      prisma.executiveReview.findFirst({
        where: {
          projectId,
        },

        include: {
          createdBy: {
            select: {
              name:
                true,

              email:
                true,
            },
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),

      prisma.projectAuditEvent.count({
        where: {
          projectId,
        },
      }),

      prisma.projectAuditEvent.count({
        where: {
          projectId,

          severity:
            "WARNING",
        },
      }),

      prisma.projectAuditEvent.count({
        where: {
          projectId,

          severity:
            "CRITICAL",
        },
      }),
    ]);


  const actuals =
    storedActuals.map(
      (
        row,
      ) => ({
        period:
          financialPeriodKeyFromDate(
            row.period,
          ),

        revenue:
          decimalNumber(
            row.revenue,
          ),

        cogs:
          decimalNumber(
            row.cogs,
          ),

        operatingExpenses:
          decimalNumber(
            row.operatingExpenses,
          ),

        ebitda:
          decimalNumber(
            row.ebitda,
          ),

        netIncome:
          decimalNumber(
            row.netIncome,
          ),

        cashFlow:
          decimalNumber(
            row.cashFlow,
          ),

        cashBalance:
          decimalNumber(
            row.cashBalance,
          ),

        mrr:
          decimalNumber(
            row.mrr,
          ),

        customers:
          row.customers,
      }),
    );


  const riskPolicy =
    storedPolicy
      ?
        {
          minimumCash:
            decimalNumber(
              storedPolicy.minimumCash,
            ),

          minimumRunwayMonths:
            storedPolicy.minimumRunwayMonths,

          minimumEbitdaMargin:
            decimalNumber(
              storedPolicy.minimumEbitdaMargin,
            ),

          maximumMonthlyBurn:
            decimalNumber(
              storedPolicy.maximumMonthlyBurn,
            ),

          downsideRevenueShock:
            Number(
              storedPolicy
                .downsideRevenueShock
                .toString(),
            ),

          downsideCostInflation:
            Number(
              storedPolicy
                .downsideCostInflation
                .toString(),
            ),
        }
      :
        DEFAULT_PROJECT_RISK_POLICY;


  const latestActual =
    actuals[
      actuals.length -
      1
    ] ??
    null;


  const targets =
    storedTargets.map(
      (
        target,
      ) => ({
        id:
          target.id,

        periodKey:
          target.periodKey,

        metricCode:
          parseKpiMetricCode(
            target.metricCode,
          ),

        targetValue:
          Number(
            target.targetValue
              .toString(),
          ),

        ownerName:
          target.ownerName,

        note:
          target.note,

        createdAt:
          target.createdAt
            .toISOString(),

        updatedAt:
          target.updatedAt
            .toISOString(),

        createdBy:
          target.createdBy?.name ??
          target.createdBy?.email ??
          null,
      }),
    );


  const commentaries =
    storedCommentaries.map(
      (
        commentary,
      ) => ({
        id:
          commentary.id,

        periodKey:
          commentary.periodKey,

        metricCode:
          parseVarianceMetricCode(
            commentary.metricCode,
          ),

        causeCode:
          parseVarianceCauseCode(
            commentary.causeCode,
          ),

        varianceNature:
          parseVarianceNature(
            commentary.varianceNature,
          ),

        explanation:
          commentary.explanation,

        correctiveAction:
          commentary.correctiveAction,

        ownerName:
          commentary.ownerName,

        recoveryPeriodKey:
          commentary.recoveryPeriodKey,

        status:
          parseVarianceCommentaryStatus(
            commentary.status,
          ),

        createdAt:
          commentary.createdAt
            .toISOString(),

        updatedAt:
          commentary.updatedAt
            .toISOString(),

        createdBy:
          commentary.createdBy?.name ??
          commentary.createdBy?.email ??
          null,
      }),
    );


  const periodStates =
    storedStates.map(
      (
        state,
      ) => ({
        id:
          state.id,

        periodKey:
          financialPeriodKeyFromDate(
            state.period,
          ),

        status:
          parseFinancialPeriodStatus(
            state.status,
          ),

        closeSequence:
          state.closeSequence,

        closedAt:
          state.closedAt
            ?.toISOString() ??
          null,

        closedByUserId:
          state.closedByUserId,

        reopenedAt:
          state.reopenedAt
            ?.toISOString() ??
          null,

        reopenedByUserId:
          state.reopenedByUserId,
      }),
    );


  const actions =
    storedActions.map(
      (
        action,
      ) => ({
        id:
          action.id,

        title:
          action.title,

        priority:
          action.priority,

        status:
          action.status,

        ownerName:
          action.ownerName,

        dueDate:
          action.dueDate
            ?.toISOString() ??
          null,

        sourceCode:
          action.sourceCode,
      }),
    );


  const defaultReportPeriod =
    latestActual?.period ??
    generatedAt.slice(
      0,
      7,
    );


  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header className="board-pack-print-hidden">
        <p className="text-sm font-medium text-muted-foreground">
          Executive reporting
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Board Pack
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Assemble VentureScope&apos;s existing financial, operating, governance, and management intelligence into a board-ready reporting package that can be printed or saved as PDF.
        </p>
      </header>

      <BoardPackWorkspace
        projectId={
          projectId
        }
        projectName={
          project.name
        }
        currency={
          project.currency
        }
        modelVersion={
          project.modelVersion
        }
        generatedAt={
          generatedAt
        }
        defaultReportPeriod={
          defaultReportPeriod
        }
        actuals={
          actuals
        }
        riskPolicy={
          riskPolicy
        }
        latestActualPeriod={
          latestActual?.period ??
          null
        }
        latestActualCash={
          latestActual?.cashBalance ??
          null
        }
        targets={
          targets
        }
        commentaries={
          commentaries
        }
        periodStates={
          periodStates
        }
        actions={
          actions
        }
        latestReview={
          latestReview
            ?
              {
                id:
                  latestReview.id,

                periodKey:
                  latestReview.periodKey,

                title:
                  latestReview.title,

                modelVersion:
                  latestReview.modelVersion,

                createdAt:
                  latestReview.createdAt
                    .toISOString(),

                createdBy:
                  latestReview.createdBy?.name ??
                  latestReview.createdBy?.email ??
                  null,

                snapshot:
                  parseExecutiveReviewSnapshot(
                    latestReview.snapshot,
                  ),
              }
            :
              null
        }
        auditSummary={{
          total:
            auditTotal,

          warning:
            auditWarning,

          critical:
            auditCritical,
        }}
      />
    </div>
  );
}
