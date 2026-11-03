import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  BoardRoomWorkspace,
} from "@/components/board-room/board-room-workspace";

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
  parseExecutiveReviewSnapshot,
} from "@/lib/finance/board-room/validation";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Board Room",

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


export default async function BoardRoomPage({
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

      period?:
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


  const liveCapturedAt =
    new Date()
      .toISOString();


  const [
    editableProject,
    storedActuals,
    storedPolicy,
    storedActions,
    storedReviews,
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

        select: {
          status:
            true,

          priority:
            true,

          dueDate:
            true,
        },
      }),

      prisma.executiveReview.findMany({
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

        take:
          48,
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


  const reviews =
    storedReviews.map(
      (
        review,
      ) => ({
        id:
          review.id,

        periodKey:
          review.periodKey,

        title:
          review.title,

        commentary:
          review.commentary,

        modelVersion:
          review.modelVersion,

        createdAt:
          review.createdAt
            .toISOString(),

        createdBy:
          review.createdBy?.name ??
          review.createdBy?.email ??
          null,

        snapshot:
          parseExecutiveReviewSnapshot(
            review.snapshot,
          ),
      }),
    );


  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Governance &amp; executive review
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Board Room
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Run executive financial reviews, freeze historical management snapshots, and compare prior board-level assessments with the live VentureScope model.
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
                      `Executive review for ${status.period ?? ""} was frozen successfully.`
                    :
                      status.message ??
                      "The Board Room operation could not be completed."
                }
              </div>
            )
          :
            null
      }

      <BoardRoomWorkspace
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
        actionStates={
          storedActions.map(
            (
              action,
            ) => ({
              status:
                action.status,

              priority:
                action.priority,

              dueDate:
                action.dueDate
                  ?.toISOString() ??
                null,
            }),
          )
        }
        reviews={
          reviews
        }
        liveCapturedAt={
          liveCapturedAt
        }
      />
    </div>
  );
}
