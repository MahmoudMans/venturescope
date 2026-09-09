import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  AlertInboxWorkspace,
} from "@/components/alerts/alert-inbox-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  parseProjectAuditSeverity,
} from "@/lib/audit/catalog";

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
  getOwnedProject,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Alert Inbox",

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


export default async function AlertInboxPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      projectId:
        string;
    }>;

  searchParams:
    Promise<{
      status?:
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


  const [
    storedActuals,
    storedPolicy,
    storedTargets,
    storedCommentaries,
    storedStates,
    storedActions,
    storedAuditEvents,
    storedReceipts,
    status,
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

        orderBy: [
          {
            periodKey:
              "asc",
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

        orderBy: [
          {
            periodKey:
              "asc",
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
            "asc",
        },
      }),

      prisma.decisionAction.findMany({
        where: {
          projectId,
        },

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          200,
      }),

      prisma.projectAuditEvent.findMany({
        where: {
          projectId,

          severity: {
            in: [
              "WARNING",
              "CRITICAL",
            ],
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          30,
      }),

      prisma.projectAlertReceipt.findMany({
        where: {
          projectId,

          userId:
            user.id,
        },

        orderBy: {
          updatedAt:
            "desc",
        },

        take:
          200,
      }),

      searchParams,
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


  const latestActual =
    actuals[
      actuals.length -
      1
    ] ??
    null;


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
      }),
    );


  const auditEvents =
    storedAuditEvents.flatMap(
      (
        event,
      ) => {
        const severity =
          parseProjectAuditSeverity(
            event.severity,
          );


        if (
          severity !==
            "WARNING" &&
          severity !==
            "CRITICAL"
        ) {
          return [];
        }


        return [
          {
            id:
              event.id,

            action:
              event.action,

            severity,

            summary:
              event.summary,

            createdAt:
              event.createdAt
                .toISOString(),
          },
        ];
      },
    );


  const receipts =
    storedReceipts.map(
      (
        receipt,
      ) => ({
        id:
          receipt.id,

        alertKey:
          receipt.alertKey,

        fingerprint:
          receipt.fingerprint,

        readAt:
          receipt.readAt
            ?.toISOString() ??
          null,

        dismissedAt:
          receipt.dismissedAt
            ?.toISOString() ??
          null,

        snoozedUntil:
          receipt.snoozedUntil
            ?.toISOString() ??
          null,

        updatedAt:
          receipt.updatedAt
            .toISOString(),
      }),
    );


  const generatedAt =
    new Date()
      .toISOString();


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Management notifications
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Alert Inbox
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
          Surface current management exceptions across liquidity, funding, actions, KPIs, variance review, forecast reliability, financial close, and governance events without duplicating their underlying authorities.
        </p>
      </header>

      {
        status.status
          ?
            (
              <div
                role="status"
                className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
              >
                {
                  status.status ===
                    "all-read"
                    ?
                      "All active alerts were marked as read."
                    :
                      "Alert inbox state updated."
                }
              </div>
            )
          :
            null
      }

      <AlertInboxWorkspace
        projectId={
          projectId
        }
        currency={
          project.currency
        }
        generatedAt={
          generatedAt
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
        auditEvents={
          auditEvents
        }
        receipts={
          receipts
        }
      />
    </main>
  );
}
