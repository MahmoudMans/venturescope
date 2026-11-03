import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  PeriodCloseWorkspace,
} from "@/components/period-close/period-close-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  isProjectWorkspaceOwner,
} from "@/lib/finance/period-close/access";

import {
  buildFinancialPeriodRegister,
} from "@/lib/finance/period-close/register";

import {
  parseFinancialPeriodEventAction,
  parseFinancialPeriodStatus,
} from "@/lib/finance/period-close/validation";

import {
  financialPeriodKeyFromDate,
} from "@/lib/finance/period-close/validation";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Financial Close",

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


export default async function PeriodClosePage({
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


  const [
    editableProject,
    owner,
    actuals,
    states,
    storedEvents,
    status,
  ] =
    await Promise.all([
      getProjectForEditor(
        user.id,
        projectId,
      ),

      isProjectWorkspaceOwner(
        user.id,
        projectId,
      ),

      prisma.actualPeriod.findMany({
        where: {
          projectId,
        },

        orderBy: {
          period:
            "desc",
        },

        select: {
          period:
            true,

          revenue:
            true,

          ebitda:
            true,

          cashBalance:
            true,
        },
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

      prisma.financialPeriodEvent.findMany({
        where: {
          projectId,
        },

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          250,
      }),

      searchParams,
    ]);


  const register =
    buildFinancialPeriodRegister({
      actuals:
        actuals.map(
          (
            actual,
          ) => ({
            periodKey:
              financialPeriodKeyFromDate(
                actual.period,
              ),

            revenue:
              decimalNumber(
                actual.revenue,
              ),

            ebitda:
              decimalNumber(
                actual.ebitda,
              ),

            cashBalance:
              decimalNumber(
                actual.cashBalance,
              ),
          }),
        ),

      states:
        states.map(
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
        ),
    });


  const events =
    storedEvents.map(
      (
        event,
      ) => ({
        id:
          event.id,

        periodKey:
          financialPeriodKeyFromDate(
            event.period,
          ),

        action:
          parseFinancialPeriodEventAction(
            event.action,
          ),

        actorUserId:
          event.actorUserId,

        reason:
          event.reason,

        sequence:
          event.sequence,

        createdAt:
          event.createdAt
            .toISOString(),
      }),
    );


  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          Financial governance
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Financial Close
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Lock completed Actual periods, prevent silent historical changes, and retain an auditable record of every close and deliberate reopen event.
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
                    "closed"
                    ?
                      `Financial period ${status.period ?? ""} was closed successfully.`
                    :
                  status.status ===
                    "reopened"
                    ?
                      `Financial period ${status.period ?? ""} was reopened successfully.`
                    :
                      status.message ??
                      "The Financial Close operation could not be completed."
                }
              </div>
            )
          :
            null
      }

      <PeriodCloseWorkspace
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
        owner={
          owner
        }
        register={
          register
        }
        events={
          events
        }
      />
    </div>
  );
}
