import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  DecisionCenterWorkspace,
} from "@/components/decision-center/decision-center-workspace";

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
  parseDecisionPriority,
  parseDecisionSourceCode,
  parseDecisionStatus,
} from "@/lib/finance/decision-center/validation";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Executive Decision Center",

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


export default async function DecisionCenterPage({
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

      message?:
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
    editableProject,
    storedActuals,
    storedPolicy,
    storedActions,
    status,
  ] =
    await Promise.all([
      getProjectForEditor(
        user.id,
        projectId,
      ),

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

      prisma.decisionAction.findMany({
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
            createdAt:
              "desc",
          },
        ],

        take:
          100,
      }),

      searchParams,
    ]);


  const actuals =
    storedActuals.map(
      (
        row,
      ) => ({
        period:
          `${row.period
            .getUTCFullYear()
            .toString()
            .padStart(
              4,
              "0",
            )}-${(
            row.period.getUTCMonth() +
            1
          )
            .toString()
            .padStart(
              2,
              "0",
            )}`,

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


  const actions =
    storedActions.map(
      (
        action,
      ) => ({
        id:
          action.id,

        title:
          action.title,

        details:
          action.details,

        sourceCode:
          action.sourceCode
            ?
              parseDecisionSourceCode(
                action.sourceCode,
              )
            :
              null,

        priority:
          parseDecisionPriority(
            action.priority,
          ),

        status:
          parseDecisionStatus(
            action.status,
          ),

        ownerName:
          action.ownerName,

        dueDate:
          action.dueDate
            ?.toISOString() ??
          null,

        createdAt:
          action.createdAt
            .toISOString(),

        createdBy:
          action.createdBy?.name ??
          action.createdBy?.email ??
          null,
      }),
    );


  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Executive management
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Executive Decision Center
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Convert financial exceptions into prioritized management decisions and track accountable actions through completion.
        </p>
      </header>

      {
        status.status
          ?
            (
              <div
                role={
                  status.status ===
                    "error"
                    ?
                      "alert"
                    :
                      "status"
                }
                className="rounded-xl border bg-muted/30 px-4 py-3 text-sm"
              >
                {
                  status.status ===
                    "created"
                    ?
                      "Management action created successfully."
                    :
                  status.status ===
                    "updated"
                    ?
                      "Management action status updated successfully."
                    :
                      status.message ??
                      "The Decision Center operation could not be completed."
                }
              </div>
            )
          :
            null
      }

      <DecisionCenterWorkspace
        projectId={
          projectId
        }
        currency={
          project.currency
        }
        editable={
          Boolean(
            editableProject,
          )
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
        actions={
          actions
        }
      />
    </main>
  );
}
