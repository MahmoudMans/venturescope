import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  PlanningCycleWorkspace,
} from "@/components/planning-cycle/planning-cycle-workspace";

import {
  requireCurrentUserIdentity,
} from "@/lib/auth/current-user";

import {
  prisma,
} from "@/lib/db/prisma";

import {
  parseBaselineKind,
  parseForecastBaselineSnapshot,
} from "@/lib/finance/planning-cycle/baseline";

import {
  getOwnedProject,
  getProjectForEditor,
} from "@/lib/projects/project-access";


export const metadata: Metadata = {
  title:
    "Planning Cycle",

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


export default async function PlanningCyclePage({
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

      name?:
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
    storedBaselines,
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

      prisma.forecastBaseline.findMany({
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
          20,
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


  const baselines =
    storedBaselines.map(
      (
        baseline,
      ) => ({
        id:
          baseline.id,

        name:
          baseline.name,

        kind:
          parseBaselineKind(
            baseline.kind,
          ),

        modelVersion:
          baseline.modelVersion,

        createdAt:
          baseline.createdAt
            .toISOString(),

        createdBy:
          baseline.createdBy?.name ??
          baseline.createdBy?.email ??
          null,

        snapshot:
          parseForecastBaselineSnapshot(
            baseline.snapshot,
          ),
      }),
    );


  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-5 py-8 lg:px-8 lg:py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">
          FP&amp;A planning cycle
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Planning cycle
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Freeze approved plans, compare the live forecast with the original budget, and build a rolling outlook that replaces historical forecast months with observed actual performance.
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
                      `Immutable baseline "${status.name ?? ""}" created successfully.`
                    :
                      status.message ??
                      "The planning-cycle operation could not be completed."
                }
              </div>
            )
          :
            null
      }

      <PlanningCycleWorkspace
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
        baselines={
          baselines
        }
      />
    </div>
  );
}
