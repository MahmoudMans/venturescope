import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  VarianceReviewWorkspace,
} from "@/components/variance-review/variance-review-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  parseVarianceCauseCode,
  parseVarianceCommentaryStatus,
  parseVarianceMetricCode,
  parseVarianceNature,
} from "@/lib/finance/variance-review/metrics";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Variance Review",

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


export default async function VarianceReviewPage({
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
    storedCommentaries,
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


  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Monthly performance review
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Variance Commentary
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Explain why Actuals differed from Forecast, classify root causes, assign corrective actions, and track expected recovery through the monthly management-review cycle.
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
                    "saved"
                    ?
                      "Variance explanation saved successfully."
                    :
                  status.status ===
                    "deleted"
                    ?
                      "Variance explanation deleted successfully."
                    :
                      status.message ??
                      "The Variance Review operation could not be completed."
                }
              </div>
            )
          :
            null
      }

      <VarianceReviewWorkspace
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
        commentaries={
          commentaries
        }
      />
    </div>
  );
}
